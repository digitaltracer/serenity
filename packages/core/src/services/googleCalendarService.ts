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

export class GoogleCalendarService {
  private static readonly CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
  private static readonly CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
  private static readonly REDIRECT_URI = 'http://localhost:3000/auth/google/callback';
  private static readonly SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

  /**
   * Generate Google OAuth URL for authentication
   */
  static getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      scope: this.SCOPES,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  static async exchangeCodeForTokens(code: string): Promise<GoogleCalendarAuth> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        redirect_uri: this.REDIRECT_URI,
        grant_type: 'authorization_code',
        code: code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };
  }

  /**
   * Get user's primary calendar events for a date range
   */
  static async getCalendarEvents(
    accessToken: string,
    startDate: Date,
    endDate: Date
  ): Promise<GoogleCalendarEvent[]> {
    const params = new URLSearchParams({
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '100',
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      throw new Error(`Calendar API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * Get user's calendar list
   */
  static async getCalendarList(accessToken: string): Promise<Array<{
    id: string;
    summary: string;
    primary?: boolean;
  }>> {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      throw new Error(`Calendar list request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * Get user profile information
   */
  static async getUserProfile(accessToken: string): Promise<{
    email: string;
    name: string;
  }> {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`User profile request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      email: data.email,
      name: data.name,
    };
  }

  /**
   * Check if access token is expired
   */
  static isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt - 60000; // 1 minute buffer
  }
}