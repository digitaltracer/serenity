/**
 * GitHub API integration service
 * Handles GitHub API requests for commits and pull requests
 */

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
  repository: {
    name: string;
    full_name: string;
  };
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed' | 'merged';
  created_at: string;
  updated_at: string;
  merged_at?: string;
  closed_at?: string;
  html_url: string;
  user: {
    login: string;
  };
  repository: {
    name: string;
    full_name: string;
  };
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description?: string;
  updated_at: string;
}

export class GitHubService {
  private static readonly BASE_URL = 'https://api.github.com';

  /**
   * Validate GitHub access token and get user info
   */
  static async validateToken(accessToken: string): Promise<{
    login: string;
    name: string;
    email: string;
  }> {
    const response = await fetch(`${this.BASE_URL}/user`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      login: data.login,
      name: data.name,
      email: data.email,
    };
  }

  /**
   * Get user's repositories
   */
  static async getUserRepositories(accessToken: string): Promise<GitHubRepository[]> {
    const response = await fetch(`${this.BASE_URL}/user/repos?per_page=100&sort=updated`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub repositories request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Get all repositories the token has access to (owned + collaborator + organization repos)
   * This includes ALL repositories where the user can create PRs, not just owned ones
   */
  static async getAllAccessibleRepositories(accessToken: string): Promise<GitHubRepository[]> {
    console.log('🚀 getAllAccessibleRepositories called - fetching comprehensive repository list...');
    const allRepos: GitHubRepository[] = [];
    
    // Get owned and collaborated repositories
    console.log('📂 Fetching owned + collaborator + organization_member repositories...');
    await this.fetchRepositoriesFromEndpoint(
      accessToken, 
      '/user/repos?affiliation=owner,collaborator,organization_member&sort=updated',
      allRepos
    );
    console.log(`📊 Found ${allRepos.length} repositories from user/repos with comprehensive affiliation`);
    
    // Also get repositories from organizations the user belongs to
    try {
      console.log('🏢 Fetching user organizations...');
      const orgs = await this.getUserOrganizations(accessToken);
      console.log(`🏢 Found ${orgs.length} organizations: ${orgs.map(org => org.login).join(', ')}`);
      
      for (const org of orgs) {
        const beforeCount = allRepos.length;
        await this.fetchRepositoriesFromEndpoint(
          accessToken,
          `/orgs/${org.login}/repos?sort=updated`,
          allRepos,
          org.login
        );
        console.log(`📊 Added ${allRepos.length - beforeCount} repositories from organization ${org.login}`);
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch organization repositories:', error);
    }
    
    console.log(`📊 Total repositories before deduplication: ${allRepos.length}`);
    
    // Remove duplicates based on repository ID
    const uniqueRepos = allRepos.filter((repo, index, self) => 
      index === self.findIndex(r => r.id === repo.id)
    );
    
    console.log(`📚 Found ${uniqueRepos.length} total accessible repositories (owned + collaborator + org) after deduplication`);
    console.log(`🔍 Sample repositories: ${uniqueRepos.slice(0, 5).map(r => r.full_name).join(', ')}${uniqueRepos.length > 5 ? '...' : ''}`);
    
    return uniqueRepos;
  }

  /**
   * Helper method to fetch repositories from a specific endpoint with pagination
   */
  private static async fetchRepositoriesFromEndpoint(
    accessToken: string, 
    endpoint: string, 
    allRepos: GitHubRepository[],
    orgName?: string
  ): Promise<void> {
    let page = 1;
    const perPage = 100;
    const maxRepos = 200; // Reasonable limit per endpoint to prevent excessive API calls
    
    while (allRepos.length < maxRepos) {
      const url = endpoint.includes('?') 
        ? `${this.BASE_URL}${endpoint}&per_page=${perPage}&page=${page}`
        : `${this.BASE_URL}${endpoint}?per_page=${perPage}&page=${page}`;
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          console.warn(`Access denied to ${orgName || 'repositories'}: ${response.statusText}`);
          break;
        }
        throw new Error(`GitHub repositories request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.length === 0) {
        break; // No more repositories
      }
      
      allRepos.push(...data);
      
      if (data.length < perPage) {
        break; // Last page
      }
      
      page++;
    }
  }

  /**
   * Get user's organizations
   */
  static async getUserOrganizations(accessToken: string): Promise<Array<{ login: string; id: number }>> {
    const response = await fetch(`${this.BASE_URL}/user/orgs`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub organizations request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get repositories where user has made recent changes (last 10 active)
   * This is for display purposes in the UI
   */
  static async getRecentActiveRepositories(accessToken: string): Promise<GitHubRepository[]> {
    const user = await this.validateToken(accessToken);
    console.log('🔍 Getting all accessible repositories for recent activity check...');
    const allRepos = await this.getAllAccessibleRepositories(accessToken); // Get ALL accessible repositories
    console.log(`📚 Found ${allRepos.length} accessible repositories to check for recent activity`);
    
    // Filter to repositories where user has made recent commits or PRs
    const activeRepos: GitHubRepository[] = [];
    
    for (const repo of allRepos.slice(0, 20)) { // Check first 20 repos for activity
      try {
        // Check if user has recent commits in this repo
        const recentCommits = await this.getRepositoryCommits(
          accessToken,
          repo.full_name.split('/')[0],
          repo.full_name.split('/')[1],
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          user.login
        );
        
        if (recentCommits.length > 0) {
          activeRepos.push(repo);
        }
        
        if (activeRepos.length >= 10) {
          break; // We have enough active repos
        }
      } catch (error) {
        // Skip repos we can't access or have errors
        console.warn(`Could not check activity for ${repo.full_name}:`, error);
        continue;
      }
    }
    
    // If we don't have 10 active repos, fill with most recently updated repos
    if (activeRepos.length < 10) {
      const remainingRepos = allRepos
        .filter(repo => !activeRepos.find(active => active.id === repo.id))
        .slice(0, 10 - activeRepos.length);
      activeRepos.push(...remainingRepos);
    }
    
    return activeRepos.slice(0, 10);
  }

  /**
   * Get commits for a specific repository since a date
   */
  static async getRepositoryCommits(
    accessToken: string,
    owner: string,
    repo: string,
    since?: Date,
    author?: string
  ): Promise<GitHubCommit[]> {
    const params = new URLSearchParams();
    if (since) {
      params.append('since', since.toISOString());
    }
    if (author) {
      params.append('author', author);
    }
    params.append('per_page', '100');

    const response = await fetch(
      `${this.BASE_URL}/repos/${owner}/${repo}/commits?${params.toString()}`,
      {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub commits request failed: ${response.statusText}`);
    }

    const commits = await response.json();
    return commits.map((commit: any) => ({
      ...commit,
      repository: {
        name: repo,
        full_name: `${owner}/${repo}`,
      },
    }));
  }

  /**
   * Get pull requests for a specific repository
   */
  static async getRepositoryPullRequests(
    accessToken: string,
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'all',
    author?: string
  ): Promise<GitHubPullRequest[]> {
    const params = new URLSearchParams({
      state: state,
      per_page: '100',
      sort: 'updated',
      direction: 'desc',
    });

    const response = await fetch(
      `${this.BASE_URL}/repos/${owner}/${repo}/pulls?${params.toString()}`,
      {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub pull requests request failed: ${response.statusText}`);
    }

    const pullRequests = await response.json();
    
    // Filter by author if specified
    let filteredPRs = pullRequests;
    if (author) {
      filteredPRs = pullRequests.filter((pr: any) => pr.user.login === author);
    }

    return filteredPRs.map((pr: any) => ({
      ...pr,
      repository: {
        name: repo,
        full_name: `${owner}/${repo}`,
      },
    }));
  }

  /**
   * Get commits across all user's repositories since a date
   */
  static async getAllUserCommits(
    accessToken: string,
    repositories: string[],
    since?: Date
  ): Promise<GitHubCommit[]> {
    const user = await this.validateToken(accessToken);
    const allCommits: GitHubCommit[] = [];

    for (const repoFullName of repositories) {
      try {
        const [owner, repo] = repoFullName.split('/');
        const commits = await this.getRepositoryCommits(
          accessToken,
          owner,
          repo,
          since,
          user.login
        );
        allCommits.push(...commits);
      } catch (error) {
        console.error(`Failed to fetch commits for ${repoFullName}:`, error);
        // Continue with other repositories
      }
    }

    // Sort by commit date (newest first)
    return allCommits.sort((a, b) => 
      new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()
    );
  }

  /**
   * Get pull requests across all user's repositories
   */
  static async getAllUserPullRequests(
    accessToken: string,
    repositories: string[],
    state: 'open' | 'closed' | 'all' = 'all'
  ): Promise<GitHubPullRequest[]> {
    const user = await this.validateToken(accessToken);
    const allPullRequests: GitHubPullRequest[] = [];

    for (const repoFullName of repositories) {
      try {
        const [owner, repo] = repoFullName.split('/');
        const pullRequests = await this.getRepositoryPullRequests(
          accessToken,
          owner,
          repo,
          state,
          user.login
        );
        allPullRequests.push(...pullRequests);
      } catch (error) {
        console.error(`Failed to fetch pull requests for ${repoFullName}:`, error);
        // Continue with other repositories
      }
    }

    // Sort by updated date (newest first)
    return allPullRequests.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  /**
   * Get activity summary for the user
   */
  static async getActivitySummary(
    accessToken: string,
    repositories: string[],
    since?: Date
  ): Promise<{
    commits: GitHubCommit[];
    pullRequests: GitHubPullRequest[];
    totalCommits: number;
    totalPullRequests: number;
  }> {
    const [commits, pullRequests] = await Promise.all([
      this.getAllUserCommits(accessToken, repositories, since),
      this.getAllUserPullRequests(accessToken, repositories, 'all'),
    ]);

    // Filter PRs by date if since is provided
    let filteredPRs = pullRequests;
    if (since) {
      filteredPRs = pullRequests.filter(pr => 
        new Date(pr.updated_at) >= since
      );
    }

    return {
      commits,
      pullRequests: filteredPRs,
      totalCommits: commits.length,
      totalPullRequests: filteredPRs.length,
    };
  }

  /**
   * Get pull requests from today using multiple GitHub tokens
   * This queries ALL pull requests by the user across all tokens, regardless of repository ownership
   */
  static async getTodaysPullRequestsMultiToken(
    tokens: Array<{ id: string; token: string; username: string; isActive: boolean }>,
    startOfDay: Date,
    endOfDay: Date
  ): Promise<GitHubPullRequest[]> {
    console.log(`🚀 Using multi-token approach with ${tokens.length} tokens...`);
    
    const allPullRequests: GitHubPullRequest[] = [];
    const activeTokens = tokens.filter(t => t.isActive);
    
    if (activeTokens.length === 0) {
      console.warn('⚠️ No active tokens found');
      return [];
    }
    
    console.log(`📊 Found ${activeTokens.length} active tokens to query`);
    
    // Process all active tokens in parallel for better performance
    const tokenPromises = activeTokens.map(async (tokenInfo) => {
      try {
        console.log(`🔍 Processing token for user: ${tokenInfo.username}`);
        
        const tokenPRs = await this.getTodaysPullRequestsSingleToken(
          tokenInfo.token,
          null, // Use GraphQL for comprehensive PR fetching
          startOfDay,
          endOfDay
        );
        
        console.log(`✅ Token ${tokenInfo.username}: Found ${tokenPRs.length} PRs from today`);
        return tokenPRs;
      } catch (error) {
        console.error(`❌ Failed to fetch PRs for token ${tokenInfo.username}:`, error);
        return [];
      }
    });
    
    // Wait for all token queries to complete
    const tokenResults = await Promise.allSettled(tokenPromises);
    
    // Collect results from successful queries
    tokenResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allPullRequests.push(...result.value);
      } else {
        console.error(`❌ Token ${activeTokens[index].username} query failed:`, result.reason);
      }
    });
    
    console.log(`📊 Total PRs collected from all tokens: ${allPullRequests.length}`);
    
    // Deduplicate PRs by URL (same PR might be accessible through multiple tokens)
    const uniquePRs = this.deduplicatePullRequests(allPullRequests);
    
    console.log(`✅ After deduplication: ${uniquePRs.length} unique PRs from today`);
    
    return uniquePRs;
  }

  /**
   * Get pull requests from today only using GitHub GraphQL API (backward compatibility method)
   * This queries ALL pull requests by the user, regardless of repository ownership
   */
  static async getTodaysPullRequests(
    accessToken: string,
    repositories: string[] | null, // null means fetch from all repositories using GraphQL
    startOfDay: Date,
    endOfDay: Date
  ): Promise<GitHubPullRequest[]> {
    // For backward compatibility, convert single token to multi-token format
    const user = await this.validateToken(accessToken);
    const tokens = [{
      id: 'default',
      token: accessToken,
      username: user.login,
      isActive: true
    }];
    
    return this.getTodaysPullRequestsMultiToken(tokens, startOfDay, endOfDay);
  }

  /**
   * Get pull requests from today only using GitHub GraphQL API (single token)
   * This queries ALL pull requests by the user, regardless of repository ownership
   */
  static async getTodaysPullRequestsSingleToken(
    accessToken: string,
    repositories: string[] | null, // null means fetch from all repositories using GraphQL
    startOfDay: Date,
    endOfDay: Date
  ): Promise<GitHubPullRequest[]> {
    const user = await this.validateToken(accessToken);
    
    // If specific repositories are provided, use the old REST API approach
    if (repositories !== null) {
      console.log(`📚 Using REST API for ${repositories.length} specified repositories`);
      return this.getTodaysPullRequestsSingleToken(accessToken, repositories, startOfDay, endOfDay);
    }

    // Use GraphQL to query all PRs by the user directly
    console.log('🚀 Using GitHub GraphQL API to fetch all PRs by user (regardless of repository)...');
    
    const graphqlQuery = `
      query getUserPullRequests($login: String!, $after: String) {
        user(login: $login) {
          pullRequests(first: 100, after: $after, orderBy: {field: UPDATED_AT, direction: DESC}) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              number
              title
              body
              state
              createdAt
              updatedAt
              mergedAt
              closedAt
              url
              author {
                login
              }
              repository {
                name
                nameWithOwner
                isPrivate
              }
            }
          }
        }
      }
    `;

    const allPullRequests: any[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
    let pageCount = 0;

    try {
      while (hasNextPage && pageCount < 10) { // Limit to 10 pages (1000 PRs max) to avoid excessive API calls
        pageCount++;
        console.log(`🔍 Fetching GraphQL page ${pageCount}...`);
        
        const response: Response = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: graphqlQuery,
            variables: {
              login: user.login,
              after: cursor
            }
          })
        });

        if (!response.ok) {
          throw new Error(`GitHub GraphQL request failed: ${response.statusText}`);
        }

        const data: any = await response.json();
        
        if (data.errors) {
          throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
        }

        const pullRequests: any = data.data?.user?.pullRequests;
        if (!pullRequests) {
          console.warn('No pull requests data returned from GraphQL');
          break;
        }

        allPullRequests.push(...pullRequests.nodes);
        hasNextPage = pullRequests.pageInfo.hasNextPage;
        cursor = pullRequests.pageInfo.endCursor;
        
        console.log(`📊 Page ${pageCount}: Found ${pullRequests.nodes.length} PRs, total so far: ${allPullRequests.length}`);
      }

      console.log(`📚 GraphQL API returned ${allPullRequests.length} total PRs by user ${user.login}`);

      // Log all PRs returned for debugging
      console.log('🔍 All PRs returned by GraphQL:');
      allPullRequests.forEach((pr, index) => {
        const createdDate = new Date(pr.createdAt);
        const updatedDate = new Date(pr.updatedAt);
        console.log(`   ${index + 1}. #${pr.number} in ${pr.repository.nameWithOwner}: "${pr.title}"`);
        console.log(`      State: ${pr.state}, Created: ${createdDate.toISOString()}`);
        console.log(`      Updated: ${updatedDate.toISOString()}`);
        console.log(`      Created (local): ${createdDate.toLocaleString()}`);
        console.log(`      Updated (local): ${updatedDate.toLocaleString()}`);
      });

      // Use user's local timezone for date comparison
      const now = new Date();
      const localStartOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const localEndOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      
      console.log(`📅 User's local timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
      console.log(`📅 Local date range for "today": ${localStartOfDay.toLocaleString()} to ${localEndOfDay.toLocaleString()}`);
      console.log(`📅 UTC date range for "today": ${localStartOfDay.toISOString()} to ${localEndOfDay.toISOString()}`);

      // Filter PRs that were created or updated today (using local timezone)
      const todaysPullRequests = allPullRequests.filter(pr => {
        const createdDate = new Date(pr.createdAt);
        const updatedDate = new Date(pr.updatedAt);
        
        const createdToday = createdDate >= localStartOfDay && createdDate <= localEndOfDay;
        const updatedToday = updatedDate >= localStartOfDay && updatedDate <= localEndOfDay;
        
        console.log(`   🔍 PR #${pr.number}: Created ${createdToday ? '✅' : '❌'} today, Updated ${updatedToday ? '✅' : '❌'} today`);
        
        return createdToday || updatedToday;
      });

      console.log(`✅ Found ${todaysPullRequests.length} PRs from today (created or updated in local timezone)`);

      if (todaysPullRequests.length > 0) {
        console.log('📝 Today\'s PRs:');
        todaysPullRequests.forEach(pr => {
          console.log(`   ✅ #${pr.number} in ${pr.repository.nameWithOwner}: "${pr.title}" (${pr.state})`);
        });
      }

      // Convert GraphQL format to REST API format for compatibility
      const convertedPRs: GitHubPullRequest[] = todaysPullRequests.map(pr => ({
        id: parseInt(pr.id.replace('PR_', '')), // Convert GraphQL ID to numeric
        number: pr.number,
        title: pr.title,
        body: pr.body,
        state: pr.state.toLowerCase() as 'open' | 'closed' | 'merged',
        created_at: pr.createdAt,
        updated_at: pr.updatedAt,
        merged_at: pr.mergedAt,
        closed_at: pr.closedAt,
        html_url: pr.url,
        user: {
          login: pr.author.login
        },
        repository: {
          name: pr.repository.name,
          full_name: pr.repository.nameWithOwner
        }
      }));

      // Sort by updated date (newest first)
      return convertedPRs.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

    } catch (error) {
      console.error('❌ GraphQL query failed, falling back to REST API:', error);
      
      // Fallback to REST API approach with accessible repositories
      console.log('🔄 Falling back to REST API with comprehensive repository access...');
      const allRepos = await this.getAllAccessibleRepositories(accessToken);
      const repoList = allRepos.map(repo => repo.full_name);
      return this.getTodaysPullRequestsREST(accessToken, repoList, startOfDay, endOfDay);
    }
  }

  /**
   * Get pull requests from today using REST API (fallback method)
   */
  private static async getTodaysPullRequestsREST(
    accessToken: string,
    repositories: string[],
    startOfDay: Date,
    endOfDay: Date
  ): Promise<GitHubPullRequest[]> {
    const user = await this.validateToken(accessToken);
    const todaysPullRequests: GitHubPullRequest[] = [];

    console.log(`📚 REST API: Checking PRs from ${repositories.length} repositories`);

    let reposChecked = 0;
    let totalPRsFound = 0;
    
    for (const repoFullName of repositories.slice(0, 50)) { // Limit to first 50 repos to avoid excessive API calls
      try {
        const [owner, repo] = repoFullName.split('/');
        reposChecked++;
        
        console.log(`🔍 Checking repository ${reposChecked}/${Math.min(repositories.length, 50)}: ${repoFullName}`);
        
        // Get PRs by the authenticated user only
        const allPRsByUser = await this.getRepositoryPullRequests(
          accessToken,
          owner,
          repo,
          'all', // Get all states (open, closed, merged)
          user.login // Only get PRs created by the authenticated user
        );
        
        console.log(`📊 Repository ${repoFullName}: ${allPRsByUser.length} PRs by user ${user.login}`);
        
        totalPRsFound += allPRsByUser.length;

        // Filter PRs that were created or updated today
        const todaysPRs = allPRsByUser.filter(pr => {
          const createdDate = new Date(pr.created_at);
          const updatedDate = new Date(pr.updated_at);
          
          const createdToday = createdDate >= startOfDay && createdDate <= endOfDay;
          const updatedToday = updatedDate >= startOfDay && updatedDate <= endOfDay;
          
          return createdToday || updatedToday;
        });
        
        if (todaysPRs.length > 0) {
          console.log(`📝 Found ${todaysPRs.length} PR(s) from today in ${repoFullName}`);
          for (const pr of todaysPRs) {
            console.log(`   ✅ PR #${pr.number}: "${pr.title}" (${pr.state})`);
          }
        }
        
        todaysPullRequests.push(...todaysPRs);
      } catch (error) {
        console.error(`❌ Failed to fetch today's pull requests for ${repoFullName}:`, error);
        // Continue with other repositories
      }
    }
    
    console.log(`📊 REST API Summary: Checked ${reposChecked} repositories, found ${totalPRsFound} total PRs by user`);
    console.log(`✅ Total PRs from today: ${todaysPullRequests.length}`);

    // Sort by updated date (newest first)
    return todaysPullRequests.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  /**
   * Deduplicate pull requests by URL to handle PRs accessible through multiple tokens
   */
  private static deduplicatePullRequests(pullRequests: GitHubPullRequest[]): GitHubPullRequest[] {
    const seen = new Set<string>();
    const uniquePRs: GitHubPullRequest[] = [];
    
    for (const pr of pullRequests) {
      const key = pr.html_url; // Use URL as unique identifier
      if (!seen.has(key)) {
        seen.add(key);
        uniquePRs.push(pr);
      }
    }
    
    console.log(`🔄 Deduplicated ${pullRequests.length} PRs down to ${uniquePRs.length} unique PRs`);
    return uniquePRs;
  }

  /**
   * Validate multiple GitHub tokens and return their info  
   */
  static async validateTokens(tokens: Array<{ id: string; token: string }>): Promise<Array<{
    id: string;
    token: string;
    username: string;
    name: string;
    email: string;
    isValid: boolean;
    error?: string;
  }>> {
    console.log(`🔍 Validating ${tokens.length} GitHub tokens...`);
    
    const validationPromises = tokens.map(async (tokenInfo) => {
      try {
        const userInfo = await this.validateToken(tokenInfo.token);
        return {
          id: tokenInfo.id,
          token: tokenInfo.token,
          username: userInfo.login,
          name: userInfo.name,
          email: userInfo.email,
          isValid: true
        };
      } catch (error) {
        return {
          id: tokenInfo.id,
          token: tokenInfo.token,
          username: '',
          name: '',
          email: '',
          isValid: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
    
    const results = await Promise.allSettled(validationPromises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          id: tokens[index].id,
          token: tokens[index].token,
          username: '',
          name: '',
          email: '',
          isValid: false,
          error: 'Validation failed'
        };
      }
    });
  }

  /**
   * Get repository statistics for all active tokens
   */
  static async getMultiTokenRepositoryStats(
    tokens: Array<{ id: string; token: string; username: string; isActive: boolean }>
  ): Promise<{
    totalRepositories: number;
    repositoriesByToken: Array<{ tokenId: string; username: string; count: number }>;
  }> {
    const activeTokens = tokens.filter(t => t.isActive);
    
    if (activeTokens.length === 0) {
      return {
        totalRepositories: 0,
        repositoriesByToken: []
      };
    }
    
    console.log(`📊 Getting repository stats for ${activeTokens.length} active tokens...`);
    
    const tokenPromises = activeTokens.map(async (tokenInfo) => {
      try {
        const repos = await this.getAllAccessibleRepositories(tokenInfo.token);
        return {
          tokenId: tokenInfo.id,
          username: tokenInfo.username,
          count: repos.length,
          repositories: repos
        };
      } catch (error) {
        console.error(`❌ Failed to get repositories for token ${tokenInfo.username}:`, error);
        return {
          tokenId: tokenInfo.id,
          username: tokenInfo.username,
          count: 0,
          repositories: []
        };
      }
    });
    
    const results = await Promise.allSettled(tokenPromises);
    const repositoriesByToken: Array<{ tokenId: string; username: string; count: number }> = [];
    let allRepos: GitHubRepository[] = [];
    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        repositoriesByToken.push({
          tokenId: result.value.tokenId,
          username: result.value.username,
          count: result.value.count
        });
        allRepos.push(...result.value.repositories);
      }
    });
    
    // Deduplicate repositories by ID
    const uniqueRepos = allRepos.filter((repo, index, self) => 
      index === self.findIndex(r => r.id === repo.id)
    );
    
    console.log(`📚 Total unique repositories across all tokens: ${uniqueRepos.length}`);
    
    return {
      totalRepositories: uniqueRepos.length,
      repositoriesByToken
    };
  }
}