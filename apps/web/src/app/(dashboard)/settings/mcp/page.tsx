'use client';

/**
 * MCP Settings Page
 * Allows users to connect AI assistants via OAuth flow and manage sessions
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Alert,
  AlertDescription,
} from '@serenity/ui';
import {
  Trash2,
  RefreshCw,
  Loader2,
  Monitor,
  AlertCircle,
  Plus,
  ExternalLink,
  Info
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState
} from '@/lib/mcp/oauth-utils';

interface MCPSession {
  id: string;
  deviceName: string | null;
  deviceFingerprint: string | null;
  scopes: string[];
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  lastUsedAt: string;
  createdAt: string;
}

export default function MCPSettingsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<MCPSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mcp/sessions');
      const data = await response.json();

      if (response.ok) {
        setSessions(data.sessions);
      } else {
        setError(data.error_description || 'Failed to load sessions');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Fetch sessions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAssistant = () => {
    // Generate PKCE parameters
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    // Save PKCE verifier and state in session storage for callback
    sessionStorage.setItem('pkce_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    // Build OAuth authorization URL
    const params = new URLSearchParams({
      client_id: 'serenity-web',
      redirect_uri: `${window.location.origin}/settings/mcp/callback`,
      response_type: 'code',
      scope: 'mcp:read mcp:write',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    // Redirect to authorization endpoint
    window.location.href = `/api/oauth/mcp/authorize?${params.toString()}`;
  };

  const handleRevoke = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session? The AI assistant will need to re-authenticate.')) {
      return;
    }

    setRevoking(sessionId);
    setError(null);

    try {
      const response = await fetch(`/api/mcp/sessions?session_id=${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from list
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } else {
        const data = await response.json();
        setError(data.error_description || 'Failed to revoke session');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Revoke session error:', err);
    } finally {
      setRevoking(null);
    }
  };

  const isAccessTokenExpired = (expiresAt: string) => {
    return new Date(expiresAt) <= new Date();
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">MCP Integration</h1>
          <p className="text-muted-foreground mt-2">
            Connect AI assistants like Claude Desktop to your Serenity account using the Model Context Protocol
          </p>
        </div>

        {/* Info Card */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>What is MCP?</strong> The Model Context Protocol allows AI assistants to securely access your notes, tasks, and insights.
            Your data stays private and you control which assistants have access.
          </AlertDescription>
        </Alert>

        {/* Connect New Assistant */}
        <Card>
          <CardHeader>
            <CardTitle>Connect AI Assistant</CardTitle>
            <CardDescription>
              Grant a new AI assistant access to your Serenity data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Button
                onClick={handleConnectAssistant}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Connect New Assistant
              </Button>
              <p className="text-sm text-muted-foreground">
                You'll be asked to approve permissions and can name this connection
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Manage your connected AI assistants
                </CardDescription>
              </div>
              <Button onClick={fetchSessions} disabled={loading} variant="outline" size="sm">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="error" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading && sessions.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No active sessions</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Connect New Assistant" above to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => {
                  const accessExpired = isAccessTokenExpired(session.accessTokenExpiresAt);
                  const refreshExpired = isAccessTokenExpired(session.refreshTokenExpiresAt);

                  return (
                    <div
                      key={session.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Monitor className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <h3 className="font-medium">
                              {session.deviceName || 'Unnamed Device'}
                            </h3>
                            {session.deviceFingerprint && (
                              <p className="text-sm text-muted-foreground">
                                {session.deviceFingerprint}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(session.id)}
                          disabled={revoking === session.id}
                        >
                          {revoking === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {session.scopes.map((scope) => (
                          <Badge key={scope} variant="secondary">
                            {scope}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Access token: </span>
                          {accessExpired ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : (
                            <Badge variant="default">Valid</Badge>
                          )}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Refresh token: </span>
                          {refreshExpired ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : (
                            <Badge variant="default">Valid</Badge>
                          )}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last used: </span>
                          {formatDistanceToNow(new Date(session.lastUsedAt), { addSuffix: true })}
                        </div>
                      </div>

                      {refreshExpired && (
                        <Alert variant="error">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This session has expired. Please connect again.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documentation Link */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Learn how to configure Claude Desktop and other AI assistants to connect to your Serenity account.
              </p>
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Documentation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
