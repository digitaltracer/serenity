import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { Eye, EyeOff, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Loader2, Brain } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

export interface AIProvider {
  id: 'openai' | 'gemini' | 'anthropic';
  name: string;
  hasApiKey: boolean;
  isActive?: boolean;
}

export interface AIProviderKeyInputProps {
  provider: AIProvider;
  isActive: boolean;
  onSave: (providerId: string, apiKey: string) => Promise<{ success: boolean; error?: string }>;
  onTest: (providerId: string) => Promise<{ success: boolean; error?: string }>;
  onRemove: (providerId: string) => Promise<{ success: boolean; error?: string }>;
  onSetActive: (providerId: string) => void;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error';
type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export const AIProviderKeyInput: React.FC<AIProviderKeyInputProps> = ({
  provider,
  isActive,
  onSave,
  onTest,
  onRemove,
  onSetActive,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setErrorMessage('API key cannot be empty');
      return;
    }

    setSaveStatus('saving');
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await onSave(provider.id, apiKey.trim());

    if (result.success) {
      setSaveStatus('success');
      setSuccessMessage('API key saved successfully');
      setApiKey(''); // Clear input after save
      setShowKey(false);
      setTimeout(() => {
        setSaveStatus('idle');
        setSuccessMessage(null);
        setIsExpanded(false); // Collapse after successful save
      }, 2000);
    } else {
      setSaveStatus('error');
      setErrorMessage(result.error || 'Failed to save API key');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleTest = async () => {
    setTestStatus('testing');
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await onTest(provider.id);

    if (result.success) {
      setTestStatus('success');
      setSuccessMessage('Connection successful!');
      setTimeout(() => {
        setTestStatus('idle');
        setSuccessMessage(null);
      }, 3000);
    } else {
      setTestStatus('error');
      setErrorMessage(result.error || 'Connection failed');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove API key for ${provider.name}?`)) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await onRemove(provider.id);

    if (result.success) {
      setSuccessMessage('API key removed');
      setTimeout(() => setSuccessMessage(null), 2000);
    } else {
      setErrorMessage(result.error || 'Failed to remove API key');
    }
  };

  const getStatusIcon = () => {
    if (saveStatus === 'success' || testStatus === 'success') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (saveStatus === 'error' || testStatus === 'error') {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (provider.hasApiKey) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <AlertCircle className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (provider.hasApiKey) {
      return isActive ? 'Active' : 'Configured';
    }
    return 'Not Set';
  };

  const getStatusColor = () => {
    if (provider.hasApiKey && isActive) {
      return 'text-green-600 dark:text-green-400';
    }
    if (provider.hasApiKey) {
      return 'text-blue-600 dark:text-blue-400';
    }
    return 'text-yellow-600 dark:text-yellow-400';
  };

  return (
    <div className="border border-border rounded-lg bg-card">
      {/* Header - Always Visible */}
      <div
        className={cn(
          'flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30 transition-colors rounded-t-lg',
          { 'rounded-b-lg': !isExpanded }
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          <Brain className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{provider.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon()}
              <span className={cn('text-sm font-medium', getStatusColor())}>
                {getStatusText()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {provider.hasApiKey && (
              <input
                type="radio"
                checked={isActive}
                onChange={() => onSetActive(provider.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 text-primary cursor-pointer"
              />
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-border space-y-4">
          {/* API Key Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider.hasApiKey ? '••••••••••••••••' : 'Enter your API key'}
                className={cn(
                  'flex h-12 w-full rounded-lg border px-4 py-3 text-base pr-12',
                  'bg-background text-foreground placeholder:text-muted-foreground border-border',
                  'ring-offset-background',
                  'transition-all duration-300 ease-in-out',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="text-green-500">🔒</span>
              Secured with system encryption
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!apiKey.trim() || saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save API Key'
              )}
            </Button>

            {provider.hasApiKey && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTest}
                  disabled={testStatus === 'testing'}
                >
                  {testStatus === 'testing' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                >
                  Remove Key
                </Button>
              </>
            )}
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
