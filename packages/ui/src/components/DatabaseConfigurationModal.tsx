/**
 * Database Configuration Modal
 * Allows users to choose between SQLite and PostgreSQL storage options
 */

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { CustomSelect } from './CustomSelect';
import { DatabaseIcon, ServerIcon, HardDriveIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';
import { 
  DatabaseConfig, 
  DatabaseType, 
  SQLiteConfig, 
  PostgreSQLConfig,
  DatabaseConnectionStatus 
} from '@serenity/core';

export interface DatabaseConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: DatabaseConfig) => void;
  currentConfig?: DatabaseConfig | null;
  connectionStatus?: DatabaseConnectionStatus;
}

interface DatabasePreset {
  id: string;
  name: string;
  description: string;
  type: DatabaseType;
  icon: React.ReactNode;
  recommended: boolean;
  config: Partial<DatabaseConfig>;
}

const databasePresets: DatabasePreset[] = [
  {
    id: 'personal-sqlite',
    name: 'Personal (SQLite)',
    description: 'Fast local database, perfect for personal use. No setup required.',
    type: 'sqlite',
    icon: <HardDriveIcon className="w-6 h-6" />,
    recommended: true,
    config: {
      type: 'sqlite',
      encryption: true,
    },
  },
  {
    id: 'self-hosted-postgres',
    name: 'Self-Hosted PostgreSQL',
    description: 'Full-featured database for power users and teams. Requires PostgreSQL server.',
    type: 'postgresql',
    icon: <ServerIcon className="w-6 h-6" />,
    recommended: false,
    config: {
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'serenity_notes',
      ssl: false,
    },
  },
  {
    id: 'cloud-postgres',
    name: 'Cloud PostgreSQL',
    description: 'Managed PostgreSQL for teams and businesses. Enter your cloud database details.',
    type: 'postgresql',
    icon: <DatabaseIcon className="w-6 h-6" />,
    recommended: false,
    config: {
      type: 'postgresql',
      port: 5432,
      ssl: true,
    },
  },
];

export const DatabaseConfigurationModal: React.FC<DatabaseConfigurationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig,
  connectionStatus,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('personal-sqlite');
  const [customConfig, setCustomConfig] = useState<DatabaseConfig>({
    type: 'sqlite',
  } as DatabaseConfig);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Initialize form with current config or default
  useEffect(() => {
    if (currentConfig) {
      setCustomConfig(currentConfig);
      // Find matching preset
      const preset = databasePresets.find(p => 
        p.type === currentConfig.type && 
        (currentConfig.type === 'sqlite' || 
         (currentConfig as PostgreSQLConfig).host === (p.config as PostgreSQLConfig).host)
      );
      if (preset) {
        setSelectedPreset(preset.id);
      }
    }
  }, [currentConfig]);

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = databasePresets.find(p => p.id === presetId);
    if (preset) {
      setCustomConfig({
        ...preset.config,
        type: preset.type,
      } as DatabaseConfig);
    }
    setTestResult(null);
  };

  const handleConfigChange = (field: string, value: any) => {
    setCustomConfig((prev: DatabaseConfig) => ({
      ...prev,
      [field]: value,
    }));
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    
    try {
      // Use the actual database manager for connection testing
      const { databaseManager } = await import('@serenity/core');
      
      // Test connection with the current config
      const testConfig = { ...customConfig };
      const success = await databaseManager.connect(testConfig);
      
      if (success) {
        setTestResult({ success: true, message: 'Connection successful!' });
        // Disconnect after test to avoid conflicts
        await databaseManager.disconnect();
      } else {
        const status = databaseManager.getConnectionStatus();
        setTestResult({ 
          success: false, 
          message: status.error || 'Connection failed. Please check your settings.' 
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection test failed.' 
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = () => {
    onSave(customConfig);
  };

  const renderSQLiteConfig = () => {
    const config = customConfig as SQLiteConfig;
    
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">SQLite Configuration</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Your data will be stored locally on your device. No external database server required.
          </p>
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={config.encryption === true}
              onChange={(e) => handleConfigChange('encryption', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable database encryption
            </span>
          </label>
          
          <Input
            label="Database Path (optional)"
            placeholder="Leave empty for default location"
            value={config.path || ''}
            onChange={(e) => handleConfigChange('path', e.target.value)}
            className="text-sm"
          />
        </div>
      </div>
    );
  };

  const renderPostgreSQLConfig = () => {
    const config = customConfig as PostgreSQLConfig;
    
    return (
      <div className="space-y-4">
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">PostgreSQL Configuration</h4>
          <p className="text-sm text-orange-700 dark:text-orange-300">
            Connect to a PostgreSQL server. Make sure the server is running and accessible.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Host"
            placeholder="localhost"
            value={config.host || ''}
            onChange={(e) => handleConfigChange('host', e.target.value)}
            required
            className="text-sm"
          />
          
          <Input
            label="Port"
            type="number"
            placeholder="5432"
            value={config.port || 5432}
            onChange={(e) => handleConfigChange('port', parseInt(e.target.value) || 5432)}
            required
            className="text-sm"
          />
        </div>
        
        <Input
          label="Database Name"
          placeholder="serenity_notes"
          value={config.database || ''}
          onChange={(e) => handleConfigChange('database', e.target.value)}
          required
          className="text-sm"
        />
        
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Username"
            placeholder="postgres"
            value={config.username || ''}
            onChange={(e) => handleConfigChange('username', e.target.value)}
            required
            className="text-sm"
          />
          
          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            value={config.password || ''}
            onChange={(e) => handleConfigChange('password', e.target.value)}
            className="text-sm"
          />
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={config.ssl || false}
              onChange={(e) => handleConfigChange('ssl', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable SSL connection
            </span>
          </label>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Database Configuration"
      size="lg"
    >
      <div className="space-y-6">
        {/* Current Status */}
        {connectionStatus && (
          <div className={`p-3 rounded-lg ${
            connectionStatus.connected 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {connectionStatus.connected ? (
                <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
              <span className={`text-sm font-medium ${
                connectionStatus.connected 
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {connectionStatus.connected 
                  ? `Connected to ${connectionStatus.type} database`
                  : `Not connected${connectionStatus.error ? `: ${connectionStatus.error}` : ''}`
                }
              </span>
            </div>
          </div>
        )}

        {/* Database Type Selection */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Choose Database Type
          </h3>
          
          <div className="grid gap-3">
            {databasePresets.map((preset) => (
              <div
                key={preset.id}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPreset === preset.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
                onClick={() => handlePresetChange(preset.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    selectedPreset === preset.id
                      ? 'bg-blue-100 dark:bg-blue-800'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {preset.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {preset.name}
                      </h4>
                      {preset.recommended && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {preset.description}
                    </p>
                  </div>
                  
                  <input
                    type="radio"
                    name="database-preset"
                    checked={selectedPreset === preset.id}
                    onChange={() => handlePresetChange(preset.id)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Form */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Configuration
          </h3>
          
          {customConfig.type === 'sqlite' ? renderSQLiteConfig() : renderPostgreSQLConfig()}
        </div>

        {/* Test Connection */}
        {customConfig.type === 'postgresql' && (
          <div>
            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              variant="secondary"
              className="w-full"
            >
              {isTestingConnection ? 'Testing Connection...' : 'Test Connection'}
            </Button>
            
            {testResult && (
              <div className={`mt-3 p-3 rounded-lg ${
                testResult.success
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {testResult.success ? (
                    <CheckCircleIcon className="w-4 h-4" />
                  ) : (
                    <AlertCircleIcon className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">{testResult.message}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={customConfig.type === 'postgresql' && testResult !== null && !testResult.success}
          >
            Save Configuration
          </Button>
        </div>
      </div>
    </Modal>
  );
};