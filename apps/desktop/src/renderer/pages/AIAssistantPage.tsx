import React, { useState, useEffect } from 'react';
import { useLoadAISettings } from './AIAssistant/hooks/useLoadAISettings';
import { useListProviderModels } from './AIAssistant/hooks/useListProviderModels';
import { usePersistActiveProviderSettings } from './AIAssistant/hooks/usePersistActiveProviderSettings';
import { useSelector, useDispatch } from 'react-redux';
// Types are provided via ambient declarations in core; fall back to any where needed for stability
import {
  selectAIProviders,
  selectActiveProvider,
  selectIsAnalyzing,
  selectAnalysisProgress,
  selectAnalysisStatus,
  selectAIInsights,
  selectAIRecaps,
  selectAIConfiguration,
  selectAIErrors,
  selectLastAIError,
  selectAnalysisTracker,
  selectAIUsage,
  setActiveProvider,
  setAutoAnalyze,
  setAnalysisFrequency,
  setDataTypes,
  clearAIError,
  clearAllErrors,
  updateProvidersWithModelInfo,
  updateProvidersWithApiKeys,
  clearActiveProvider,
  clearProviderModelInfo,
  setApiKey,
  testApiKey,
  analyzeUserData,
  generateRecap,
  selectAllTasks,
  selectAllEntries,
} from '@serenity/core';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  Select,
  Toggle,
  ProgressBar,
  Badge,
  useToast,
  CustomSelect,
} from '@serenity/ui';
import {
  Brain,
  Key,
  Play,
  Settings,
  Lightbulb,
  FileText,
  AlertCircle,
  CheckCircle,
  Calendar,
  TrendingUp,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  Clock,
  Star,
  ArrowRight,
  Plus,
  Filter,
  Download,
  Share,
  Bookmark,
  BarChart3,
  BookOpen,
  Zap,
} from 'lucide-react';

export const AIAssistantPage: React.FC = () => {
  const dispatch = useDispatch();
  const anyDispatch = dispatch as any;
  const { showSuccess, showError } = useToast();
  
  // Redux state
  const providers = useSelector(selectAIProviders);
  const activeProvider = useSelector(selectActiveProvider);
  const isAnalyzing = useSelector(selectIsAnalyzing);
  const analysisProgress = useSelector(selectAnalysisProgress);
  const analysisStatus = useSelector(selectAnalysisStatus);
  const insights = useSelector(selectAIInsights);
  const recaps = useSelector(selectAIRecaps);
  const configuration = useSelector(selectAIConfiguration);
  const errors = useSelector(selectAIErrors);
  const lastError = useSelector(selectLastAIError);
  const analysisTracker = useSelector(selectAnalysisTracker);
  const tasks = useSelector(selectAllTasks);
  const journalEntries = useSelector(selectAllEntries);
  
  // Local state
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({});
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [recapPeriod, setRecapPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [activeTab, setActiveTab] = useState<'setup' | 'analyze' | 'insights' | 'recaps' | 'usage'>('setup');
  const usage = useSelector(selectAIUsage);
  const [availableModels, setAvailableModels] = useState<Record<string, { id: string; label: string }[]>>({});
  
  // Enhanced recap management state
  const [selectedRecap, setSelectedRecap] = useState<any>(null);
  const [recapFilter, setRecapFilter] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [autoRecapSchedule, setAutoRecapSchedule] = useState<{
    enabled: boolean;
    frequency: 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
  }>({
    enabled: false,
    frequency: 'weekly',
    dayOfWeek: 0, // Sunday
  });

  useEffect(() => { dispatch(clearAllErrors()); }, [dispatch]);
  useLoadAISettings(dispatch as any, {
    updateProvidersWithModelInfo,
    updateProvidersWithApiKeys,
    setActiveProvider,
  });

  // Load available models per provider when they have keys
  useListProviderModels(providers as any, setAvailableModels);

  const handleSetApiKey = async (providerId: 'openai' | 'gemini' | 'anthropic') => {
    const apiKey = apiKeys[providerId];
    if (!apiKey?.trim()) {
      showError('Invalid API Key', 'Please enter a valid API key');
      return;
    }

    try {
      const action = setApiKey({ provider: providerId, apiKey: apiKey.trim() });
      const result = await dispatch(action as any);
      console.log('[AIAssistantPage] setApiKey dispatch result:', result);
      const payload = (result as any)?.payload;
      if (payload?.usage) {
        console.log('[AIAssistantPage] usage from setApiKey:', payload.usage);
      }
      showSuccess('API Key Set', `${providerId.toUpperCase()} API key has been saved securely`);
      
      // Clear the input field for security
      setApiKeys(prev => ({ ...prev, [providerId]: '' }));
      
      // Set as active provider if none is selected and persist immediately
      if (!activeProvider) {
        dispatch(setActiveProvider(providerId));
        try {
          if ((window as any).electronAPI?.aiAssistant?.saveSettings) {
            console.log('[AIAssistantPage] Persisting activeProvider after key setup:', providerId);
            await (window as any).electronAPI.aiAssistant.saveSettings({
              activeProvider: providerId,
              autoAnalyze: configuration.autoAnalyze,
              analysisFrequency: configuration.analysisFrequency,
              dataTypes: configuration.dataTypes,
            });
            console.log('[AIAssistantPage] Saved activeProvider to settings');
          }
        } catch (e) {
          console.warn('[AIAssistantPage] Failed to save settings after key setup:', e);
        }
      }
      
      console.log('🔄 API key save completed, UI should update automatically');
      
    } catch (error) {
      console.error('API Key Setting Error:', error);
      console.error('Error details:', {
        message: (error as any)?.message,
        error: (error as any)?.error,
        type: typeof error,
        keys: Object.keys((error as any) || {})
      });
      
      // Extract meaningful error message from Redux async thunk error
      let errorMessage = 'Unknown error occurred';
      
      if (error && typeof error === 'object') {
        // Handle Redux async thunk rejection
        if ((error as any).message) {
          errorMessage = (error as any).message;
        } else if ((error as any).error && typeof (error as any).error === 'string') {
          errorMessage = (error as any).error;
        } else if ((error as any).payload && typeof (error as any).payload === 'string') {
          errorMessage = (error as any).payload;
        } else {
          // Last resort: stringify the object
          try {
            errorMessage = JSON.stringify(error);
          } catch (e) {
            errorMessage = 'Failed to parse error details';
          }
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      showError('Failed to Set API Key', errorMessage);
    }
  };

  // Persist active provider whenever it changes
  usePersistActiveProviderSettings(activeProvider as any, configuration);

  const handleTestApiKey = async (providerId: 'openai' | 'gemini' | 'anthropic') => {
    setTestingProvider(providerId);
    try {
      await anyDispatch(testApiKey(providerId)).unwrap();
      showSuccess('API Key Valid', `${providerId.toUpperCase()} API key is working correctly`);
    } catch (error) {
      showError('API Key Test Failed', String(error));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleAnalyzeData = async () => {
    if (!activeProvider) {
      showError('No Provider Selected', 'Please select an AI provider first');
      return;
    }

    const dataTypes = [];
    if (configuration.dataTypes.includeTasks) dataTypes.push('tasks');
    if (configuration.dataTypes.includeJournal) dataTypes.push('journal');
    if (configuration.dataTypes.includeProjects) dataTypes.push('projects');

    if (dataTypes.length === 0) {
      showError('No Data Types Selected', 'Please select at least one data type to analyze');
      return;
    }

    try {
      await anyDispatch(analyzeUserData({
        provider: activeProvider,
        dataTypes,
        forceReAnalyze: false,
        tasks,
        journalEntries,
      })).unwrap();
      
      showSuccess('Analysis Complete', 'Your data has been analyzed successfully');
      setActiveTab('insights');
    } catch (error) {
      showError('Analysis Failed', String(error));
    }
  };

  const handleGenerateRecap = async () => {
    if (!activeProvider) {
      showError('No Provider Selected', 'Please select an AI provider first');
      return;
    }

    const now = new Date();
    let startDate: Date;
    
    if (recapPeriod === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    try {
      await anyDispatch(generateRecap({
        provider: activeProvider,
        type: recapPeriod,
        period: {
          start: startDate.toISOString(),
          end: now.toISOString(),
        },
        tasks,
        journalEntries,
      })).unwrap();
      
      showSuccess('Recap Generated', `Your ${recapPeriod} recap has been created`);
      setActiveTab('recaps');
    } catch (error) {
      showError('Recap Generation Failed', String(error));
    }
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'openai': return '🤖';
      case 'gemini': return '✨';
      case 'anthropic': return '🧠';
      default: return '🤖';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'productivity': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'behavior': return <Brain className="w-4 h-4 text-blue-500" />;
      case 'recommendation': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default: return <Lightbulb className="w-4 h-4 text-blue-500" />;
    }
  };

  const TabButton = ({ id, label, active, onClick }: { id: string; label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );

  // Enhanced recap management functions
  const getFilteredRecaps = () => {
    if (recapFilter === 'all') return recaps;
    return recaps.filter(recap => recap.type === recapFilter);
  };

  const handleScheduleRecap = () => {
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = () => {
    // Save schedule to Redux/localStorage
    showSuccess('Schedule Saved', `Auto-recap ${autoRecapSchedule.enabled ? 'enabled' : 'disabled'}`);
    setIsScheduleModalOpen(false);
  };

  const handleExportRecap = (recap: any) => {
    const data = {
      title: recap.title,
      summary: recap.summary,
      highlights: recap.highlights,
      challenges: recap.challenges,
      recommendations: recap.recommendations,
      period: recap.period,
      metadata: recap.metadata,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recap.title.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('Export Complete', 'Recap exported successfully');
  };

  const getRecapTypeColor = (type: string) => {
    switch (type) {
      case 'weekly': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'monthly': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Enhanced Header with Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            AI Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyze your productivity patterns and get personalized insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => window.location.href = '#/analytics'}
              className="bg-green-600 hover:bg-green-700 text-white"
              title="View Analytics Dashboard"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button
              onClick={() => window.location.href = '#/actionhub'}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              title="Manage Tasks"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              ActionHub
            </Button>
            <Button
              onClick={() => window.location.href = '#/journal'}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              title="Open Journal"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Journal
            </Button>
          </div>
          {lastError && (
            <Button
              onClick={() => dispatch(clearAIError())}
              className="bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-300"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Clear Error
            </Button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${activeProvider ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm font-medium">
                {activeProvider ? `Connected to ${activeProvider}` : 'No AI provider selected'}
              </span>
            </div>
            {insights.length > 0 && (
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {insights.length} insights available
                </span>
              </div>
            )}
            {recaps.length > 0 && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {recaps.length} recaps generated
                </span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {lastError && (
        <div className="border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-red-800 dark:text-red-200 text-sm">
            {lastError}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-2">
        <TabButton id="setup" label="Setup" active={activeTab === 'setup'} onClick={() => setActiveTab('setup')} />
        <TabButton id="analyze" label="Analyze" active={activeTab === 'analyze'} onClick={() => setActiveTab('analyze')} />
        <TabButton id="insights" label={`Insights (${insights.length})`} active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} />
        <TabButton id="recaps" label={`Recaps (${recaps.length})`} active={activeTab === 'recaps'} onClick={() => setActiveTab('recaps')} />
        <TabButton id="usage" label={`Usage (${usage?.length || 0})`} active={activeTab === 'usage'} onClick={() => setActiveTab('usage')} />
      </div>

      {/* Setup Tab */}
      {activeTab === 'setup' && (
        <div className="space-y-6">
          {/* Provider Setup */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">AI Provider Setup</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Configure your AI provider API keys. Keys are stored securely and encrypted.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40 p-4 sm:p-6 space-y-5 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                  >
                    {/* Provider Header */}
                    <div className="flex flex-col md:flex-row md:items-start items-stretch justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                            {getProviderIcon(provider.id)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{provider.name}</h3>
                            {provider.isActive && (
                              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-600 text-white text-[11px] font-medium rounded-full">
                                <Zap className="w-3 h-3" />
                                Selected
                              </div>
                            )}
                          </div>
                          {/* Status Pills */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {provider.hasApiKey ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                                <CheckCircle className="w-3.5 h-3.5" />
                                API Key Set
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Set API Key
                              </div>
                            )}
                            {provider.modelInfo && (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs font-medium rounded-full">
                                <Star className="w-3.5 h-3.5" />
                                {provider.modelInfo.version}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {provider.hasApiKey && !provider.isActive && (
                        <button
                          onClick={async () => {
                            dispatch(setActiveProvider(provider.id));
                            if ((window as any).electronAPI?.aiAssistant?.saveSettings) {
                              await (window as any).electronAPI.aiAssistant.saveSettings({
                                activeProvider: provider.id,
                                autoAnalyze: configuration.autoAnalyze,
                                analysisFrequency: configuration.analysisFrequency,
                                dataTypes: configuration.dataTypes,
                              });
                            }
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium self-start"
                        >
                          Select
                        </button>
                      )}
                    </div>
                    
                    {/* API Key Configuration */}
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                      {!provider.hasApiKey ? (
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">API Key</label>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="flex-1 relative">
                              <Input
                                type={showApiKeys[provider.id] ? 'text' : 'password'}
                                value={apiKeys[provider.id] || ''}
                                onChange={(e) => setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                                placeholder={`Enter ${provider.name} API key`}
                                className="pr-10 h-11 w-full"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                onClick={() => setShowApiKeys(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                              >
                                {showApiKeys[provider.id] ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            <Button
                              onClick={() => handleSetApiKey(provider.id)}
                              disabled={!apiKeys[provider.id]?.trim()}
                              className="bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-green-700 text-white px-6 h-11 rounded-lg font-medium transition-colors w-full sm:w-auto"
                            >
                              <Key className="w-4 h-4 mr-2" />
                              Save
                            </Button>
                            <button
                              type="button"
                              onClick={() => handleTestApiKey(provider.id)}
                              disabled={!apiKeys[provider.id]?.trim() || testingProvider === provider.id}
                              className="text-sm text-gray-600 dark:text-gray-300 disabled:opacity-50 sm:self-auto self-start"
                            >
                              {testingProvider === provider.id ? 'Testing…' : 'Test'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col md:flex-row md:items-center items-stretch justify-between gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">API Key Set</p>
                              <p className="text-xs text-green-600 dark:text-green-400">Ready for AI operations</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap md:justify-end">
                            {/* Model selector (if listing is available) */}
                            {availableModels[provider.id]?.length ? (
                              <select
                                value={provider.modelInfo?.model || ''}
                                onChange={async (e) => {
                                  const value = e.target.value;
                                  // Save preferred model via settings
                                  const settingsUpdate = {
                                    activeProvider,
                                    autoAnalyze: configuration.autoAnalyze,
                                    analysisFrequency: configuration.analysisFrequency,
                                    dataTypes: configuration.dataTypes,
                                    preferredModels: { [provider.id]: value },
                                  } as any;
                                  console.log('[AIAssistantPage] Persisting preferred model for', provider.id, value);
                                  await (window as any).electronAPI?.aiAssistant?.saveSettings(settingsUpdate);
                                  // Update UI immediately
                                  dispatch(updateProvidersWithModelInfo({ [provider.id]: { model: value, version: value } }));
                                }}
                                className="text-sm rounded-md border px-2 py-1 bg-white dark:bg-gray-900 w-full md:w-auto max-w-full"
                              >
                              {availableModels[provider.id].map((m: { id: string; label: string }) => (
                                <option key={m.id} value={m.id}>{m.label}</option>
                              ))}
                              </select>
                            ) : null}
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleTestApiKey(provider.id)}
                              disabled={testingProvider === provider.id}
                              className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/30 w-full md:w-auto"
                            >
                              {testingProvider === provider.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Test Connection
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                await (window as any).electronAPI?.aiAssistant?.removeApiKey(provider.id);
                                showSuccess('API Key Removed', `${provider.name} API key has been removed`);
                                dispatch(updateProvidersWithApiKeys({ [provider.id]: false }));
                                if (activeProvider === provider.id) {
                                  // Clear persisted active provider
                                  if ((window as any).electronAPI?.aiAssistant?.saveSettings) {
                                    await (window as any).electronAPI.aiAssistant.saveSettings({
                                      activeProvider: undefined,
                                      autoAnalyze: configuration.autoAnalyze,
                                      analysisFrequency: configuration.analysisFrequency,
                                      dataTypes: configuration.dataTypes,
                                    });
                                  }
                                  dispatch(clearActiveProvider());
                                }
                                // Clear model info badge immediately
                                dispatch(clearProviderModelInfo(provider.id as any));
                              }}
                              className="w-full md:w-auto"
                            >
                              Remove Key
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Analysis Configuration</h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Data Types</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label>Include Tasks</label>
                      <Toggle
                        checked={configuration.dataTypes.includeTasks}
                        onChange={(checked) => 
                          dispatch(setDataTypes({ includeTasks: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label>Include Journal</label>
                      <Toggle
                        checked={configuration.dataTypes.includeJournal}
                        onChange={(checked) => 
                          dispatch(setDataTypes({ includeJournal: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label>Include Projects</label>
                      <Toggle
                        checked={configuration.dataTypes.includeProjects}
                        onChange={(checked) => 
                          dispatch(setDataTypes({ includeProjects: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Automation</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label>Auto Analyze</label>
                      <Toggle
                        checked={configuration.autoAnalyze}
                        onChange={(checked) => dispatch(setAutoAnalyze(checked))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Analysis Frequency</label>
                      <Select
                        value={configuration.analysisFrequency}
                        onChange={(value: any) => 
                          dispatch(setAnalysisFrequency(value as 'daily' | 'weekly' | 'manual'))
                        }
                        options={[
                          { value: 'manual', label: 'Manual' },
                          { value: 'daily', label: 'Daily' },
                          { value: 'weekly', label: 'Weekly' },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analyze Tab */}
      {activeTab === 'analyze' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Analysis */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Data Analysis</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Analyze your productivity patterns and behaviors
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isAnalyzing ? (
                  <div className="space-y-3">
                     <div className="flex items-center gap-2">
                       <RefreshCw className="w-4 h-4 animate-spin" />
                       <span className="text-sm font-medium">{analysisStatus}</span>
                     </div>
                     <ProgressBar value={analysisProgress} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>Tasks available: {tasks.length}</p>
                      <p>Journal entries: {journalEntries.length}</p>
                      <p>Last analysis: {analysisTracker.lastTaskAnalysis ? new Date(analysisTracker.lastTaskAnalysis).toLocaleDateString() : 'Never'}</p>
                    </div>
                    <Button
                      onClick={handleAnalyzeData}
                      disabled={!activeProvider || isAnalyzing}
                      className="w-full"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Analyze Data
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recap Generation */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Generate Recap</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Create weekly or monthly productivity summaries
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Recap Period</label>
                    <Select
                      value={recapPeriod}
                      onChange={(value: unknown) => setRecapPeriod(value as 'weekly' | 'monthly')}
                    options={[
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                    ]}
                  />
                </div>
                <Button
                  onClick={handleGenerateRecap}
                  disabled={!activeProvider || isAnalyzing}
                  className="w-full"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Generate {recapPeriod === 'weekly' ? 'Weekly' : 'Monthly'} Recap
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">AI Insights</h2>
              </div>
              <Badge>{insights.length} insights</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {insights.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No insights yet. Run an analysis to get started!</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setActiveTab('analyze')}
                >
                  Go to Analysis
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getInsightIcon(insight.type)}
                        <h3 className="font-medium">{insight.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs">
                          {insight.category}
                        </Badge>
                        <Badge className="text-xs">
                          {Math.round(insight.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">{insight.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>From {insight.source}</span>
                      <span>•</span>
                      <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recaps Tab */}
      {activeTab === 'recaps' && (
        <div className="space-y-6">
          {/* Recap Management Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold">Recap Management</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleScheduleRecap}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                  <Button onClick={() => setActiveTab('analyze')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate New
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge className="px-3 py-1">
                    {getFilteredRecaps().length} of {recaps.length} recaps
                  </Badge>
                  {autoRecapSchedule.enabled && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      <Clock className="w-3 h-3 mr-1" />
                      Auto-scheduled {autoRecapSchedule.frequency}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <div className="min-w-[160px]">
                    <CustomSelect
                      value={recapFilter}
                      onChange={(val) => setRecapFilter(val as 'all' | 'weekly' | 'monthly')}
                      options={[
                        { value: 'all', label: 'All Recaps' },
                        { value: 'weekly', label: 'Weekly Only' },
                        { value: 'monthly', label: 'Monthly Only' },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recaps List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Generated Recaps</h3>
                {getFilteredRecaps().length > 0 && (
                  <div className="text-sm text-gray-500">
                    Sorted by most recent
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {getFilteredRecaps().length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {recaps.length === 0 
                      ? "No recaps yet. Generate your first recap to get started!"
                      : `No ${recapFilter} recaps found. Try a different filter.`
                    }
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setActiveTab('analyze')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Recap
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredRecaps()
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((recap) => (
                    <div key={recap.id} className="border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{recap.title}</h3>
                            <Badge className={`text-xs capitalize ${getRecapTypeColor(recap.type)}`}>
                              {recap.type}
                            </Badge>
                            {recap.metadata?.productivityScore && (
                              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                <Star className="w-3 h-3 mr-1" />
                                {Math.round(recap.metadata.productivityScore * 100)}% productivity
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{recap.summary}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            onClick={() => setSelectedRecap(recap)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleExportRecap(recap)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recap.highlights.length > 0 && (
                          <div>
                            <h4 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Highlights ({recap.highlights.length})
                            </h4>
                            <ul className="space-y-1 text-sm">
                               {recap.highlights.slice(0, 2).map((highlight: string, index: number) => (
                                <li key={index} className="text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                  <span className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                                  {highlight}
                                </li>
                              ))}
                              {recap.highlights.length > 2 && (
                                <li className="text-gray-500 text-xs">
                                  +{recap.highlights.length - 2} more highlights
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                        
                        {recap.challenges.length > 0 && (
                          <div>
                            <h4 className="font-medium text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              Challenges ({recap.challenges.length})
                            </h4>
                            <ul className="space-y-1 text-sm">
                               {recap.challenges.slice(0, 2).map((challenge: string, index: number) => (
                                <li key={index} className="text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                  <span className="w-1 h-1 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                                  {challenge}
                                </li>
                              ))}
                              {recap.challenges.length > 2 && (
                                <li className="text-gray-500 text-xs">
                                  +{recap.challenges.length - 2} more challenges
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                        
            {recap.recommendations.length > 0 && (
                          <div>
                            <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1">
                              <Lightbulb className="w-4 h-4" />
                              Recommendations ({recap.recommendations.length})
                            </h4>
                <ul className="space-y-1 text-sm">
                  {recap.recommendations.slice(0, 2).map((recommendation: string, index: number) => (
                                <li key={index} className="text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                  <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                                  {recommendation}
                                </li>
                              ))}
                              {recap.recommendations.length > 2 && (
                                <li className="text-gray-500 text-xs">
                                  +{recap.recommendations.length - 2} more recommendations
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(recap.period.start).toLocaleDateString()} - {new Date(recap.period.end).toLocaleDateString()}
                          </span>
                          <span>From {recap.source}</span>
                          <span>{new Date(recap.createdAt).toLocaleDateString()}</span>
                        </div>
                        {recap.metadata?.tasksCompleted && (
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-green-600 dark:text-green-400">
                              {recap.metadata.tasksCompleted} tasks completed
                            </span>
                            {recap.metadata.mostProductiveDay && (
                              <span className="text-blue-600 dark:text-blue-400">
                                Best day: {recap.metadata.mostProductiveDay}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === 'usage' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Token Usage</h2>
              </div>
              <Badge>{usage?.length || 0} records</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* debug log removed for production typing */}
            {(usage?.length || 0) === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No usage yet. Run an analysis or generate a recap to see token usage.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(() => {
                    const totals = (usage as any[]).reduce((acc, u) => {
                      acc.prompt += u.promptTokens || 0;
                      acc.completion += u.completionTokens || 0;
                      acc.total += u.totalTokens || 0;
                      return acc;
                    }, { prompt: 0, completion: 0, total: 0 });
                    return (
                      <>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500">Prompt tokens</div>
                          <div className="text-lg font-semibold">{totals.prompt.toLocaleString()}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500">Completion tokens</div>
                          <div className="text-lg font-semibold">{totals.completion.toLocaleString()}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500">Total tokens</div>
                          <div className="text-lg font-semibold">{totals.total.toLocaleString()}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                {/* List */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {(usage as any[]).slice(0, 200).map((u, idx) => (
                    <div key={u.id || idx} className="grid grid-cols-12 gap-3 p-3 text-sm">
                      <div className="col-span-3 text-gray-500">{new Date(u.timestamp).toLocaleString()}</div>
                      <div className="col-span-2 capitalize">{u.provider}</div>
                      <div className="col-span-2 capitalize">{u.operation}</div>
                      <div className="col-span-2 text-right">{(u.promptTokens||0).toLocaleString()} / {(u.completionTokens||0).toLocaleString()}</div>
                      <div className="col-span-3 text-right font-medium">{(u.totalTokens||0).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Schedule Auto Recaps
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Auto Recaps</label>
                <Toggle
                  checked={autoRecapSchedule.enabled}
                  onChange={(enabled) => setAutoRecapSchedule(prev => ({ ...prev, enabled }))}
                />
              </div>
              
              {autoRecapSchedule.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Frequency</label>
                      <Select
                        value={autoRecapSchedule.frequency}
                        onChange={(value: unknown) => setAutoRecapSchedule(prev => ({ 
                          ...prev, 
                          frequency: value as 'weekly' | 'monthly' 
                        }))}
                      options={[
                        { value: 'weekly', label: 'Weekly' },
                        { value: 'monthly', label: 'Monthly' },
                      ]}
                    />
                  </div>
                  
                  {autoRecapSchedule.frequency === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Day of Week</label>
                      <Select
                        value={autoRecapSchedule.dayOfWeek?.toString() || '0'}
                        onChange={(value: unknown) => setAutoRecapSchedule(prev => ({ 
                          ...prev, 
                          dayOfWeek: parseInt(String(value)) 
                        }))}
                        options={[
                          { value: '0', label: 'Sunday' },
                          { value: '1', label: 'Monday' },
                          { value: '2', label: 'Tuesday' },
                          { value: '3', label: 'Wednesday' },
                          { value: '4', label: 'Thursday' },
                          { value: '5', label: 'Friday' },
                          { value: '6', label: 'Saturday' },
                        ]}
                      />
                    </div>
                  )}
                  
                  {autoRecapSchedule.frequency === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Day of Month</label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={autoRecapSchedule.dayOfMonth || 1}
                        onChange={(e) => setAutoRecapSchedule(prev => ({ 
                          ...prev, 
                          dayOfMonth: parseInt(e.target.value) 
                        }))}
                        placeholder="1-31"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3 mt-6 pt-4 border-t">
              <Button
                onClick={() => setIsScheduleModalOpen(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSchedule}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Save Schedule
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Recap Detail Modal */}
      {selectedRecap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold">{selectedRecap.title}</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedRecap.period.start).toLocaleDateString()} - {new Date(selectedRecap.period.end).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleExportRecap(selectedRecap)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <button
                  onClick={() => setSelectedRecap(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Summary
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedRecap.summary}
                  </p>
                </div>

                {/* Metrics */}
                {selectedRecap.metadata && Object.keys(selectedRecap.metadata).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-600" />
                      Key Metrics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedRecap.metadata.tasksCompleted && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                            {selectedRecap.metadata.tasksCompleted}
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-500">Tasks Completed</div>
                        </div>
                      )}
                      {selectedRecap.metadata.productivityScore && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                            {Math.round(selectedRecap.metadata.productivityScore * 100)}%
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-500">Productivity Score</div>
                        </div>
                      )}
                      {selectedRecap.metadata.mostProductiveDay && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                          <div className="text-lg font-bold text-purple-700 dark:text-purple-400">
                            {selectedRecap.metadata.mostProductiveDay}
                          </div>
                          <div className="text-sm text-purple-600 dark:text-purple-500">Most Productive Day</div>
                        </div>
                      )}
                      {selectedRecap.metadata.topCategories && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                          <div className="text-sm font-bold text-orange-700 dark:text-orange-400">
                            {selectedRecap.metadata.topCategories.slice(0, 2).join(', ')}
                          </div>
                          <div className="text-sm text-orange-600 dark:text-orange-500">Top Categories</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Highlights */}
                {selectedRecap.highlights.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Highlights
                    </h3>
                    <ul className="space-y-3">
                       {selectedRecap.highlights.map((highlight: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <Star className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Challenges */}
                {selectedRecap.challenges.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      Challenges
                    </h3>
                    <ul className="space-y-3">
                       {selectedRecap.challenges.map((challenge: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {selectedRecap.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                      Recommendations
                    </h3>
                    <ul className="space-y-3">
                       {selectedRecap.recommendations.map((recommendation: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
