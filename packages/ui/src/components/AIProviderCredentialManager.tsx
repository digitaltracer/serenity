import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Toggle } from './Toggle';
import { Badge } from './Badge';
import { Input } from './Input';
import { CustomSelect } from './CustomSelect';
import {
  GripVertical,
  Plus,
  Edit,
  Trash2,
  Key,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Check,
  Loader,
  Shield,
} from 'lucide-react';
import type { AIProviderCredential } from '@serenity/core';

interface AIProviderCredentialManagerProps {
  credentials: AIProviderCredential[];
  isLoading?: boolean;
  editingCredentialId: string | null;
  isAdding: boolean;
  onStartAdd: () => void;
  onEdit: (credential: AIProviderCredential) => void;
  onDelete: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onReorder: (reorderedCredentials: AIProviderCredential[]) => void;
  onSaveEdit: (id: string, updates: { name?: string; modelPreference?: string; enabled?: boolean }) => Promise<void>;
  onCancelEdit: () => void;
  onSaveAdd: (credentialData: {
    provider: 'openai' | 'gemini' | 'anthropic';
    name: string;
    apiKey: string;
    modelPreference?: string;
  }) => Promise<void>;
  onCancelAdd: () => void;
  onTestApiKey?: (provider: 'openai' | 'gemini' | 'anthropic', apiKey: string) => Promise<{
    valid: boolean;
    error?: string;
    modelInfo?: { model: string; availableModels: string[] };
  }>;
}

export const AIProviderCredentialManager: React.FC<AIProviderCredentialManagerProps> = ({
  credentials,
  isLoading = false,
  editingCredentialId,
  isAdding,
  onStartAdd,
  onEdit,
  onDelete,
  onToggleEnabled,
  onReorder,
  onSaveEdit,
  onCancelEdit,
  onSaveAdd,
  onCancelAdd,
  onTestApiKey,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    modelPreference: string;
    enabled: boolean;
  }>({ name: '', modelPreference: '', enabled: true });
  const [addFormData, setAddFormData] = useState<{
    provider: 'openai' | 'gemini' | 'anthropic';
    name: string;
    apiKey: string;
    modelPreference: string;
  }>({ provider: 'openai', name: '', apiKey: '', modelPreference: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [defaultModel, setDefaultModel] = useState<string | undefined>();

  // Initialize form data when editing starts
  React.useEffect(() => {
    if (editingCredentialId) {
      const credential = credentials.find(c => c.id === editingCredentialId);
      if (credential) {
        setEditFormData({
          name: credential.name,
          modelPreference: credential.modelPreference || '',
          enabled: credential.enabled,
        });
      }
    }
  }, [editingCredentialId, credentials]);

  // Reset add form when adding starts
  React.useEffect(() => {
    if (isAdding) {
      setAddFormData({ provider: 'openai', name: '', apiKey: '', modelPreference: '' });
      setIsValidating(false);
      setIsValidated(false);
      setValidationError(undefined);
      setAvailableModels([]);
      setDefaultModel(undefined);
    }
  }, [isAdding]);

  const handleEdit = (credential: any) => {
    onEdit(credential);
  };

  const handleSaveEdit = async () => {
    if (!editingCredentialId) return;

    setIsSaving(true);
    try {
      await onSaveEdit(editingCredentialId, {
        name: editFormData.name.trim(),
        modelPreference: editFormData.modelPreference || undefined,
        enabled: editFormData.enabled,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestApiKey = async () => {
    if (!addFormData.apiKey.trim()) {
      setValidationError('Please enter an API key');
      return;
    }

    if (!onTestApiKey) {
      setIsValidated(true);
      return;
    }

    setIsValidating(true);
    setValidationError(undefined);

    try {
      const result = await onTestApiKey(addFormData.provider, addFormData.apiKey);

      if (result.valid) {
        setIsValidated(true);
        setValidationError(undefined);

        if (result.modelInfo) {
          setDefaultModel(result.modelInfo.model);
          setAvailableModels(result.modelInfo.availableModels || []);

          if (!addFormData.modelPreference && result.modelInfo.model) {
            setAddFormData(prev => ({ ...prev, modelPreference: result.modelInfo!.model }));
          }
        }
      } else {
        setIsValidated(false);
        setValidationError(result.error || 'API key validation failed');
      }
    } catch (error: any) {
      setIsValidated(false);
      setValidationError(error.message || 'Failed to validate API key');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveAdd = async () => {
    if (!isValidated && onTestApiKey) {
      setValidationError('Please validate the API key first');
      return;
    }

    if (!addFormData.name.trim()) {
      setValidationError('Please enter a name for this credential');
      return;
    }

    if (!addFormData.apiKey.trim()) {
      setValidationError('Please enter an API key');
      return;
    }

    setIsSaving(true);
    setValidationError(undefined);

    try {
      await onSaveAdd({
        provider: addFormData.provider,
        name: addFormData.name.trim(),
        apiKey: addFormData.apiKey.trim(),
        modelPreference: addFormData.modelPreference || defaultModel,
      });
    } catch (error: any) {
      setValidationError(error.message || 'Failed to save credential');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProviderChange = (newProvider: string) => {
    setAddFormData(prev => ({
      ...prev,
      provider: newProvider as 'openai' | 'gemini' | 'anthropic',
    }));
    setIsValidated(false);
    setValidationError(undefined);
    setAvailableModels([]);
    setDefaultModel(undefined);
  };

  const handleApiKeyChange = (value: string) => {
    setAddFormData(prev => ({ ...prev, apiKey: value }));
    setIsValidated(false);
    setValidationError(undefined);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const reordered = [...credentials];
      const [removed] = reordered.splice(draggedIndex, 1);
      reordered.splice(dragOverIndex, 0, removed);

      // Update priorities based on new order
      const reorderedWithPriorities = reordered.map((cred, idx) => ({
        ...cred,
        priority: idx,
      }));

      onReorder(reorderedWithPriorities);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'gemini':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'anthropic':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'OpenAI';
      case 'gemini':
        return 'Google Gemini';
      case 'anthropic':
        return 'Anthropic Claude';
      default:
        return provider;
    }
  };

  const getSuccessRate = (credential: AIProviderCredential) => {
    const total = credential.totalRequests;
    if (total === 0) return null;
    const rate = (credential.successCount / total) * 100;
    return rate.toFixed(1);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading credentials...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Provider Credentials
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Drag to reorder. AI will try keys from top to bottom.
          </p>
        </div>
        <Button onClick={onStartAdd} variant="primary" size="sm" disabled={isAdding || editingCredentialId !== null}>
          <Plus className="h-4 w-4 mr-2" />
          Add Credential
        </Button>
      </div>

      {/* Add Form (shown when isAdding is true) */}
      {isAdding && (
        <Card className="p-4 border-2 border-primary-500">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
              <Plus className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Add New Credential</h4>
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Provider
              </label>
              <CustomSelect
                options={[
                  { value: 'openai', label: 'OpenAI' },
                  { value: 'gemini', label: 'Google Gemini' },
                  { value: 'anthropic', label: 'Anthropic Claude' },
                ]}
                value={addFormData.provider}
                onChange={handleProviderChange}
                placeholder="Select provider"
              />
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <Input
                value={addFormData.name}
                onChange={(e) => setAddFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={`e.g., Personal ${getProviderName(addFormData.provider)}`}
                className="w-full"
                disabled={isSaving}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                A friendly name to identify this credential
              </p>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key
              </label>
              <div className="relative">
                <Input
                  type="password"
                  value={addFormData.apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full pr-10"
                  disabled={isSaving}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isValidated ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Key className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Test Button */}
              <div className="mt-2">
                <Button
                  type="button"
                  onClick={handleTestApiKey}
                  disabled={isValidating || !addFormData.apiKey.trim() || isSaving}
                  variant={isValidated ? 'secondary' : 'primary'}
                  size="sm"
                  className="w-full"
                >
                  {isValidating ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : isValidated ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Validated Successfully
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Test API Key
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Model Preference (shown after validation if models available) */}
            {isValidated && availableModels.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preferred Model (Optional)
                </label>
                <CustomSelect
                  options={availableModels.map(model => ({
                    value: model,
                    label: model,
                  }))}
                  value={addFormData.modelPreference || defaultModel || ''}
                  onChange={(value) => setAddFormData(prev => ({ ...prev, modelPreference: value }))}
                  placeholder="Select model"
                  searchable={availableModels.length > 5}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Default: {defaultModel}
                </p>
              </div>
            )}

            {/* Error Display */}
            {validationError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
              </div>
            )}

            {/* Success Message */}
            {isValidated && !validationError && (
              <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-600 dark:text-green-400">
                  API key validated successfully! You can now save this credential.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={onCancelAdd}
                disabled={isSaving}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveAdd}
                disabled={!isValidated || isSaving || !addFormData.name.trim()}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Credential'
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Credentials List */}
      {credentials.length === 0 && !isAdding ? (
        <Card className="p-8 text-center">
          <Key className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
          <h4 className="text-base font-medium text-gray-900 dark:text-white mb-1">
            No credentials added yet
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Add an AI provider credential to start using AI features
          </p>
          <Button onClick={onStartAdd} variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Credential
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {credentials.map((credential, index) => {
            const successRate = getSuccessRate(credential);
            const hasErrors = credential.errorCount > 0;
            const isEditing = editingCredentialId === credential.id;

            // Default models for each provider
            const defaultModels: Record<string, string[]> = {
              openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
              gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
              anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
            };
            const modelOptions = defaultModels[credential.provider] || [];

            return (
              <Card
                key={credential.id}
                draggable={!isEditing}
                onDragStart={(e) => !isEditing && handleDragStart(e, index)}
                onDragOver={(e) => !isEditing && handleDragOver(e, index)}
                onDragEnd={!isEditing ? handleDragEnd : undefined}
                className={`p-4 transition-all ${
                  isEditing ? '' : 'cursor-move'
                } ${
                  draggedIndex === index ? 'opacity-50' : ''
                } ${
                  dragOverIndex === index && draggedIndex !== index
                    ? 'border-primary-500 border-2'
                    : ''
                }`}
              >
                {isEditing ? (
                  /* Edit Form */
                  <div className="space-y-4 w-full">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Provider
                      </label>
                      <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {getProviderName(credential.provider)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name
                      </label>
                      <Input
                        value={editFormData.name}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Personal OpenAI"
                        className="w-full"
                        disabled={isSaving}
                      />
                    </div>

                    {modelOptions.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Preferred Model
                        </label>
                        <CustomSelect
                          options={modelOptions.map(model => ({
                            value: model,
                            label: model,
                          }))}
                          value={editFormData.modelPreference}
                          onChange={(value) => setEditFormData(prev => ({ ...prev, modelPreference: value }))}
                          placeholder="Select model (optional)"
                          searchable={modelOptions.length > 5}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Enabled</span>
                      <Toggle
                        checked={editFormData.enabled}
                        onChange={(checked) => setEditFormData(prev => ({ ...prev, enabled: checked }))}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="secondary"
                        onClick={onCancelEdit}
                        disabled={isSaving}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleSaveEdit}
                        disabled={isSaving || !editFormData.name.trim()}
                        className="flex-1"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Normal View */
                  <div className="flex items-start gap-3">
                    {/* Drag Handle */}
                    <div className="mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                        {/* Title Row */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {credential.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${getProviderBadgeColor(
                              credential.provider
                            )}`}
                          >
                            {getProviderName(credential.provider)}
                          </span>
                          {!credential.enabled && (
                            <Badge variant="secondary" className="text-xs">
                              Disabled
                            </Badge>
                          )}
                        </div>

                        {/* Model and Stats Row */}
                        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                          {credential.modelPreference && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Model:</span>
                              <span>{credential.modelPreference}</span>
                            </span>
                          )}
                          {credential.totalRequests > 0 && (
                            <>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {credential.totalRequests} requests
                              </span>
                              {successRate && (
                                <span
                                  className={`flex items-center gap-1 ${
                                    parseFloat(successRate) >= 90
                                      ? 'text-green-600 dark:text-green-400'
                                      : parseFloat(successRate) >= 70
                                      ? 'text-yellow-600 dark:text-yellow-400'
                                      : 'text-red-600 dark:text-red-400'
                                  }`}
                                >
                                  {parseFloat(successRate) >= 90 ? (
                                    <CheckCircle className="h-3 w-3" />
                                  ) : parseFloat(successRate) >= 70 ? (
                                    <AlertTriangle className="h-3 w-3" />
                                  ) : (
                                    <XCircle className="h-3 w-3" />
                                  )}
                                  {successRate}% success
                                </span>
                              )}
                            </>
                          )}
                          {credential.totalTokens > 0 && (
                            <span>{credential.totalTokens.toLocaleString()} tokens</span>
                          )}
                        </div>

                        {/* Error Display */}
                        {hasErrors && credential.lastError && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                  Last error ({credential.errorCount} total):
                                </span>
                                <p className="text-red-600 dark:text-red-400 mt-0.5 truncate">
                                  {credential.lastError}
                                </p>
                                {credential.lastErrorAt && (
                                  <p className="text-red-500 dark:text-red-500 mt-0.5">
                                    {new Date(credential.lastErrorAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Toggle
                          checked={credential.enabled}
                          onChange={(checked) => onToggleEnabled(credential.id, checked)}
                          size="sm"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(credential)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(credential.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
