'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
  AlertDescription
} from '@serenity/ui';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function DeviceAuthorizationPage() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code');

  const [userCode, setUserCode] = useState(codeFromUrl || '');
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (codeFromUrl) {
      setUserCode(codeFromUrl.toUpperCase());
    }
  }, [codeFromUrl]);

  const handleCodeInput = (value: string) => {
    // Auto-uppercase and format
    let formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Add dash after 4 characters
    if (formatted.length > 4) {
      formatted = formatted.slice(0, 4) + '-' + formatted.slice(4, 8);
    }

    setUserCode(formatted);
  };

  const handleApprove = async () => {
    await handleSubmit(true);
  };

  const handleDeny = async () => {
    await handleSubmit(false);
  };

  const handleSubmit = async (approved: boolean) => {
    if (!userCode || userCode.length !== 9) {
      setStatus('error');
      setMessage('Please enter a valid 8-character code (format: XXXX-XXXX)');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/mcp/device/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_code: userCode,
          approved,
          device_name: deviceName || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        if (approved) {
          setMessage(
            `Device authorized successfully! ${
              deviceName ? `Device "${deviceName}" ` : ''
            }Your MCP server should connect momentarily.`
          );
        } else {
          setMessage('Device authorization denied.');
        }
        // Clear form
        setTimeout(() => {
          setUserCode('');
          setDeviceName('');
          setStatus('idle');
          setMessage('');
        }, 5000);
      } else {
        setStatus('error');
        if (data.error === 'expired_token') {
          setMessage('This code has expired. Please generate a new code from your MCP server.');
        } else if (data.error === 'not_found') {
          setMessage('Invalid code. Please check the code and try again.');
        } else if (data.error === 'unauthorized') {
          setMessage('You must be logged in to authorize devices.');
        } else {
          setMessage(data.error_description || 'Failed to process authorization request.');
        }
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
      console.error('Authorization error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Authorize MCP Server</CardTitle>
          <CardDescription>
            Enter the code displayed by your MCP server to authorize it to access your Serenity
            account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status alerts */}
          {status === 'success' && (
            <Alert variant="success">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5" />
                <AlertDescription>{message}</AlertDescription>
              </div>
            </Alert>
          )}

          {status === 'error' && (
            <Alert variant="error">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 mt-0.5" />
                <AlertDescription>{message}</AlertDescription>
              </div>
            </Alert>
          )}

          {/* Info alert */}
          <Alert variant="info">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <AlertDescription>
                Your MCP server will display an 8-character code (format: XXXX-XXXX). Enter it below
                to authorize access.
              </AlertDescription>
            </div>
          </Alert>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="user-code" className="text-sm font-medium">
                Authorization Code *
              </label>
              <Input
                id="user-code"
                type="text"
                placeholder="XXXX-XXXX"
                value={userCode}
                onChange={(e) => handleCodeInput(e.target.value)}
                maxLength={9}
                className="text-center text-2xl font-mono tracking-widest uppercase"
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Enter the 8-character code from your MCP server
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="device-name" className="text-sm font-medium">
                Device Name (optional)
              </label>
              <Input
                id="device-name"
                type="text"
                placeholder="e.g., MacBook Pro, Work Desktop"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                maxLength={100}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Give this device a friendly name to help you identify it later
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleApprove}
              disabled={loading || !userCode || userCode.length !== 9}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Authorize
                </>
              )}
            </Button>
            <Button
              onClick={handleDeny}
              disabled={loading || !userCode || userCode.length !== 9}
              variant="outline"
              className="flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Deny
            </Button>
          </div>

          {/* Help text */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>What is this?</strong> MCP (Model Context Protocol) servers need authorization
              to access your tasks, journal entries, and other data. This flow ensures that only
              devices you approve can connect to your account.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
