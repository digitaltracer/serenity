import React, { useEffect, useState } from 'react';
import { useNavigation, Link } from '../routing';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  EnhancedTextInput,
  useToast,
} from '../components';
import { useDispatch, useSelector } from 'react-redux';
import { addTask, addEntry, parseQuickInput, selectActiveProjects, selectAllEntries, logger } from '@serenity/core';
import { RootState } from '@serenity/core';
import { CheckSquare, BookOpen, FolderOpen, Lightbulb, Loader2, Sparkles } from 'lucide-react';

/**
 * Shared HomePage component with AI-powered quick-add functionality
 * Works across desktop (Electron) and web (Next.js) platforms
 */
export const HomePage: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const [quickText, setQuickText] = useState('');
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const activeProjects = useSelector(selectActiveProjects);
  const journalEntries = useSelector(selectAllEntries);
  const tasks = useSelector((state: RootState) => state.tasks.tasks);

  // Check if user has any existing data
  const hasExistingData = tasks.length > 0 || journalEntries.length > 0 || activeProjects.length > 0;

  // Check if we're in Electron environment
  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

  useEffect(() => {
    if (!isElectron) {
      // Web environment - AI features not yet available
      setActiveProvider(null);
      return;
    }

    logger.debug('useEffect triggered - starting AI settings load', { component: 'HomePage', operation: 'loadAISettings' });
    (async () => {
      try {
        logger.debug('Loading AI assistant settings', { component: 'HomePage', operation: 'loadAISettings' });

        const electronAPI = (window as any).electronAPI;
        logger.trace('electronAPI availability check', { component: 'HomePage', operation: 'loadAISettings', metadata: { available: !!electronAPI } });

        const aiAssistant = electronAPI?.aiAssistant;
        logger.trace('aiAssistant availability check', { component: 'HomePage', operation: 'loadAISettings', metadata: { available: !!aiAssistant, hasGetSettings: !!aiAssistant?.getSettings } });

        if (!electronAPI || !aiAssistant || !aiAssistant.getSettings) {
          logger.error('AI assistant not available', { component: 'HomePage', operation: 'loadAISettings' });
          setActiveProvider(null);
          return;
        }

        logger.debug('Calling getSettings', { component: 'HomePage', operation: 'loadAISettings' });
        const settingsResult = await aiAssistant.getSettings();
        logger.trace('Settings result received', { component: 'HomePage', operation: 'loadAISettings', metadata: { success: settingsResult?.success, hasSettings: !!settingsResult?.settings } });

        if (!settingsResult?.success || !settingsResult.settings) {
          logger.error('getSettings failed', { component: 'HomePage', operation: 'loadAISettings', metadata: { result: settingsResult } });
          setActiveProvider(null);
          return;
        }

        const provider = settingsResult.settings.activeProvider;
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
  }, [isElectron]);

  const features = [
    {
      title: 'ActionHub',
      description: 'Efficiently manage tasks, projects, and priorities with a customizable workflow.',
      icon: CheckSquare,
      route: '/actionhub',
    },
    {
      title: 'Journal',
      description: 'Capture thoughts, ideas, and reflections with a private, secure journaling system.',
      icon: BookOpen,
      route: '/journal',
    },
    {
      title: 'Projects',
      description: 'Organize related tasks into projects with visual progress tracking.',
      icon: FolderOpen,
      route: '/actionhub',
    },
    {
      title: 'AI Summaries',
      description: 'Generate AI-powered summaries of your tasks and journal entries by date range.',
      icon: Sparkles,
      route: '/summary',
    },
    {
      title: 'Insights Hub',
      description: 'AI-powered insights, analytics, and personalized recommendations.',
      icon: Lightbulb,
      route: '/insights',
    },
  ];

  const handleQuickAdd = async () => {
    if (isProcessing || !quickText.trim()) {
      return;
    }

    const text = quickText.trim();
    setIsProcessing(true);

    try {
      logger.info('User submitted input - Starting LLM processing', { component: 'HomePage', operation: 'quickAdd', metadata: { text } });

      let res: any = null;

      // Try AI processing if in Electron environment
      if (isElectron) {
        const llm = (window as any).electronAPI?.aiAssistant;

        logger.trace('QuickAdd availability check', {
          component: 'HomePage',
          operation: 'quickAdd',
          metadata: {
            llmAvailable: !!llm,
            quickAddAvailable: !!llm?.quickAdd,
            activeProvider,
            providerType: typeof activeProvider,
            providerTruthy: !!activeProvider,
          },
        });

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
                  contentSample: r.debug.contentSample,
                },
              });
            }
          } else {
            logger.warn('LLM quick-add failed, falling back to local parsing', {
              component: 'HomePage',
              operation: 'quickAdd',
              metadata: { error: r?.error, debug: r?.debug },
            });
          }
        } else {
          logger.warn('LLM conditions not met - skipping LLM call', {
            component: 'HomePage',
            operation: 'quickAdd',
            metadata: { quickAddAvailable: !!llm?.quickAdd, activeProvider },
          });
        }
      }

      // Fallback to local parsing if AI didn't work or not in Electron
      if (!res) {
        const local = parseQuickInput(text);
        logger.info('Local parse fallback', { component: 'HomePage', operation: 'quickAdd', metadata: { kind: local.kind } });
        if (local.kind === 'task') {
          res = { ...local.task, kind: 'task', project: local.debug?.project };
        } else {
          res = { ...local.entry, kind: 'journal', project: local.debug?.project };
        }
      }

      const findProjectByName = (projectName: string | null) => {
        if (!projectName || typeof projectName !== 'string') return undefined;
        const project = activeProjects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
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
  };

  return (
    <div className="flex-1 h-full bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.09),transparent_55%)] opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.04),transparent_60%)]" />
      <div className="relative flex-1 overflow-auto">
        <div className="px-6 pb-16 pt-12 md:px-10">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-8">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary flex items-center justify-center text-3xl md:text-4xl font-bold text-primary-foreground shadow-[0_0_40px_hsl(var(--primary)/0.3)]">
                    S
                  </div>
                </div>
                <div className="space-y-4 max-w-2xl mx-auto">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Serenity Notes
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground">
                    Boost your productivity and mindfulness with a powerful integrated task management and journaling experience.
                  </p>
                </div>
              </div>
            </div>

            <section className="space-y-6">
              <div className="relative">
                <EnhancedTextInput
                  value={quickText}
                  onChange={setQuickText}
                  onSubmit={handleQuickAdd}
                  placeholder={
                    isProcessing
                      ? 'Processing with AI...'
                      : "Speak naturally… 'Remind me to call mom tomorrow afternoon', or 'I felt great after my run today'. Press Enter to capture."
                  }
                  helperText="Just write like you speak. We'll interpret it into a task or a journal entry, and fill in tags, priority, and due dates automatically."
                  badge={activeProvider ? `Provider: ${activeProvider}` : 'Provider: not set'}
                  isProcessing={isProcessing}
                  disabled={isProcessing}
                />
                {isProcessing && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/90 px-4 py-2 shadow-lg backdrop-blur">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {activeProvider ? `Processing with ${activeProvider}...` : 'Processing...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-10">
              <div className="grid gap-6 md:grid-cols-2">
                {features.map(feature => {
                  const Icon = feature.icon;
                  return (
                    <Link key={feature.title} href={feature.route}>
                      <Card className="group relative overflow-hidden border border-border/60 bg-card/80 backdrop-blur transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                        <CardHeader className="relative z-10 space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors duration-300 group-hover:bg-primary/10">
                              <Icon className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-2xl">{feature.title}</CardTitle>
                          </div>
                          <CardDescription className="text-base leading-relaxed text-muted-foreground">
                            {feature.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              {!hasExistingData && (
                <div className="flex justify-center">
                  <Card className="relative overflow-hidden border border-border/60 bg-card/80 backdrop-blur">
                    <CardContent className="relative z-10 flex flex-col items-center gap-6 py-10 px-10 text-center">
                      <h2 className="text-2xl font-semibold text-foreground">
                        Ready to get started?
                      </h2>
                      <p className="max-w-xl text-muted-foreground">
                        Choose your workflow and begin your journey to enhanced productivity.
                      </p>
                      <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/actionhub">
                          <Button>Start with Tasks</Button>
                        </Link>
                        <Link href="/journal">
                          <Button variant="secondary">Begin Journaling</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
