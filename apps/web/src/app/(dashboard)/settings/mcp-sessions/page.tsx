'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Alert,
  AlertDescription
} from '@serenity/ui';
import { Trash2, RefreshCw, Loader2, Monitor, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MCPSession {
  id: string;
  deviceName: string | null;
  deviceFingerprint: string | null;
  scopes: string[];
  expiresAt: string;
  lastUsedAt: string;
  createdAt: string;
}

export default function MCPSessionsPage() {
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

  const handleRevoke = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session? The MCP server will need to re-authenticate.')) {
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

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>MCP Server Sessions</CardTitle>
              <CardDescription>
                Manage active MCP (Model Context Protocol) server connections to your account
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
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <AlertDescription>{error}</AlertDescription>
              </div>
            </Alert>
          )}

          {loading && sessions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active MCP sessions</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start an MCP server and authorize it to see it here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Device</th>
                    <th className="text-left py-3 px-4 font-semibold">Scopes</th>
                    <th className="text-left py-3 px-4 font-semibold">Last Used</th>
                    <th className="text-left py-3 px-4 font-semibold">Expires</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-b last:border-0">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">
                              {session.deviceName || 'Unnamed Device'}
                            </div>
                            {session.deviceFingerprint && (
                              <div className="text-xs text-gray-500">
                                {session.deviceFingerprint}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {session.scopes.map((scope) => (
                            <Badge key={scope} variant="secondary" className="text-xs">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(session.lastUsedAt), {
                            addSuffix: true,
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          Created{' '}
                          {formatDistanceToNow(new Date(session.createdAt), {
                            addSuffix: true,
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(session.expiresAt), {
                            addSuffix: true,
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          onClick={() => handleRevoke(session.id)}
                          disabled={revoking === session.id}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {revoking === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Revoke
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Info section */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-2">About MCP Sessions</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>MCP sessions allow your MCP servers to access your Serenity data</li>
              <li>Sessions expire after 90 days of inactivity</li>
              <li>Revoking a session will require the device to re-authenticate</li>
              <li>Each session has specific scopes that define what data it can access</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
