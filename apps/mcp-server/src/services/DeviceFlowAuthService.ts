import axios, { AxiosError } from 'axios';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * DeviceFlowAuthService
 *
 * Orchestrates OAuth 2.0 Device Authorization Grant (RFC 8628) for MCP server authentication.
 *
 * Flow:
 * 1. Request device code from web app
 * 2. Display user-friendly code and verification URL to user
 * 3. Poll for authorization until approved/denied/expired
 * 4. Save session token to file for future use
 * 5. Return token for use in MCP server requests
 */

interface DeviceAuthResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

interface PollResponse {
  status: 'pending' | 'approved' | 'denied' | 'expired';
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface SavedSession {
  token: string;
  expiresAt: string;
}

export class DeviceFlowAuthService {
  private webAppUrl: string;
  private sessionFilePath: string;

  constructor(webAppUrl: string) {
    this.webAppUrl = webAppUrl.replace(/\/$/, ''); // Remove trailing slash
    this.sessionFilePath = path.join(os.homedir(), '.serenity', 'mcp-session.json');
  }

  /**
   * Full device flow: request code → display to user → poll → return token
   */
  async authorize(): Promise<string> {
    // Step 1: Request device code
    const deviceAuth = await this.requestDeviceCode();

    // Step 2: Display to user
    this.displayInstructions(deviceAuth);

    // Step 3: Poll for token
    const token = await this.pollForToken(deviceAuth.device_code, deviceAuth.interval);

    // Step 4: Save token
    await this.saveSession(token, deviceAuth.expires_in);

    return token;
  }

  /**
   * Load saved session from file
   * Returns null if no session or session expired
   */
  async loadSession(): Promise<string | null> {
    try {
      const content = await fs.readFile(this.sessionFilePath, 'utf-8');
      const session: SavedSession = JSON.parse(content);

      // Check expiration
      if (new Date(session.expiresAt) <= new Date()) {
        console.log('Saved session expired, need to re-authenticate');
        return null;
      }

      console.log('Loaded saved MCP session');
      return session.token;
    } catch (error) {
      // File doesn't exist or invalid JSON
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('Failed to load session file:', error);
      }
      return null;
    }
  }

  /**
   * Save session token to file with 0600 permissions
   */
  async saveSession(token: string, expiresIn: number): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.sessionFilePath);
      await fs.mkdir(dir, { recursive: true, mode: 0o700 });

      // Calculate expiration
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      const session: SavedSession = {
        token,
        expiresAt: expiresAt.toISOString(),
      };

      // Write file with restrictive permissions
      await fs.writeFile(this.sessionFilePath, JSON.stringify(session, null, 2), {
        mode: 0o600,
      });

      console.log(`Session saved to ${this.sessionFilePath}`);
    } catch (error) {
      console.error('Failed to save session:', error);
      throw new Error('Failed to save session file');
    }
  }

  /**
   * Request device code from web app
   */
  private async requestDeviceCode(): Promise<DeviceAuthResponse> {
    try {
      const response = await axios.post<DeviceAuthResponse>(
        `${this.webAppUrl}/api/mcp/device/authorize`,
        {
          device_name: this.getDeviceName(),
          device_fingerprint: this.getDeviceFingerprint(),
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; error_description?: string }>;
        if (axiosError.response?.status === 429) {
          throw new Error(
            'Rate limit exceeded. Too many authorization attempts. Please try again in an hour.'
          );
        }
        if (axiosError.response?.data?.error_description) {
          throw new Error(`Authorization failed: ${axiosError.response.data.error_description}`);
        }
      }
      throw new Error(`Failed to request device code: ${(error as Error).message}`);
    }
  }

  /**
   * Poll for token until approved/denied/expired
   */
  private async pollForToken(deviceCode: string, interval: number): Promise<string> {
    const startTime = Date.now();
    const maxWaitTime = 10 * 60 * 1000; // 10 minutes

    while (Date.now() - startTime < maxWaitTime) {
      // Wait for interval before polling
      await this.sleep(interval * 1000);

      try {
        const response = await axios.get<PollResponse>(
          `${this.webAppUrl}/api/mcp/device/status`,
          {
            params: { device_code: deviceCode },
            timeout: 10000,
          }
        );

        const data = response.data;

        if (data.status === 'approved' && data.access_token) {
          console.log('\n✓ Authorization successful!\n');
          return data.access_token;
        }

        if (data.status === 'denied') {
          throw new Error('Authorization denied by user');
        }

        // Status is pending, continue polling
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError<PollResponse>;

          // Handle specific error responses
          if (axiosError.response?.data?.error) {
            const errorData = axiosError.response.data;

            if (errorData.error === 'expired_token') {
              throw new Error('Device code expired. Please try again.');
            }

            if (errorData.error === 'access_denied') {
              throw new Error('Authorization denied by user');
            }

            if (errorData.error === 'slow_down') {
              // Increase polling interval
              console.log('Rate limited, slowing down polling...');
              await this.sleep(5000); // Additional 5 second delay
              continue;
            }
          }
        }

        // For network errors, retry
        console.log('Network error, retrying...');
      }
    }

    throw new Error('Authorization timeout. User did not approve within 10 minutes.');
  }

  /**
   * Display instructions to user
   */
  private displayInstructions(deviceAuth: DeviceAuthResponse): void {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                  MCP Server Authentication                         ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    console.log('  To authorize this MCP server:\n');
    console.log(`  1. Visit: ${deviceAuth.verification_uri}`);
    console.log(`  2. Enter code: ${deviceAuth.user_code}\n`);
    console.log('  Or open this URL in your browser:');
    console.log(`  ${deviceAuth.verification_uri_complete}\n`);
    console.log('  Waiting for authorization...');
    console.log(`  (Code expires in ${Math.floor(deviceAuth.expires_in / 60)} minutes)\n`);
  }

  /**
   * Get device name (hostname or platform)
   */
  private getDeviceName(): string {
    try {
      return os.hostname() || os.platform();
    } catch {
      return 'Unknown Device';
    }
  }

  /**
   * Get device fingerprint (OS + hostname)
   */
  private getDeviceFingerprint(): string {
    try {
      return `${os.platform()} ${os.release()} - ${os.hostname()}`;
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
