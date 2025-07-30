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
}