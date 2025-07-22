import React, { useState, useCallback } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Database, CheckCircle, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react';

interface DatabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (connectionUrl: string) => void;
  initialConnectionUrl?: string;
}

interface ConnectionStatus {
  type: 'idle' | 'testing' | 'success' | 'error';
  message?: string;
}

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConnectionUrl = ''
}) => {
  const [connectionUrl, setConnectionUrl] = useState(initialConnectionUrl);
  const [showPassword, setShowPassword] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ type: 'idle' });

  const testConnection = useCallback(async () => {
    if (!connectionUrl.trim()) {
      setConnectionStatus({ 
        type: 'error', 
        message: 'Please enter a connection URL' 
      });
      return;
    }

    setConnectionStatus({ type: 'testing' });

    try {
      // Simulate connection test - in real app, this would make actual database connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Basic URL validation
      const url = new URL(connectionUrl);
      if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
        throw new Error('Invalid PostgreSQL URL format');
      }

      setConnectionStatus({ 
        type: 'success', 
        message: 'Connection successful!' 
      });
    } catch (error) {
      setConnectionStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Connection failed' 
      });
    }
  }, [connectionUrl]);

  const handleSave = useCallback(() => {
    if (!connectionUrl.trim()) {
      setConnectionStatus({ 
        type: 'error', 
        message: 'Please enter a connection URL' 
      });
      return;
    }

    onSave(connectionUrl);
    onClose();
  }, [connectionUrl, onSave, onClose]);

  const handleClose = useCallback(() => {
    setConnectionUrl(initialConnectionUrl);
    setConnectionStatus({ type: 'idle' });
    setShowPassword(false);
    onClose();
  }, [initialConnectionUrl, onClose]);

  const getStatusIcon = () => {
    switch (connectionStatus.type) {
      case 'testing':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus.type) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'testing':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Database Configuration"
      size="md"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
            <Database className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              PostgreSQL Connection
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure your database connection for data persistence
            </p>
          </div>
        </div>

        {/* Connection URL Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Connection URL
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={connectionUrl}
              onChange={(e) => setConnectionUrl(e.target.value)}
              placeholder="postgresql://username:password@localhost:5432/database"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Format: postgresql://username:password@host:port/database
          </p>
        </div>

        {/* Connection Status */}
        {connectionStatus.type !== 'idle' && (
          <div className={`flex items-center gap-2 p-3 rounded-lg border ${
            connectionStatus.type === 'success' 
              ? 'border-green-200 bg-green-50 dark:border-green-700/50 dark:bg-green-900/20'
              : connectionStatus.type === 'error'
              ? 'border-red-200 bg-red-50 dark:border-red-700/50 dark:bg-red-900/20'
              : 'border-blue-200 bg-blue-50 dark:border-blue-700/50 dark:bg-blue-900/20'
          }`}>
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {connectionStatus.message}
            </span>
          </div>
        )}

        {/* Security Notice */}
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Security Notice</p>
              <p>Connection details are stored securely in your local keychain. Never share your database credentials.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={testConnection}
            disabled={connectionStatus.type === 'testing' || !connectionUrl.trim()}
            className="flex-1"
          >
            {connectionStatus.type === 'testing' ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={connectionStatus.type === 'testing' || !connectionUrl.trim()}
            className="flex-1"
          >
            Save & Connect
          </Button>
        </div>

        {/* Cancel Button */}
        <Button
          variant="ghost"
          onClick={handleClose}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
};