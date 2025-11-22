'use client'

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';
import { Button } from '../Button';
import { Toggle } from '../Toggle';
import { Input } from '../Input';
import { ExternalLink } from 'lucide-react';

export interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  syncEnabled?: boolean;
  lastSync?: string | null;
  userEmail?: string;
  isConnecting?: boolean;
  disabled?: boolean;

  // For connected state
  onDisconnect?: () => void;
  onSyncToggle?: (enabled: boolean) => void;

  // For disconnected state - credentials input
  showCredentialsForm?: boolean;
  credentialsFields?: Array<{
    label: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    type?: 'text' | 'password';
  }>;
  onConnect?: () => void;
  connectButtonText?: string;
  helpText?: React.ReactNode;

  // Additional content
  children?: React.ReactNode;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  title,
  description,
  icon,
  connected,
  syncEnabled,
  lastSync,
  userEmail,
  isConnecting,
  disabled,
  onDisconnect,
  onSyncToggle,
  showCredentialsForm,
  credentialsFields,
  onConnect,
  connectButtonText = 'Connect',
  helpText,
  children,
}) => {
  const iconColorClass = connected
    ? 'bg-blue-100 dark:bg-blue-900/30'
    : 'bg-gray-100 dark:bg-gray-800';

  const iconClass = connected
    ? 'text-blue-600 dark:text-blue-400'
    : 'text-gray-500 dark:text-gray-400';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${iconColorClass}`}>
              <div className={iconClass}>{icon}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </CardTitle>
                {connected ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-lg border border-green-200 dark:border-green-700/50">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-medium">Not Connected</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {connected ? (
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200/50 dark:border-blue-700/30">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      {userEmail ? `Connected as: ${userEmail}` : 'Connected'}
                    </p>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 pl-4">
                    Last sync: {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3 ml-6">
                  {onSyncToggle && (
                    <div className="flex flex-col items-center gap-2">
                      <Toggle
                        checked={syncEnabled ?? false}
                        onChange={onSyncToggle}
                      />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        {syncEnabled ? 'Sync Enabled' : 'Sync Disabled'}
                      </span>
                    </div>
                  )}
                  {onDisconnect && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onDisconnect}
                      className="min-w-[100px] text-blue-700 border-blue-300 hover:bg-blue-200 dark:text-blue-300 dark:border-blue-600 dark:hover:bg-blue-800/50 font-medium"
                    >
                      Disconnect
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Additional connected content */}
            {children}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Info box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/30">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Connect {title}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {description}
                  </p>
                </div>
              </div>
            </div>

            {/* Credentials form */}
            {showCredentialsForm && credentialsFields && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {credentialsFields.map((field, index) => (
                    <Input
                      key={index}
                      label={field.label}
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      type={field.type || 'text'}
                      disabled={isConnecting || disabled}
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    />
                  ))}
                </div>

                {helpText && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200/50 dark:border-amber-700/30">
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      {helpText}
                    </p>
                  </div>
                )}

                <Button
                  onClick={onConnect}
                  disabled={isConnecting || disabled}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {isConnecting ? 'Connecting...' : connectButtonText}
                </Button>
              </div>
            )}

            {/* Simple connect button (no credentials) */}
            {!showCredentialsForm && onConnect && (
              <Button
                onClick={onConnect}
                disabled={isConnecting || disabled}
                className="w-full font-medium py-2.5 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                {isConnecting ? 'Connecting...' : connectButtonText}
              </Button>
            )}

            {/* Additional disconnected content */}
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
