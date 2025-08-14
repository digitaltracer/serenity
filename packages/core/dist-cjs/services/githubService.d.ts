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
export declare class GitHubService {
    private static readonly BASE_URL;
    /**
     * Validate GitHub access token and get user info
     */
    static validateToken(accessToken: string): Promise<{
        login: string;
        name: string;
        email: string;
    }>;
    /**
     * Get user's repositories
     */
    static getUserRepositories(accessToken: string): Promise<GitHubRepository[]>;
    /**
     * Get all repositories the token has access to (owned + collaborator + organization repos)
     * This includes ALL repositories where the user can create PRs, not just owned ones
     */
    static getAllAccessibleRepositories(accessToken: string): Promise<GitHubRepository[]>;
    /**
     * Helper method to fetch repositories from a specific endpoint with pagination
     */
    private static fetchRepositoriesFromEndpoint;
    /**
     * Get user's organizations
     */
    static getUserOrganizations(accessToken: string): Promise<Array<{
        login: string;
        id: number;
    }>>;
    /**
     * Get repositories where user has made recent changes (last 10 active)
     * This is for display purposes in the UI
     */
    static getRecentActiveRepositories(accessToken: string): Promise<GitHubRepository[]>;
    /**
     * Get commits for a specific repository since a date
     */
    static getRepositoryCommits(accessToken: string, owner: string, repo: string, since?: Date, author?: string): Promise<GitHubCommit[]>;
    /**
     * Get pull requests for a specific repository
     */
    static getRepositoryPullRequests(accessToken: string, owner: string, repo: string, state?: 'open' | 'closed' | 'all', author?: string): Promise<GitHubPullRequest[]>;
    /**
     * Get commits across all user's repositories since a date
     */
    static getAllUserCommits(accessToken: string, repositories: string[], since?: Date): Promise<GitHubCommit[]>;
    /**
     * Get pull requests across all user's repositories
     */
    static getAllUserPullRequests(accessToken: string, repositories: string[], state?: 'open' | 'closed' | 'all'): Promise<GitHubPullRequest[]>;
    /**
     * Get activity summary for the user
     */
    static getActivitySummary(accessToken: string, repositories: string[], since?: Date): Promise<{
        commits: GitHubCommit[];
        pullRequests: GitHubPullRequest[];
        totalCommits: number;
        totalPullRequests: number;
    }>;
    /**
     * Get pull requests from today using multiple GitHub tokens
     * This queries ALL pull requests by the user across all tokens, regardless of repository ownership
     */
    static getTodaysPullRequestsMultiToken(tokens: Array<{
        id: string;
        token: string;
        username: string;
        isActive: boolean;
    }>, startOfDay: Date, endOfDay: Date): Promise<GitHubPullRequest[]>;
    /**
     * Get pull requests from today only using GitHub GraphQL API (backward compatibility method)
     * This queries ALL pull requests by the user, regardless of repository ownership
     */
    static getTodaysPullRequests(accessToken: string, repositories: string[] | null, // null means fetch from all repositories using GraphQL
    startOfDay: Date, endOfDay: Date): Promise<GitHubPullRequest[]>;
    /**
     * Get pull requests from today only using GitHub GraphQL API (single token)
     * This queries ALL pull requests by the user, regardless of repository ownership
     */
    static getTodaysPullRequestsSingleToken(accessToken: string, repositories: string[] | null, // null means fetch from all repositories using GraphQL
    startOfDay: Date, endOfDay: Date): Promise<GitHubPullRequest[]>;
    /**
     * Get pull requests from today using REST API (fallback method)
     */
    private static getTodaysPullRequestsREST;
    /**
     * Deduplicate pull requests by URL to handle PRs accessible through multiple tokens
     */
    private static deduplicatePullRequests;
    /**
     * Validate multiple GitHub tokens and return their info
     */
    static validateTokens(tokens: Array<{
        id: string;
        token: string;
    }>): Promise<Array<{
        id: string;
        token: string;
        username: string;
        name: string;
        email: string;
        isValid: boolean;
        error?: string;
    }>>;
    /**
     * Get repository statistics for all active tokens
     */
    static getMultiTokenRepositoryStats(tokens: Array<{
        id: string;
        token: string;
        username: string;
        isActive: boolean;
    }>): Promise<{
        totalRepositories: number;
        repositoriesByToken: Array<{
            tokenId: string;
            username: string;
            count: number;
        }>;
    }>;
}
//# sourceMappingURL=githubService.d.ts.map