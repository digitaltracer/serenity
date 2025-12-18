'use client';

/**
 * OAuth Callback Page
 * Handles the OAuth redirect after user approves consent
 * Exchanges authorization code for tokens and displays them
 */

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
  AlertDescription,
} from '@serenity/ui';
import {
  CheckCircle,
  Copy,
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedAccess, setCopiedAccess] = useState(false);
  const [copiedRefresh, setCopiedRefresh] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Check for OAuth error
      const oauthError = searchParams.get('error');
      if (oauthError) {
        setError(searchParams.get('error_description') || 'Authorization failed');
        setLoading(false);
        return;
      }

      // Extract authorization code and state
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        setError('Missing authorization code or state parameter');
        setLoading(false);
        return;
      }

      // Validate state (CSRF protection)
      const savedState = sessionStorage.getItem('oauth_state');
      if (state !== savedState) {
        setError('Invalid state parameter. Possible CSRF attack detected.');
        setLoading(false);
        return;
      }

      // Get PKCE verifier
      const codeVerifier = sessionStorage.getItem('pkce_verifier');
      if (!codeVerifier) {
        setError('PKCE verifier not found. Please try again.');
        setLoading(false);
        return;
      }

      // Exchange code for tokens
      try {
        const response = await fetch('/api/oauth/mcp/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: `${window.location.origin}/settings/mcp/callback`,
            client_id: 'serenity-web',
            code_verifier: codeVerifier,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setAccessToken(data.access_token);
          setRefreshToken(data.refresh_token);
          setExpiresIn(data.expires_in);

          // Clean up session storage
          sessionStorage.removeItem('pkce_verifier');
          sessionStorage.removeItem('oauth_state');
        } else {
          setError(data.error_description || 'Failed to exchange authorization code');
        }
      } catch (err) {
        setError('Network error. Please try again.');
        console.error('Token exchange error:', err);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams]);

  const copyToClipboard = async (text: string, type: 'access' | 'refresh' | 'config') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'access') {
        setCopiedAccess(true);
        setTimeout(() => setCopiedAccess(false), 2000);
      } else if (type === 'refresh') {
        setCopiedRefresh(true);
        setTimeout(() => setCopiedRefresh(false), 2000);
      } else {
        setCopiedConfig(true);
        setTimeout(() => setCopiedConfig(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const generateClaudeConfig = () => {
    if (!accessToken || !refreshToken) return '';

    return `{
  "mcpServers": {
    "serenity": {
      "command": "node",
      "args": [
        "-e",
        "// MCP client implementation here",
        "// Use access_token: ${accessToken.substring(0, 20)}...",
        "// Use refresh_token: ${refreshToken.substring(0, 20)}..."
      ]
    }
  }
}`;
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Exchanging authorization code for tokens...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Authorization Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button variant="outline" onClick={() => router.push('/settings/mcp')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to MCP Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="space-y-6">
        {/* Success Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle>AI Assistant Connected!</CardTitle>
            <CardDescription>
              Your access and refresh tokens have been generated successfully
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Warning */}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Save these tokens now. They won't be shown again for security reasons.
          </AlertDescription>
        </Alert>

        {/* Access Token */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Access Token</CardTitle>
            <CardDescription>
              Short-lived token (expires in {expiresIn ? Math.floor(expiresIn / 60) : 60} minutes)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                {accessToken}
              </div>
              <Button
                onClick={() => copyToClipboard(accessToken!, 'access')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {copiedAccess ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Access Token
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Refresh Token */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Refresh Token</CardTitle>
            <CardDescription>
              Long-lived token (expires in 90 days). Use this to get new access tokens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                {refreshToken}
              </div>
              <Button
                onClick={() => copyToClipboard(refreshToken!, 'refresh')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {copiedRefresh ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Refresh Token
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Example */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration Example</CardTitle>
            <CardDescription>
              Example configuration for Claude Desktop (adapt for your AI assistant)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
                {generateClaudeConfig()}
              </pre>
              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(generateClaudeConfig(), 'config')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {copiedConfig ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Configuration
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Documentation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Save both tokens in a secure location</li>
              <li>Configure your AI assistant with these tokens</li>
              <li>Your assistant will automatically refresh the access token when it expires</li>
              <li>You can revoke access anytime from the MCP settings page</li>
            </ol>
            <div className="mt-4">
              <Button onClick={() => router.push('/settings/mcp')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to MCP Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-2xl mx-auto py-12 px-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
