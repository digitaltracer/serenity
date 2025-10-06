import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, useToast } from '@serenity/ui';
import { useDispatch, useSelector } from 'react-redux';
import { addTask, addEntry, parseQuickInput, selectActiveProjects, logger } from '@serenity/core';
import { CheckSquare, BookOpen, FolderOpen, BarChart3, Loader2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const [quickText, setQuickText] = useState('');
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const activeProjects = useSelector(selectActiveProjects);

  useEffect(() => {
    logger.debug('useEffect triggered - starting AI settings load', { component: 'HomePage', operation: 'loadAISettings' });
    (async () => {
      try {
        logger.debug('Loading AI assistant settings', { component: 'HomePage', operation: 'loadAISettings' });

        const electronAPI = (window as any).electronAPI;
        logger.trace('electronAPI availability check', { component: 'HomePage', operation: 'loadAISettings', metadata: { available: !!electronAPI } });

        const aiAssistant = electronAPI?.aiAssistant;
        logger.trace('aiAssistant availability check', { component: 'HomePage', operation: 'loadAISettings', metadata: { available: !!aiAssistant, hasGetSettings: !!aiAssistant?.getSettings } });

        if (!electronAPI) {
          logger.error('electronAPI is not available', { component: 'HomePage', operation: 'loadAISettings' });
          setActiveProvider(null);
          return;
        }

        if (!aiAssistant) {
          logger.error('aiAssistant is not available', { component: 'HomePage', operation: 'loadAISettings' });
          setActiveProvider(null);
          return;
        }

        if (!aiAssistant.getSettings) {
          logger.error('getSettings function is not available', { component: 'HomePage', operation: 'loadAISettings' });
          setActiveProvider(null);
          return;
        }

        logger.debug('Calling getSettings', { component: 'HomePage', operation: 'loadAISettings' });
        const settingsResult = await aiAssistant.getSettings();
        logger.trace('Settings result received', { component: 'HomePage', operation: 'loadAISettings', metadata: { success: settingsResult?.success, hasSettings: !!settingsResult?.settings } });

        if (!settingsResult) {
          logger.error('getSettings returned null/undefined', { component: 'HomePage', operation: 'loadAISettings' });
          setActiveProvider(null);
          return;
        }

        if (!settingsResult.success) {
          logger.error('getSettings returned success=false', { component: 'HomePage', operation: 'loadAISettings', metadata: { result: settingsResult } });
          setActiveProvider(null);
          return;
        }

        if (!settingsResult.settings) {
          logger.error('getSettings returned no settings object', { component: 'HomePage', operation: 'loadAISettings', metadata: { result: settingsResult } });
          setActiveProvider(null);
          return;
        }

        const provider = settingsResult.settings.activeProvider;
        logger.trace('Extracted activeProvider', { component: 'HomePage', operation: 'loadAISettings', metadata: { provider, type: typeof provider, truthy: !!provider } });

        // Use the same logic as AI Assistant page
        const providersWithKeys = settingsResult.settings.providersWithKeys;
        logger.trace('Providers with keys', { component: 'HomePage', operation: 'loadAISettings', metadata: { providersWithKeys } });

        const hasKey = provider ? !!providersWithKeys?.[provider] : false;
        logger.trace('Provider key check', { component: 'HomePage', operation: 'loadAISettings', metadata: { provider, hasKey } });

        if (provider && hasKey) {
          logger.info('Setting activeProvider', { component: 'HomePage', operation: 'loadAISettings', metadata: { provider } });
          setActiveProvider(provider);
        } else if (!provider) {
          logger.debug('No activeProvider set, looking for first provider with key', { component: 'HomePage', operation: 'loadAISettings' });
          const firstWithKey = (['openai', 'gemini', 'anthropic'] as const).find(p => providersWithKeys?.[p]);
          logger.debug('First provider with key search result', { component: 'HomePage', operation: 'loadAISettings', metadata: { firstWithKey } });

          if (firstWithKey) {
            logger.info('Auto-setting activeProvider', { component: 'HomePage', operation: 'loadAISettings', metadata: { provider: firstWithKey } });
            setActiveProvider(firstWithKey);
          } else {
            logger.warn('No providers have API keys, setting to null', { component: 'HomePage', operation: 'loadAISettings' });
            setActiveProvider(null);
          }
        } else {
          logger.warn('Provider set but no API key, setting to null', { component: 'HomePage', operation: 'loadAISettings', metadata: { provider } });
          setActiveProvider(null);
        }

      } catch (error) {
        logger.error('Error loading AI settings', { component: 'HomePage', operation: 'loadAISettings' }, error as Error);
        setActiveProvider(null);
      }
    })();
  }, []);

  const features = [
    {
      title: 'ActionHub',
      description: 'Efficiently manage tasks, projects, and priorities with a customizable workflow.',
      icon: CheckSquare,
      route: '/actionhub',
      color: 'text-blue-500',
    },
    {
      title: 'Journal',
      description: 'Capture thoughts, ideas, and reflections with a private, secure journaling system.',
      icon: BookOpen,
      route: '/journal',
      color: 'text-green-500',
    },
    {
      title: 'Projects',
      description: 'Organize related tasks into projects with visual progress tracking.',
      icon: FolderOpen,
      route: '/actionhub',
      color: 'text-purple-500',
    },
    {
      title: 'Analytics',
      description: 'Gain insights into your productivity patterns and achievements.',
      icon: BarChart3,
      route: '/analytics',
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="flex-1 h-full bg-background">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-2xl">S</span>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Serenity Notes
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Boost your productivity and mindfulness with a powerful integrated task management and journaling experience.
        </p>
        {/* Smart Quick Add */}
        <div className="mt-10 max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              disabled={isProcessing}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && quickText.trim() && !isProcessing) {
                e.preventDefault();
                const text = quickText.trim();
                setIsProcessing(true);
                (async () => {
                  try {
                    logger.info('User submitted input - Starting LLM processing', { component: 'HomePage', operation: 'quickAdd', metadata: { text } });

                    const llm = (window as any).electronAPI?.aiAssistant;
                    let res: any = null;

                    logger.trace('QuickAdd availability check', { component: 'HomePage', operation: 'quickAdd', metadata: { llmAvailable: !!llm, quickAddAvailable: !!llm?.quickAdd, activeProvider, providerType: typeof activeProvider, providerTruthy: !!activeProvider } });

                    if (llm?.quickAdd && activeProvider) {
                      logger.debug('Calling LLM with provider', { component: 'HomePage', operation: 'quickAdd', metadata: { provider: activeProvider } });
                      const r = await llm.quickAdd(text, activeProvider as 'openai' | 'gemini' | 'anthropic', true);
                      logger.debug('IPC result received', { component: 'HomePage', operation: 'quickAdd', metadata: { success: r?.success, hasData: !!r?.data } });
                      if (r?.success && r.data) {
                        res = r.data;
                        if (r.debug) {
                          logger.trace('LLM details', {
                            component: 'HomePage',
                            operation: 'quickAdd',
                            metadata: {
                              provider: r.debug.provider,
                              model: r.debug.model,
                              contentSample: r.debug.contentSample
                            }
                          });
                        }
                      } else {
                        logger.warn('LLM quick-add failed, falling back to local parsing', {
                          component: 'HomePage',
                          operation: 'quickAdd',
                          metadata: { error: r?.error, debug: r?.debug }
                        });
                      }
                    } else {
                      logger.warn('LLM conditions not met - skipping LLM call', { component: 'HomePage', operation: 'quickAdd', metadata: { quickAddAvailable: !!llm?.quickAdd, activeProvider } });
                    }
                    if (!res) {
                      // Fallback to local rule-based parser if LLM unavailable
                      const local = parseQuickInput(text);
                      logger.info('Local parse fallback', { component: 'HomePage', operation: 'quickAdd', metadata: { kind: local.kind } });
                      if (local.kind === 'task') {
                        res = { ...local.task, kind: 'task', project: local.debug?.project };
                      } else {
                        res = { ...local.entry, kind: 'journal', project: local.debug?.project };
                      }
                    }

                    // Helper function to find project by name (case-insensitive)
                    const findProjectByName = (projectName: string | null) => {
                      if (!projectName || typeof projectName !== 'string') return undefined;
                      const project = activeProjects.find(p =>
                        p.name.toLowerCase() === projectName.toLowerCase()
                      );
                      return project?.id;
                    };

                    if (res.kind === 'task') {
                      const projectId = findProjectByName(res.project);
                      const task = {
                        title: res.title || text,
                        description: res.description || undefined,
                        completed: false,
                        priority: res.priority || 'medium',
                        dueDate: res.dueDate ? new Date(res.dueDate) : undefined,
                        projectId,
                        tags: Array.isArray(res.tags) ? res.tags : [],
                        subtasks: [],
                        recurring: undefined,
                        userId: undefined,
                      } as any;
                      logger.info('Saving task', { component: 'HomePage', operation: 'quickAdd', metadata: { title: task.title, projectId, priority: task.priority } });
                      dispatch(addTask(task));
                      const projectName = projectId ? activeProjects.find(p => p.id === projectId)?.name : null;
                      const message = projectName ? `Task created in ${projectName}` : 'Task created';
                      showSuccess(message, task.title);
                    } else {
                      const entry = {
                        title: undefined,
                        content: res.description || res.title || text,
                        date: new Date(),
                        tags: Array.isArray(res.tags) ? res.tags : [],
                        pinned: false,
                      } as any;
                      logger.info('Saving journal entry', { component: 'HomePage', operation: 'quickAdd', metadata: { tagCount: entry.tags.length } });
                      dispatch(addEntry(entry));
                      showSuccess('Journal added');
                    }
                    setQuickText('');
                  } catch (err: any) {
                    logger.error('QuickAdd error', { component: 'HomePage', operation: 'quickAdd' }, err);
                    showError('Could not interpret input', err?.message || 'Try a simpler sentence.');
                  } finally {
                    setIsProcessing(false);
                  }
                })();
              }
              }}
              placeholder={isProcessing ? "Processing with AI..." : "Speak naturally… 'Remind me to call mom tomorrow afternoon', or 'I felt great after my run today'. Press Enter to capture."}
              rows={3}
              className={`w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white/90 dark:bg-gray-900/70 px-4 py-4 text-lg leading-7 text-foreground placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
            />
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/10 dark:bg-black/10 rounded-lg">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg border border-border">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm text-muted-foreground">
                    {activeProvider ? `Processing with ${activeProvider}...` : 'Processing...'}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-3 flex items-center justify-between gap-3">
            <span>
              Just write like you speak. We'll interpret it into a task or a journal entry, and fill in tags, priority, and due dates automatically.
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border text-[11px] text-muted-foreground">
              {activeProvider ? `Provider: ${activeProvider}` : 'Provider: not set'}
            </span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card 
              key={feature.title} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(feature.route)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-accent/60 ${feature.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Get Started */}
      <div className="text-center">
        <Card className="inline-block">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mb-6">
              Choose your workflow and begin your journey to enhanced productivity.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/actionhub')}>
                Start with Tasks
              </Button>
              <Button variant="secondary" onClick={() => navigate('/journal')}>
                Begin Journaling
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
        </div>
      </div>
    </div>
  );
};
