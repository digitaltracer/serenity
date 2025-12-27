'use client';

/**
 * OAuth 2.0 Consent Screen
 * Shows user what permissions are being requested and allows approval/denial
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
  CardFooter,
  Badge,
  Alert,
  AlertDescription,
  Input,
  Label
} from '@serenity/ui';
import { Shield, Check, X, Loader2, AlertCircle } from 'lucide-react';

function ConsentForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [deviceName, setDeviceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract OAuth parameters from URL
  const clientId = searchParams.get('client_id');
  const clientName = searchParams.get('client_name');
  const redirectUri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope') || 'mcp:read mcp:write';
  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');

  // Parse scopes
  const scopes = scope.split(/\s+/).filter(Boolean);

  // Scope descriptions
  const scopeDescriptions: Record<string, { title: string; description: string }> = {
    'mcp:read': {
      title: 'Read your notes and tasks',
      description: 'View your journal entries, tasks, goals, and AI insights'
    },
    'mcp:write': {
      title: 'Manage your notes and tasks',
      description: 'Create, update, and delete journal entries, tasks, and goals'
    }
  };

  useEffect(() => {
    // Validate required parameters
    if (!clientId || !redirectUri || !state || !codeChallenge) {
      setError('Invalid authorization request. Missing required parameters.');
    }

    // Auto-fill device name based on client
    if (clientId === 'claude-desktop') {
      setDeviceName('Claude Desktop');
    } else if (clientId === 'serenity-web') {
      setDeviceName('Serenity Web App');
    }
  }, [clientId, redirectUri, state, codeChallenge]);

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/oauth/mcp/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          scope,
          state,
          code_challenge: codeChallenge,
          code_challenge_method: codeChallengeMethod,
          approved: true,
          device_name: deviceName || 'Unknown Device',
        }),
      });

      const data = await response.json();

      if (response.ok && data.redirectUrl) {
        // Redirect to client's redirect_uri with authorization code
        window.location.href = data.redirectUrl;
      } else {
        setError(data.error_description || 'Failed to approve authorization');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Consent approval error:', err);
      setIsSubmitting(false);
    }
  };

  const handleDeny = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/oauth/mcp/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          state,
          approved: false,
        }),
      });

      const data = await response.json();

      if (response.ok && data.redirectUrl) {
        // Redirect to client's redirect_uri with error
        window.location.href = data.redirectUrl;
      } else {
        setError(data.error_description || 'Failed to deny authorization');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Consent denial error:', err);
      setIsSubmitting(false);
    }
  };

  if (error && (!clientId || !redirectUri)) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4">
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-12 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle>Authorize Application</CardTitle>
          <CardDescription>
            <strong>{clientName || clientId}</strong> wants to access your Serenity account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Device Name Input */}
          <div className="space-y-2">
            <Label htmlFor="deviceName">Device Name (optional)</Label>
            <Input
              id="deviceName"
              type="text"
              placeholder="e.g., Claude Desktop on MacBook Pro"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              This helps you identify this connection in your settings
            </p>
          </div>

          {/* Requested Permissions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">This application will be able to:</h3>
            <ul className="space-y-2">
              {scopes.map((scopeKey) => {
                const scopeInfo = scopeDescriptions[scopeKey];
                if (!scopeInfo) return null;

                return (
                  <li key={scopeKey} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{scopeInfo.title}</p>
                      <p className="text-xs text-muted-foreground">{scopeInfo.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Security Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              You can revoke access anytime from your account settings. Access tokens expire after 1 hour and refresh tokens expire after 90 days.
            </AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDeny}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Deny
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Approve
          </Button>
        </CardFooter>
      </Card>

      {/* Additional Info */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        By approving, you allow {clientName || clientId} to access your Serenity data using the MCP (Model Context Protocol) standard.
      </p>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-md mx-auto py-12 px-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ConsentForm />
    </Suspense>
  );
}
