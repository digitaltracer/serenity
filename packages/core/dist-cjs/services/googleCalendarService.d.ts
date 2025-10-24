/**
 * Google Calendar API integration service
 * Handles OAuth authentication and calendar data fetching
 */
export interface GoogleCalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
    };
    location?: string;
    status: 'confirmed' | 'tentative' | 'cancelled';
    created: string;
    updated: string;
    htmlLink: string;
}
export interface GoogleCalendarAuth {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}
export declare class GoogleCalendarService {
    private static readonly CLIENT_ID;
    private static readonly CLIENT_SECRET;
    private static readonly REDIRECT_URI;
    private static readonly SCOPES;
    /**
     * Generate Google OAuth URL for authentication
     */
    static getAuthUrl(): string;
    /**
     * Exchange authorization code for access and refresh tokens
     */
    static exchangeCodeForTokens(code: string): Promise<GoogleCalendarAuth>;
    /**
     * Refresh access token using refresh token
     */
    static refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
        expiresAt: number;
    }>;
    /**
     * Get user's primary calendar events for a date range
     */
    static getCalendarEvents(accessToken: string, startDate: Date, endDate: Date): Promise<GoogleCalendarEvent[]>;
    /**
     * Get user's calendar list
     */
    static getCalendarList(accessToken: string): Promise<Array<{
        id: string;
        summary: string;
        primary?: boolean;
    }>>;
    /**
     * Get user profile information
     */
    static getUserProfile(accessToken: string): Promise<{
        email: string;
        name: string;
    }>;
    /**
     * Check if access token is expired
     */
    static isTokenExpired(expiresAt: number): boolean;
}
