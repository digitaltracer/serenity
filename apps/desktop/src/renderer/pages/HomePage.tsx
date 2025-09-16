import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, useToast } from '@serenity/ui';
import { useDispatch, useSelector } from 'react-redux';
import { addTask, addEntry, parseQuickInput, selectActiveProjects } from '@serenity/core';
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
    console.log('🔄 [HomePage] useEffect triggered - starting AI settings load');
    (async () => {
      try {
        console.log('📋 [HomePage] STEP 1: Loading AI assistant settings...');

        const electronAPI = (window as any).electronAPI;
        console.log('📋 [HomePage] STEP 2: electronAPI available:', !!electronAPI);

        const aiAssistant = electronAPI?.aiAssistant;
        console.log('📋 [HomePage] STEP 3: aiAssistant available:', !!aiAssistant);
        console.log('📋 [HomePage] STEP 4: getSettings function available:', !!aiAssistant?.getSettings);

        if (!electronAPI) {
          console.error('❌ [HomePage] FAILURE: electronAPI is not available');
          setActiveProvider(null);
          return;
        }

        if (!aiAssistant) {
          console.error('❌ [HomePage] FAILURE: aiAssistant is not available');
          setActiveProvider(null);
          return;
        }

        if (!aiAssistant.getSettings) {
          console.error('❌ [HomePage] FAILURE: getSettings function is not available');
          setActiveProvider(null);
          return;
        }

        console.log('📋 [HomePage] STEP 5: Calling getSettings()...');
        const settingsResult = await aiAssistant.getSettings();
        console.log('📋 [HomePage] STEP 6: Settings result received:', settingsResult);
        console.log('📋 [HomePage] STEP 7: Settings result type:', typeof settingsResult);
        console.log('📋 [HomePage] STEP 8: Settings success:', settingsResult?.success);
        console.log('📋 [HomePage] STEP 9: Settings data:', settingsResult?.settings);

        if (!settingsResult) {
          console.error('❌ [HomePage] FAILURE: getSettings returned null/undefined');
          setActiveProvider(null);
          return;
        }

        if (!settingsResult.success) {
          console.error('❌ [HomePage] FAILURE: getSettings returned success=false:', settingsResult);
          setActiveProvider(null);
          return;
        }

        if (!settingsResult.settings) {
          console.error('❌ [HomePage] FAILURE: getSettings returned no settings object:', settingsResult);
          setActiveProvider(null);
          return;
        }

        const provider = settingsResult.settings.activeProvider;
        console.log('📋 [HomePage] STEP 10: Extracted activeProvider:', provider);
        console.log('📋 [HomePage] STEP 11: Provider type:', typeof provider);
        console.log('📋 [HomePage] STEP 12: Provider is truthy:', !!provider);

        // Use the same logic as AI Assistant page
        const providersWithKeys = settingsResult.settings.providersWithKeys;
        console.log('📋 [HomePage] STEP 13: Providers with keys:', providersWithKeys);

        const hasKey = provider ? !!providersWithKeys?.[provider] : false;
        console.log('📋 [HomePage] STEP 14: Current provider has key:', hasKey);

        if (provider && hasKey) {
          console.log('✅ [HomePage] SUCCESS: Setting activeProvider to:', provider);
          setActiveProvider(provider);
        } else if (!provider) {
          console.log('📋 [HomePage] STEP 15: No activeProvider set, looking for first provider with key...');
          const firstWithKey = (['openai', 'gemini', 'anthropic'] as const).find(p => providersWithKeys?.[p]);
          console.log('📋 [HomePage] STEP 16: First provider with key found:', firstWithKey);

          if (firstWithKey) {
            console.log('✅ [HomePage] SUCCESS: Auto-setting activeProvider to:', firstWithKey);
            setActiveProvider(firstWithKey);
          } else {
            console.warn('⚠️ [HomePage] WARNING: No providers have API keys, setting to null');
            setActiveProvider(null);
          }
        } else {
          console.warn('⚠️ [HomePage] WARNING: Provider set but no API key, setting to null');
          setActiveProvider(null);
        }

      } catch (error) {
        console.error('❌ [HomePage] EXCEPTION: Error loading AI settings:', error);
        console.error('❌ [HomePage] EXCEPTION: Error stack:', error instanceof Error ? error.stack : 'No stack available');
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
                    console.log('🚀 [QuickAdd] USER SUBMITTED INPUT - Starting LLM processing');
                    console.log('🚀 [QuickAdd] Input text:', text);

                    const llm = (window as any).electronAPI?.aiAssistant;
                    let res: any = null;

                    console.log('🔍 [QuickAdd] STEP 1: Debug check - llm available:', !!llm);
                    console.log('🔍 [QuickAdd] STEP 2: Debug check - quickAdd function:', !!llm?.quickAdd);
                    console.log('🔍 [QuickAdd] STEP 3: Debug check - activeProvider:', activeProvider);
                    console.log('🔍 [QuickAdd] STEP 4: Debug check - activeProvider type:', typeof activeProvider);
                    console.log('🔍 [QuickAdd] STEP 5: Debug check - activeProvider truthy:', !!activeProvider);

                    if (llm?.quickAdd && activeProvider) {
                      console.log('[QuickAdd] Calling LLM with provider:', activeProvider);
                      const r = await llm.quickAdd(text, activeProvider as 'openai' | 'gemini' | 'anthropic', true);
                      console.info('[QuickAdd] IPC result:', r);
                      if (r?.success && r.data) {
                        res = r.data;
                        if (r.debug) console.info('[QuickAdd] provider:', r.debug.provider, 'model:', r.debug.model, 'sample:', r.debug.contentSample);
                      } else {
                        console.warn('[QuickAdd] LLM quick-add failed; falling back to local parsing:', r?.error, r?.debug);
                      }
                    } else {
                      console.warn('[QuickAdd] LLM conditions not met - skipping LLM call');
                      console.warn('[QuickAdd] - llm.quickAdd available:', !!llm?.quickAdd);
                      console.warn('[QuickAdd] - activeProvider set:', !!activeProvider, activeProvider);
                    }
                    if (!res) {
                      // Fallback to local rule-based parser if LLM unavailable
                      const local = parseQuickInput(text);
                      console.info('[QuickAdd] Local parse fallback:', local);
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
                      console.info('[QuickAdd] Saving task:', task);
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
                      console.info('[QuickAdd] Saving journal entry:', entry);
                      dispatch(addEntry(entry));
                      showSuccess('Journal added');
                    }
                    setQuickText('');
                  } catch (err: any) {
                    console.error('[QuickAdd] error:', err);
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
