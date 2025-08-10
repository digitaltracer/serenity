import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  selectAllTasks, 
  selectAllEntries, 
  selectAllProjects,
  selectAIInsights,
  selectAIRecaps,
  selectActiveProvider,
} from '@serenity/core';
import { Card, CardHeader, CardTitle, CardContent, AdvancedAnalytics, Badge, Button } from '@serenity/ui';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Zap, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Brain,
  Lightbulb,
  AlertCircle,
  FileText,
  ExternalLink,
} from 'lucide-react';

// No longer need lazy loading - circular dependency resolved by using shared types

export const AnalyticsPage: React.FC = () => {
  const tasks = useSelector(selectAllTasks);
  const journalEntries = useSelector(selectAllEntries);
  const projects = useSelector(selectAllProjects);
  const aiInsights = useSelector(selectAIInsights);
  const aiRecaps = useSelector(selectAIRecaps);
  const activeProvider = useSelector(selectActiveProvider);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [showAIInsights, setShowAIInsights] = useState(true);

  // Basic analytics calculations
  const basicStats = useMemo(() => {
    const completedTasks = tasks.filter(task => task.completed);
    const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
    
    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      completionRate,
      totalJournalEntries: journalEntries.length,
      totalProjects: projects.length,
    };
  }, [tasks, journalEntries, projects]);

  return (
    <div className="flex-1 h-full bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your productivity and progress over time
            </p>
          </div>

          {/* Basic Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Total Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {basicStats.totalTasks}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {basicStats.completedTasks} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Journal Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {basicStats.totalJournalEntries}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  entries written
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {basicStats.completionRate}%
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  overall progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {basicStats.totalProjects}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  active projects
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights Section */}
          {(aiInsights.length > 0 || aiRecaps.length > 0) && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    AI Insights & Recommendations
                    {activeProvider && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Powered by {activeProvider}
                      </Badge>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAIInsights(!showAIInsights)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    {showAIInsights ? (
                      <>
                        <span>Hide AI Insights</span>
                        <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>Show AI Insights</span>
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showAIInsights ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400 mb-4">
                      AI-powered insights and recommendations are available to help improve your productivity.
                    </div>
                    <div className="text-sm text-gray-400 dark:text-gray-500">
                      {aiInsights.length} insights • {aiRecaps.length} recaps
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Recent Insights */}
                    {aiInsights.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            Recent Insights
                          </h3>
                          <Button variant="outline" size="sm" onClick={() => window.location.hash = '#/ai-assistant'}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View All
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiInsights.slice(0, 4).map((insight) => {
                            const getInsightIcon = (type: string) => {
                              switch (type) {
                                case 'productivity': return <TrendingUp className="w-4 h-4 text-green-500" />;
                                case 'behavior': return <Brain className="w-4 h-4 text-blue-500" />;
                                case 'recommendation': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
                                case 'warning': return <AlertCircle className="w-4 h-4 text-orange-500" />;
                                default: return <Lightbulb className="w-4 h-4 text-blue-500" />;
                              }
                            };

                            return (
                              <div key={insight.id} className="border rounded-lg p-4 space-y-2 bg-white dark:bg-gray-800">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    {getInsightIcon(insight.type)}
                                    <h4 className="font-medium text-sm">{insight.title}</h4>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(insight.confidence * 100)}%
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                  {insight.description}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{insight.category}</span>
                                  <span>•</span>
                                  <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recent Recaps */}
                    {aiRecaps.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            Recent Recaps
                          </h3>
                          <Button variant="outline" size="sm" onClick={() => window.location.hash = '#/ai-assistant'}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View All
                          </Button>
                        </div>
                        <div className="space-y-4">
                          {aiRecaps.slice(0, 2).map((recap) => (
                            <div key={recap.id} className="border rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800">
                              <div className="flex items-start justify-between">
                                <h4 className="font-medium">{recap.title}</h4>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {recap.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {recap.summary}
                              </p>
                              {recap.highlights.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                                    Key Highlights
                                  </h5>
                                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    {recap.highlights.slice(0, 2).map((highlight, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <span className="text-green-500 mt-1">•</span>
                                        <span>{highlight}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                                <span>From {recap.source}</span>
                                <span>•</span>
                                <span>{new Date(recap.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No AI Data State */}
                    {aiInsights.length === 0 && aiRecaps.length === 0 && (
                      <div className="text-center py-8">
                        <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          No AI Insights Yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Set up your AI Assistant to get personalized insights and recommendations.
                        </p>
                        <Button onClick={() => window.location.hash = '#/ai-assistant'}>
                          <Brain className="w-4 h-4 mr-2" />
                          Set Up AI Assistant
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Advanced Analytics Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Advanced Analytics
                </div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {showAdvanced ? (
                    <>
                      <span>Hide Details</span>
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Show Details</span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showAdvanced ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400 mb-4">
                    Click "Show Details" to view advanced analytics including charts, trends, and project insights.
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    Features include daily progress charts, completion trends, and project distribution.
                  </div>
                </div>
              ) : (
                <AdvancedAnalytics 
                  tasks={tasks}
                  journalEntries={journalEntries}
                  projects={projects}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};