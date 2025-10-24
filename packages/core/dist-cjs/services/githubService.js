"use strict";
/**
 * GitHub API integration service
 * Handles GitHub API requests for commits and pull requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubService = void 0;
const logger_1 = require("../utils/logger");
class GitHubService {
    /**
     * Validate GitHub access token and get user info
     */
    static async validateToken(accessToken) {
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
    static async getUserRepositories(accessToken) {
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
    static async getAllAccessibleRepositories(accessToken) {
        logger_1.logger.info('🚀 getAllAccessibleRepositories called - fetching comprehensive repository list...', { component: 'githubService', operation: 'getallaccessiblerepositoriesCalledFetching' });
        const allRepos = [];
        // Get owned and collaborated repositories
        logger_1.logger.info('📂 Fetching owned + collaborator + organization_member repositories...', { component: 'githubService', operation: 'fetchingOwnedCollaborator' });
        await this.fetchRepositoriesFromEndpoint(accessToken, '/user/repos?affiliation=owner,collaborator,organization_member&sort=updated', allRepos);
        logger_1.logger.info(`📊 Found ${allRepos.length} repositories from user/repos with comprehensive affiliation`, { component: 'githubService', operation: 'found${allrepos.length}Repositories' });
        // Also get repositories from organizations the user belongs to
        try {
            logger_1.logger.info('🏢 Fetching user organizations...', { component: 'githubService', operation: 'fetchingUserOrganizations...' });
            const orgs = await this.getUserOrganizations(accessToken);
            logger_1.logger.info(`🏢 Found ${orgs.length} organizations: ${orgs.map(org => org.login).join(', ')}`, { component: 'githubService', operation: 'found${orgs.length}Organizations:' });
            for (const org of orgs) {
                const beforeCount = allRepos.length;
                await this.fetchRepositoriesFromEndpoint(accessToken, `/orgs/${org.login}/repos?sort=updated`, allRepos, org.login);
                logger_1.logger.info(`📊 Added ${allRepos.length - beforeCount} repositories from organization ${org.login}`, { component: 'githubService', operation: 'added${allrepos.lengthBeforecount}' });
            }
        }
        catch (error) {
            logger_1.logger.warn('⚠️ Could not fetch organization repositories', { component: 'githubService', operation: 'couldNotFetch' });
        }
        logger_1.logger.info(`📊 Total repositories before deduplication: ${allRepos.length}`, { component: 'githubService', operation: 'totalRepositoriesBefore' });
        // Remove duplicates based on repository ID
        const uniqueRepos = allRepos.filter((repo, index, self) => index === self.findIndex(r => r.id === repo.id));
        logger_1.logger.info(`📚 Found ${uniqueRepos.length} total accessible repositories (owned + collaborator + org) after deduplication`, { component: 'githubService', operation: 'found${uniquerepos.length}Total' });
        logger_1.logger.info(`🔍 Sample repositories: ${uniqueRepos.slice(0, 5).map(r => r.full_name).join(', ')}${uniqueRepos.length > 5 ? '...' : ''}`, { component: 'githubService', operation: 'operation' });
        return uniqueRepos;
    }
    /**
     * Helper method to fetch repositories from a specific endpoint with pagination
     */
    static async fetchRepositoriesFromEndpoint(accessToken, endpoint, allRepos, orgName) {
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
                    logger_1.logger.warn(`Access denied to ${orgName || 'repositories'}: ${response.statusText}`, { component: 'githubService', operation: 'accessDenied' });
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
    static async getUserOrganizations(accessToken) {
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
    static async getRecentActiveRepositories(accessToken) {
        const user = await this.validateToken(accessToken);
        logger_1.logger.info('🔍 Getting all accessible repositories for recent activity check...', { component: 'githubService', operation: 'gettingAllAccessible' });
        const allRepos = await this.getAllAccessibleRepositories(accessToken); // Get ALL accessible repositories
        logger_1.logger.info(`📚 Found ${allRepos.length} accessible repositories to check for recent activity`, { component: 'githubService', operation: 'found${allrepos.length}Accessible' });
        // Filter to repositories where user has made recent commits or PRs
        const activeRepos = [];
        for (const repo of allRepos.slice(0, 20)) { // Check first 20 repos for activity
            try {
                // Check if user has recent commits in this repo
                const recentCommits = await this.getRepositoryCommits(accessToken, repo.full_name.split('/')[0], repo.full_name.split('/')[1], new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                user.login);
                if (recentCommits.length > 0) {
                    activeRepos.push(repo);
                }
                if (activeRepos.length >= 10) {
                    break; // We have enough active repos
                }
            }
            catch (error) {
                // Skip repos we can't access or have errors
                logger_1.logger.warn(`Could not check activity for ${repo.full_name}: ${error}`, { component: 'githubService', operation: 'couldNotCheck' });
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
    static async getRepositoryCommits(accessToken, owner, repo, since, author) {
        const params = new URLSearchParams();
        if (since) {
            params.append('since', since.toISOString());
        }
        if (author) {
            params.append('author', author);
        }
        params.append('per_page', '100');
        const response = await fetch(`${this.BASE_URL}/repos/${owner}/${repo}/commits?${params.toString()}`, {
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });
        if (!response.ok) {
            throw new Error(`GitHub commits request failed: ${response.statusText}`);
        }
        const commits = await response.json();
        return commits.map((commit) => ({
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
    static async getRepositoryPullRequests(accessToken, owner, repo, state = 'all', author) {
        const params = new URLSearchParams({
            state: state,
            per_page: '100',
            sort: 'updated',
            direction: 'desc',
        });
        const response = await fetch(`${this.BASE_URL}/repos/${owner}/${repo}/pulls?${params.toString()}`, {
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });
        if (!response.ok) {
            throw new Error(`GitHub pull requests request failed: ${response.statusText}`);
        }
        const pullRequests = await response.json();
        // Filter by author if specified
        let filteredPRs = pullRequests;
        if (author) {
            filteredPRs = pullRequests.filter((pr) => pr.user.login === author);
        }
        return filteredPRs.map((pr) => ({
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
    static async getAllUserCommits(accessToken, repositories, since) {
        const user = await this.validateToken(accessToken);
        const allCommits = [];
        for (const repoFullName of repositories) {
            try {
                const [owner, repo] = repoFullName.split('/');
                const commits = await this.getRepositoryCommits(accessToken, owner, repo, since, user.login);
                allCommits.push(...commits);
            }
            catch (error) {
                logger_1.logger.error(`Failed to fetch commits for ${repoFullName}:`, { component: 'githubService', operation: 'failedFetchCommits' }, error);
                // Continue with other repositories
            }
        }
        // Sort by commit date (newest first)
        return allCommits.sort((a, b) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime());
    }
    /**
     * Get pull requests across all user's repositories
     */
    static async getAllUserPullRequests(accessToken, repositories, state = 'all') {
        const user = await this.validateToken(accessToken);
        const allPullRequests = [];
        for (const repoFullName of repositories) {
            try {
                const [owner, repo] = repoFullName.split('/');
                const pullRequests = await this.getRepositoryPullRequests(accessToken, owner, repo, state, user.login);
                allPullRequests.push(...pullRequests);
            }
            catch (error) {
                logger_1.logger.error(`Failed to fetch pull requests for ${repoFullName}:`, { component: 'githubService', operation: 'failedFetchPull' }, error);
                // Continue with other repositories
            }
        }
        // Sort by updated date (newest first)
        return allPullRequests.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    /**
     * Get activity summary for the user
     */
    static async getActivitySummary(accessToken, repositories, since) {
        const [commits, pullRequests] = await Promise.all([
            this.getAllUserCommits(accessToken, repositories, since),
            this.getAllUserPullRequests(accessToken, repositories, 'all'),
        ]);
        // Filter PRs by date if since is provided
        let filteredPRs = pullRequests;
        if (since) {
            filteredPRs = pullRequests.filter(pr => new Date(pr.updated_at) >= since);
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
    static async getTodaysPullRequestsMultiToken(tokens, startOfDay, endOfDay) {
        logger_1.logger.info(`🚀 Using multi-token approach with ${tokens.length} tokens...`, { component: 'githubService', operation: 'usingMulti-tokenApproach' });
        const allPullRequests = [];
        const activeTokens = tokens.filter(t => t.isActive);
        if (activeTokens.length === 0) {
            logger_1.logger.warn('⚠️ No active tokens found', { component: 'githubService', operation: 'activeTokensFound' });
            return [];
        }
        logger_1.logger.info(`📊 Found ${activeTokens.length} active tokens to query`, { component: 'githubService', operation: 'found${activetokens.length}Active' });
        // Process all active tokens in parallel for better performance
        const tokenPromises = activeTokens.map(async (tokenInfo) => {
            try {
                logger_1.logger.info(`🔍 Processing token for user: ${tokenInfo.username}`, { component: 'githubService', operation: 'processingTokenFor' });
                const tokenPRs = await this.getTodaysPullRequestsSingleToken(tokenInfo.token, null, // Use GraphQL for comprehensive PR fetching
                startOfDay, endOfDay);
                logger_1.logger.info(`✅ Token ${tokenInfo.username}: Found ${tokenPRs.length} PRs from today`, { component: 'githubService', operation: 'token${tokeninfo.username}:Found' });
                return tokenPRs;
            }
            catch (error) {
                logger_1.logger.error(`❌ Failed to fetch PRs for token ${tokenInfo.username}:`, { component: 'githubService', operation: 'failedFetchPrs' }, error);
                return [];
            }
        });
        // Wait for all token queries to complete
        const tokenResults = await Promise.allSettled(tokenPromises);
        // Collect results from successful queries
        tokenResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                allPullRequests.push(...result.value);
            }
            else {
                logger_1.logger.error(`❌ Token ${activeTokens[index].username} query failed:`, { component: 'githubService', operation: 'token${activetokens[index].username}Query' }, result.reason);
            }
        });
        logger_1.logger.info(`📊 Total PRs collected from all tokens: ${allPullRequests.length}`, { component: 'githubService', operation: 'totalPrsCollected' });
        // Deduplicate PRs by URL (same PR might be accessible through multiple tokens)
        const uniquePRs = this.deduplicatePullRequests(allPullRequests);
        logger_1.logger.info(`✅ After deduplication: ${uniquePRs.length} unique PRs from today`, { component: 'githubService', operation: 'afterDeduplication:${uniqueprs.length}' });
        return uniquePRs;
    }
    /**
     * Get pull requests from today only using GitHub GraphQL API (backward compatibility method)
     * This queries ALL pull requests by the user, regardless of repository ownership
     */
    static async getTodaysPullRequests(accessToken, repositories, // null means fetch from all repositories using GraphQL
    startOfDay, endOfDay) {
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
    static async getTodaysPullRequestsSingleToken(accessToken, repositories, // null means fetch from all repositories using GraphQL
    startOfDay, endOfDay) {
        const user = await this.validateToken(accessToken);
        // If specific repositories are provided, use the old REST API approach
        if (repositories !== null) {
            logger_1.logger.info(`📚 Using REST API for ${repositories.length} specified repositories`, { component: 'githubService', operation: 'usingRestApi' });
            return this.getTodaysPullRequestsSingleToken(accessToken, repositories, startOfDay, endOfDay);
        }
        // Use GraphQL to query all PRs by the user directly
        logger_1.logger.info('🚀 Using GitHub GraphQL API to fetch all PRs by user (regardless of repository)...', { component: 'githubService', operation: 'usingGithubGraphql' });
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
        const allPullRequests = [];
        let hasNextPage = true;
        let cursor = null;
        let pageCount = 0;
        try {
            while (hasNextPage && pageCount < 10) { // Limit to 10 pages (1000 PRs max) to avoid excessive API calls
                pageCount++;
                logger_1.logger.info(`🔍 Fetching GraphQL page ${pageCount}...`, { component: 'githubService', operation: 'fetchingGraphqlPage' });
                const response = await fetch('https://api.github.com/graphql', {
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
                const data = await response.json();
                if (data.errors) {
                    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
                }
                const pullRequests = data.data?.user?.pullRequests;
                if (!pullRequests) {
                    logger_1.logger.warn('No pull requests data returned from GraphQL', { component: 'githubService', operation: 'pullRequestsData' });
                    break;
                }
                allPullRequests.push(...pullRequests.nodes);
                hasNextPage = pullRequests.pageInfo.hasNextPage;
                cursor = pullRequests.pageInfo.endCursor;
                logger_1.logger.info(`📊 Page ${pageCount}: Found ${pullRequests.nodes.length} PRs, total so far: ${allPullRequests.length}`, { component: 'githubService', operation: 'operation' });
            }
            logger_1.logger.info(`📚 GraphQL API returned ${allPullRequests.length} total PRs by user ${user.login}`, { component: 'githubService', operation: 'graphqlApiReturned' });
            // Log all PRs returned for debugging
            logger_1.logger.info('🔍 All PRs returned by GraphQL:', { component: 'githubService', operation: 'allPrsReturned' });
            allPullRequests.forEach((pr, index) => {
                const createdDate = new Date(pr.createdAt);
                const updatedDate = new Date(pr.updatedAt);
                logger_1.logger.info(`   ${index + 1}. #${pr.number} in ${pr.repository.nameWithOwner}: "${pr.title}"`, { component: 'githubService', operation: '${index1}.#${pr.number}' });
                logger_1.logger.info(`      State: ${pr.state}, Created: ${createdDate.toISOString()}`, { component: 'githubService', operation: 'operation' });
                logger_1.logger.info(`      Updated: ${updatedDate.toISOString()}`, { component: 'githubService', operation: 'updated:${updateddate.toisostring()}' });
                logger_1.logger.info(`      Created (local): ${createdDate.toLocaleString()}`, { component: 'githubService', operation: 'created(local):${createddate.tolocalestring()}' });
                logger_1.logger.info(`      Updated (local): ${updatedDate.toLocaleString()}`, { component: 'githubService', operation: 'updated(local):${updateddate.tolocalestring()}' });
            });
            // Use user's local timezone for date comparison
            const now = new Date();
            const localStartOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const localEndOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            logger_1.logger.info(`📅 User's local timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`, { component: 'githubService', operation: 'user' });
            logger_1.logger.info(`📅 Local date range for "today": ${localStartOfDay.toLocaleString()} to ${localEndOfDay.toLocaleString()}`, { component: 'githubService', operation: 'localDateRange' });
            logger_1.logger.info(`📅 UTC date range for "today": ${localStartOfDay.toISOString()} to ${localEndOfDay.toISOString()}`, { component: 'githubService', operation: 'utcDateRange' });
            // Filter PRs that were created or updated today (using local timezone)
            const todaysPullRequests = allPullRequests.filter(pr => {
                const createdDate = new Date(pr.createdAt);
                const updatedDate = new Date(pr.updatedAt);
                const createdToday = createdDate >= localStartOfDay && createdDate <= localEndOfDay;
                const updatedToday = updatedDate >= localStartOfDay && updatedDate <= localEndOfDay;
                logger_1.logger.info(`   🔍 PR #${pr.number}: Created ${createdToday ? '✅' : '❌'} today, Updated ${updatedToday ? '✅' : '❌'} today`, { component: 'githubService', operation: '#${pr.number}:Created${createdtoday' });
                return createdToday || updatedToday;
            });
            logger_1.logger.info(`✅ Found ${todaysPullRequests.length} PRs from today (created or updated in local timezone)`, { component: 'githubService', operation: 'found${todayspullrequests.length}Prs' });
            if (todaysPullRequests.length > 0) {
                logger_1.logger.info("📝 Today's PRs:", { component: 'githubService', operation: 'todaysPrs' });
                todaysPullRequests.forEach(pr => {
                    logger_1.logger.info(`   ✅ #${pr.number} in ${pr.repository.nameWithOwner}: "${pr.title}" (${pr.state})`, { component: 'githubService', operation: '#${pr.number}${pr.repository.namewithowner}:' });
                });
            }
            // Convert GraphQL format to REST API format for compatibility
            const convertedPRs = todaysPullRequests.map(pr => ({
                id: parseInt(pr.id.replace('PR_', '')), // Convert GraphQL ID to numeric
                number: pr.number,
                title: pr.title,
                body: pr.body,
                state: pr.state.toLowerCase(),
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
            return convertedPRs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        }
        catch (error) {
            logger_1.logger.error('❌ GraphQL query failed', { component: 'githubService', operation: 'graphqlQueryFailed' }, error);
            // Fallback to REST API approach with accessible repositories
            logger_1.logger.info('🔄 Falling back to REST API with comprehensive repository access...', { component: 'githubService', operation: 'fallingBackRest' });
            const allRepos = await this.getAllAccessibleRepositories(accessToken);
            const repoList = allRepos.map(repo => repo.full_name);
            return this.getTodaysPullRequestsREST(accessToken, repoList, startOfDay, endOfDay);
        }
    }
    /**
     * Get pull requests from today using REST API (fallback method)
     */
    static async getTodaysPullRequestsREST(accessToken, repositories, startOfDay, endOfDay) {
        const user = await this.validateToken(accessToken);
        const todaysPullRequests = [];
        logger_1.logger.info(`📚 REST API: Checking PRs from ${repositories.length} repositories`, { component: 'githubService', operation: 'restApi:Checking' });
        let reposChecked = 0;
        let totalPRsFound = 0;
        for (const repoFullName of repositories.slice(0, 50)) { // Limit to first 50 repos to avoid excessive API calls
            try {
                const [owner, repo] = repoFullName.split('/');
                reposChecked++;
                logger_1.logger.info(`🔍 Checking repository ${reposChecked}/${Math.min(repositories.length, 50)}: ${repoFullName}`, { component: 'githubService', operation: 'operation' });
                // Get PRs by the authenticated user only
                const allPRsByUser = await this.getRepositoryPullRequests(accessToken, owner, repo, 'all', // Get all states (open, closed, merged)
                user.login // Only get PRs created by the authenticated user
                );
                logger_1.logger.info(`📊 Repository ${repoFullName}: ${allPRsByUser.length} PRs by user ${user.login}`, { component: 'githubService', operation: 'repository${repofullname}:${allprsbyuser.length}' });
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
                    logger_1.logger.info(`📝 Found ${todaysPRs.length} PR(s) from today in ${repoFullName}`, { component: 'githubService', operation: 'found${todaysprs.length}Pr(s)' });
                    for (const pr of todaysPRs) {
                        logger_1.logger.info(`   ✅ PR #${pr.number}: "${pr.title}" (${pr.state})`, { component: 'githubService', operation: '#${pr.number}:' });
                    }
                }
                todaysPullRequests.push(...todaysPRs);
            }
            catch (error) {
                logger_1.logger.error(`❌ Failed to fetch today's pull requests for ${repoFullName}:`, { component: 'githubService', operation: 'failedFetchToday' }, error);
                // Continue with other repositories
            }
        }
        logger_1.logger.info(`📊 REST API Summary: Checked ${reposChecked} repositories, found ${totalPRsFound} total PRs by user`, { component: 'githubService', operation: 'operation' });
        logger_1.logger.info(`✅ Total PRs from today: ${todaysPullRequests.length}`, { component: 'githubService', operation: 'totalPrsFrom' });
        // Sort by updated date (newest first)
        return todaysPullRequests.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    /**
     * Deduplicate pull requests by URL to handle PRs accessible through multiple tokens
     */
    static deduplicatePullRequests(pullRequests) {
        const seen = new Set();
        const uniquePRs = [];
        for (const pr of pullRequests) {
            const key = pr.html_url; // Use URL as unique identifier
            if (!seen.has(key)) {
                seen.add(key);
                uniquePRs.push(pr);
            }
        }
        logger_1.logger.info(`🔄 Deduplicated ${pullRequests.length} PRs down to ${uniquePRs.length} unique PRs`, { component: 'githubService', operation: 'deduplicated${pullrequests.length}Prs' });
        return uniquePRs;
    }
    /**
     * Validate multiple GitHub tokens and return their info
     */
    static async validateTokens(tokens) {
        logger_1.logger.info(`🔍 Validating ${tokens.length} GitHub tokens...`, { component: 'githubService', operation: 'validating${tokens.length}Github' });
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
            }
            catch (error) {
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
            }
            else {
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
    static async getMultiTokenRepositoryStats(tokens) {
        const activeTokens = tokens.filter(t => t.isActive);
        if (activeTokens.length === 0) {
            return {
                totalRepositories: 0,
                repositoriesByToken: []
            };
        }
        logger_1.logger.info(`📊 Getting repository stats for ${activeTokens.length} active tokens...`, { component: 'githubService', operation: 'gettingRepositoryStats' });
        const tokenPromises = activeTokens.map(async (tokenInfo) => {
            try {
                const repos = await this.getAllAccessibleRepositories(tokenInfo.token);
                return {
                    tokenId: tokenInfo.id,
                    username: tokenInfo.username,
                    count: repos.length,
                    repositories: repos
                };
            }
            catch (error) {
                logger_1.logger.error(`❌ Failed to get repositories for token ${tokenInfo.username}:`, { component: 'githubService', operation: 'failedGetRepositories' }, error);
                return {
                    tokenId: tokenInfo.id,
                    username: tokenInfo.username,
                    count: 0,
                    repositories: []
                };
            }
        });
        const results = await Promise.allSettled(tokenPromises);
        const repositoriesByToken = [];
        let allRepos = [];
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
        const uniqueRepos = allRepos.filter((repo, index, self) => index === self.findIndex(r => r.id === repo.id));
        logger_1.logger.info(`📚 Total unique repositories across all tokens: ${uniqueRepos.length}`, { component: 'githubService', operation: 'totalUniqueRepositories' });
        return {
            totalRepositories: uniqueRepos.length,
            repositoriesByToken
        };
    }
}
exports.GitHubService = GitHubService;
GitHubService.BASE_URL = 'https://api.github.com';
