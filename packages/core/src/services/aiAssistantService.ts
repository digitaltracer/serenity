/**
 * AI Assistant Service
 * Handles AI provider integration, data preprocessing, and analysis coordination
 */

import { Task, JournalEntry } from '../types';
import { AIInsight, AIRecap } from '../store/slices/aiAssistantSlice';
import { logger } from '../utils/logger';
import { InsightQualityService, ScoredInsight } from './insightQualityService';

export interface AIApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AnalysisRequest {
  provider: 'openai' | 'gemini' | 'anthropic';
  tasks: Task[];
  journalEntries: JournalEntry[];
  dataTypes: string[];
  analysisType: 'insights' | 'recap';
  timeframe?: {
    start: Date;
    end: Date;
  };
}

export interface RecapRequest {
  provider: 'openai' | 'gemini' | 'anthropic';
  type: 'weekly' | 'monthly';
  period: {
    start: string;
    end: string;
  };
  tasks: Task[];
  journalEntries: JournalEntry[];
}

export interface PreprocessedTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  daysSinceCreated: number;
  isOverdue: boolean;
  completionTime: number | null;
}

export interface PreprocessedJournalEntry {
  id: string;
  content: string;
  mood?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  dayOfWeek: number;
  hourOfDay: number;
}

export interface GoalSuggestion {
  title: string;
  description: string;
  type: 'weekly_tasks' | 'project_tasks' | 'priority_tasks' | 'daily_streak' | 'journal_weekly' | 'completion_rate';
  priority: 'low' | 'medium' | 'high';
  targetCount?: number;
  timeframe: 'daily' | 'weekly' | 'monthly';
  reasoning: string;
  confidence: number;
}

export class AIAssistantService {
  /**
   * Generate goal suggestions based on user activity patterns
   */
  static generateGoalSuggestions(data: {
    tasks: Task[];
    journalEntries: JournalEntry[];
    existingGoals?: any[];
  }): GoalSuggestion[] {
    const suggestions: GoalSuggestion[] = [];
    const completedTasks = data.tasks.filter(t => t.completed);
    const weeklyAvgTasks = Math.floor(completedTasks.length / 4); // Assuming ~4 weeks of data

    // Suggest weekly tasks goal if user completes tasks regularly
    if (completedTasks.length > 10) {
      const targetTasks = Math.max(5, Math.floor(weeklyAvgTasks * 1.2)); // 20% increase
      suggestions.push({
        title: `Complete ${targetTasks} tasks per week`,
        description: `Based on your current pace, aim to complete ${targetTasks} tasks weekly to improve productivity.`,
        type: 'weekly_tasks',
        priority: 'medium',
        targetCount: targetTasks,
        timeframe: 'weekly',
        reasoning: `You've been completing an average of ${weeklyAvgTasks} tasks per week. A 20% increase is achievable and will boost your productivity.`,
        confidence: 0.85,
      });
    }

    // Suggest high-priority task goal if user has many pending high-priority tasks
    const highPriorityPending = data.tasks.filter(t => !t.completed && t.priority === 'high');
    if (highPriorityPending.length >= 3) {
      suggestions.push({
        title: 'Focus on high-priority tasks',
        description: 'Complete all high-priority tasks this week to stay on top of important work.',
        type: 'priority_tasks',
        priority: 'high',
        timeframe: 'weekly',
        reasoning: `You currently have ${highPriorityPending.length} pending high-priority tasks. Focusing on these will help you manage critical work better.`,
        confidence: 0.9,
      });
    }

    // Suggest daily streak goal based on task completion patterns
    const recentCompletions = completedTasks.filter(t => {
      const daysSince = (Date.now() - new Date(t.completedAt || t.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });

    if (recentCompletions.length >= 5) {
      suggestions.push({
        title: 'Build a 7-day completion streak',
        description: 'Complete at least one task every day for 7 consecutive days.',
        type: 'daily_streak',
        priority: 'medium',
        timeframe: 'weekly',
        reasoning: 'You\'ve been active recently. Building a streak will help establish consistent productivity habits.',
        confidence: 0.8,
      });
    }

    // Suggest journal goal if user journals occasionally but not regularly
    if (data.journalEntries.length > 3 && data.journalEntries.length < 20) {
      const weeklyJournalTarget = 3;
      suggestions.push({
        title: `Write ${weeklyJournalTarget} journal entries per week`,
        description: 'Regular journaling helps with self-reflection and mental clarity.',
        type: 'journal_weekly',
        priority: 'low',
        targetCount: weeklyJournalTarget,
        timeframe: 'weekly',
        reasoning: 'You\'ve started journaling but haven\'t made it a consistent habit yet. Regular entries can improve well-being.',
        confidence: 0.75,
      });
    }

    // Suggest completion rate goal if current rate is low
    const completionRate = data.tasks.length > 0 
      ? (completedTasks.length / data.tasks.length) * 100 
      : 0;

    if (completionRate < 60 && data.tasks.length > 10) {
      suggestions.push({
        title: 'Improve task completion rate to 75%',
        description: 'Focus on completing tasks rather than just creating them.',
        type: 'completion_rate',
        priority: 'high',
        timeframe: 'monthly',
        reasoning: `Your current completion rate is ${completionRate.toFixed(0)}%. Improving this will help you accomplish more.`,
        confidence: 0.85,
      });
    }

    // Filter out suggestions for goals that already exist
    const existingGoalTypes = new Set(data.existingGoals?.map(g => g.type) || []);
    return suggestions.filter(s => !existingGoalTypes.has(s.type));
  }

  /**
   * Preprocess tasks for AI analysis
   * Removes sensitive information and structures data
   */
  static preprocessTasks(tasks: Task[]): PreprocessedTask[] {
    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      // Only include first 100 chars of description to limit token usage
      description: task.description ? task.description.substring(0, 100) : '',
      completed: task.completed,
      priority: task.priority,
      tags: task.tags || [],
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      dueDate: task.dueDate,
      // Derived fields for analysis
      daysSinceCreated: task.createdAt ? Math.floor((Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      isOverdue: task.dueDate && !task.completed ? new Date(task.dueDate) < new Date() : false,
      completionTime: task.completed && task.updatedAt && task.createdAt 
        ? Math.floor((new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }));
  }

  /**
   * Generate basic, local insights without calling external providers.
   * Provides a sensible fallback when no provider is configured.
   */
  static generateLocalInsights(tasks: Task[], journalEntries: JournalEntry[]) {
    const insights: Array<{
      type: 'productivity' | 'behavior' | 'recommendation' | 'warning';
      title: string;
      description: string;
      category: 'tasks' | 'journal' | 'habits' | 'goals';
      actionable?: boolean;
      confidence: number;
      metadata?: Record<string, unknown>;
    }> = [];

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed);
    const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    // Insight: completion rate
    insights.push({
      type: 'productivity',
      title: `Completion rate is ${completionRate}%`,
      description: totalTasks > 0
        ? `You have completed ${completedTasks.length} of ${totalTasks} tasks. Consider limiting work-in-progress to improve throughput.`
        : 'No tasks yet. Create a few tasks to kickstart your workflow.',
      category: 'tasks',
      actionable: totalTasks > 0,
      confidence: 0.7,
      metadata: { totalTasks, completed: completedTasks.length, completionRate }
    });

    // Insight: overdue tasks
    const now = new Date();
    const overdue = tasks.filter(t => t.dueDate && !t.completed && new Date(t.dueDate) < now);
    if (overdue.length > 0) {
      insights.push({
        type: 'warning',
        title: `${overdue.length} overdue ${overdue.length === 1 ? 'task' : 'tasks'}`,
        description: 'Review due dates and reschedule or complete overdue work to reduce stress.',
        category: 'tasks',
        actionable: true,
        confidence: 0.8,
        metadata: { overdueCount: overdue.length }
      });
    }

    // Insight: weekly activity (created/completed)
    const startOfWeek = new Date();
    startOfWeek.setHours(0,0,0,0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const createdThisWeek = tasks.filter(t => new Date(t.createdAt) >= startOfWeek).length;
    const completedThisWeek = tasks.filter(t => t.completed && new Date(t.completedAt || t.updatedAt || t.createdAt) >= startOfWeek).length;
    insights.push({
      type: 'behavior',
      title: `This week: ${createdThisWeek} created, ${completedThisWeek} completed`,
      description: 'Balance task intake and completion to maintain steady progress.',
      category: 'tasks',
      actionable: false,
      confidence: 0.6,
      metadata: { createdThisWeek, completedThisWeek }
    });

    // Insight: journaling frequency
    const entriesThisWeek = journalEntries.filter(j => new Date(j.date) >= startOfWeek);
    if (entriesThisWeek.length === 0) {
      insights.push({
        type: 'recommendation',
        title: 'No journal entries this week',
        description: 'Try a short daily reflection to capture insights and reduce mental load.',
        category: 'journal',
        actionable: true,
        confidence: 0.6,
        metadata: { entriesThisWeek: 0 }
      });
    } else if (entriesThisWeek.length >= 3) {
      insights.push({
        type: 'behavior',
        title: `Consistent journaling (${entriesThisWeek.length} this week)`,
        description: 'Great job building a reflection habit. Keep it up for better clarity and focus.',
        category: 'journal',
        actionable: false,
        confidence: 0.7,
        metadata: { entriesThisWeek: entriesThisWeek.length }
      });
    }

    // Insight: top tags/themes
    const tagCounts = new Map<string, number>();
    tasks.forEach(t => (t.tags || []).forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)));
    journalEntries.forEach(e => (e.tags || []).forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)));
    const topTags = Array.from(tagCounts.entries()).sort((a,b) => b[1]-a[1]).slice(0, 2).map(([tag]) => tag);
    if (topTags.length > 0) {
      insights.push({
        type: 'productivity',
        title: `Frequent themes: ${topTags.join(', ')}`,
        description: 'Consider time-blocking for your top themes to reduce context switching.',
        category: 'habits',
        actionable: true,
        confidence: 0.55,
        metadata: { topTags }
      });
    }

    return insights;
  }
  /**
   * Preprocess journal entries for AI analysis
   * Removes sensitive information and structures data
   */
  static preprocessJournalEntries(entries: JournalEntry[]): PreprocessedJournalEntry[] {
    return entries.map(entry => ({
      id: entry.id,
      // Only include first 200 chars of content to limit token usage and maintain privacy
      content: entry.content ? entry.content.substring(0, 200) : '',
      mood: entry.mood,
      tags: entry.tags || [],
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      // Derived fields for analysis
      wordCount: entry.content ? entry.content.split(' ').length : 0,
      dayOfWeek: entry.createdAt ? new Date(entry.createdAt).getDay() : 0,
      hourOfDay: entry.createdAt ? new Date(entry.createdAt).getHours() : 0,
    }));
  }

  /**
   * Generate prompts for behavioral analysis
   */
  static generateInsightPrompts(data: {
    tasks: PreprocessedTask[];
    journalEntries: PreprocessedJournalEntry[];
    dataTypes: string[];
  }): Record<string, string> {
    const prompts: { [key: string]: string } = {};

    if (data.dataTypes.includes('tasks') && data.tasks.length > 0) {
      prompts.taskAnalysis = `
Analyze the following task data and provide insights about productivity patterns, habits, and recommendations:

Tasks Data:
${JSON.stringify(data.tasks, null, 2)}

Please provide insights in the following JSON format:
{
  "insights": [
    {
      "type": "productivity|behavior|recommendation|warning",
      "title": "Brief insight title",
      "description": "Detailed explanation of the insight",
      "confidence": 0.8,
      "category": "tasks",
      "actionable": true,
      "metadata": {}
    }
  ]
}

Focus on:
1. Completion patterns and success rates
2. Priority management effectiveness
3. Task creation vs completion trends
4. Procrastination indicators
5. Optimal working patterns
6. Areas for improvement

Keep insights actionable, specific, and helpful for productivity improvement.
`;
    }

    if (data.dataTypes.includes('journal') && data.journalEntries.length > 0) {
      prompts.journalAnalysis = `
Analyze the following journal data and provide insights about emotional patterns, reflection habits, and well-being trends:

Journal Data:
${JSON.stringify(data.journalEntries, null, 2)}

Please provide insights in the following JSON format:
{
  "insights": [
    {
      "type": "productivity|behavior|recommendation|warning",
      "title": "Brief insight title",
      "description": "Detailed explanation of the insight",
      "confidence": 0.8,
      "category": "journal",
      "actionable": true,
      "metadata": {}
    }
  ]
}

Focus on:
1. Emotional patterns and mood trends
2. Reflection consistency and habits
3. Topic themes and recurring concerns
4. Writing patterns and frequency
5. Correlation with productivity metrics
6. Well-being indicators

Keep insights supportive, constructive, and respectful of personal reflection.
`;
    }

    return prompts;
  }

  /**
   * Generate prompts for recap generation
   */
  static generateRecapPrompts(data: {
    type: 'weekly' | 'monthly';
    period: { start: string; end: string };
    tasks: PreprocessedTask[];
    journalEntries: PreprocessedJournalEntry[];
  }): string {
    const timeframe = data.type === 'weekly' ? 'week' : 'month';
    
    return `
Generate a comprehensive ${timeframe}ly recap for the period from ${data.period.start} to ${data.period.end}.

Data for analysis:
Tasks: ${JSON.stringify(data.tasks, null, 2)}
Journal Entries: ${JSON.stringify(data.journalEntries, null, 2)}

Please provide a recap in the following JSON format:
{
  "title": "Week/Month of [Date Range]",
  "summary": "Brief overall summary of the period",
  "highlights": ["Key achievement 1", "Key achievement 2", "Key achievement 3"],
  "challenges": ["Challenge faced 1", "Challenge faced 2"],
  "recommendations": ["Actionable suggestion 1", "Actionable suggestion 2", "Actionable suggestion 3"],
  "metrics": {
    "tasksCompleted": number,
    "productivityScore": number,
    "mostProductiveDay": "day name",
    "topCategories": ["category1", "category2"]
  }
}

Focus on:
1. Key accomplishments and completed tasks
2. Productivity trends and patterns
3. Challenges encountered and how they were handled
4. Emotional well-being indicators from journal entries
5. Actionable recommendations for improvement
6. Celebration of progress and growth

Keep the tone positive, encouraging, and forward-looking while being honest about areas for improvement.
`;
  }

  /**
   * Filter new data that hasn't been analyzed yet
   */
  static filterUnanalyzedData(
    tasks: Task[],
    journalEntries: JournalEntry[],
    analysisTracker: {
      processedTaskIds: string[];
      processedJournalIds: string[];
      lastTaskAnalysis?: string;
      lastJournalAnalysis?: string;
    }
  ): { newTasks: Task[]; newJournalEntries: JournalEntry[] } {
    const processedTaskIdsSet = new Set(analysisTracker.processedTaskIds);
    const processedJournalIdsSet = new Set(analysisTracker.processedJournalIds);
    
    const lastTaskAnalysisDate = analysisTracker.lastTaskAnalysis ? new Date(analysisTracker.lastTaskAnalysis) : null;
    const lastJournalAnalysisDate = analysisTracker.lastJournalAnalysis ? new Date(analysisTracker.lastJournalAnalysis) : null;

    // Filter tasks: new tasks or updated after last analysis
    const newTasks = tasks.filter(task => {
      // Check if task is unprocessed
      if (!processedTaskIdsSet.has(task.id)) {
        return true;
      }
      
      // Check if task was updated after last analysis
      if (lastTaskAnalysisDate && task.updatedAt) {
        const taskUpdatedDate = new Date(task.updatedAt);
        return taskUpdatedDate > lastTaskAnalysisDate;
      }
      
      return false;
    });

    // Filter journal entries: new entries or updated after last analysis
    const newJournalEntries = journalEntries.filter(entry => {
      // Check if entry is unprocessed
      if (!processedJournalIdsSet.has(entry.id)) {
        return true;
      }
      
      // Check if entry was updated after last analysis
      if (lastJournalAnalysisDate && entry.updatedAt) {
        const entryUpdatedDate = new Date(entry.updatedAt);
        return entryUpdatedDate > lastJournalAnalysisDate;
      }
      
      return false;
    });

    // Log filtering results for debugging
    if (process.env.NODE_ENV === 'development') {
      const filteredTasksCount = tasks.length - newTasks.length;
      const filteredJournalCount = journalEntries.length - newJournalEntries.length;
      
      logger.info(`🔍 AI Analysis Filtering Results:`, { component: 'aiAssistantService', operation: 'analysisFilteringResults:' });
      logger.info(`📊 Tasks: ${newTasks.length} new / ${filteredTasksCount} already processed`, { component: 'aiAssistantService', operation: 'tasks:${newtasks.length}New' });
      logger.info(`📝 Journal: ${newJournalEntries.length} new / ${filteredJournalCount} already processed`, { component: 'aiAssistantService', operation: 'journal:${newjournalentries.length}New' });
      
      if (lastTaskAnalysisDate) {
        logger.info(`⏰ Last task analysis: ${lastTaskAnalysisDate.toISOString()}`, { component: 'aiAssistantService', operation: 'lastTaskAnalysis:' });
      }
      if (lastJournalAnalysisDate) {
        logger.info(`⏰ Last journal analysis: ${lastJournalAnalysisDate.toISOString()}`, { component: 'aiAssistantService', operation: 'lastJournalAnalysis:' });
      }
    }

    return { newTasks, newJournalEntries };
  }

  /**
   * Create analysis summary for tracking
   */
  static createAnalysisSummary(
    analyzedTasks: Task[],
    analyzedJournalEntries: JournalEntry[]
  ): {
    processedTaskIds: string[];
    processedJournalIds: string[];
    lastTaskAnalysis?: string;
    lastJournalAnalysis?: string;
    totalTasksAnalyzed: number;
    totalJournalEntriesAnalyzed: number;
  } {
    const now = new Date().toISOString();
    
    return {
      processedTaskIds: analyzedTasks.map(task => task.id),
      processedJournalIds: analyzedJournalEntries.map(entry => entry.id),
      lastTaskAnalysis: analyzedTasks.length > 0 ? now : undefined,
      lastJournalAnalysis: analyzedJournalEntries.length > 0 ? now : undefined,
      totalTasksAnalyzed: analyzedTasks.length,
      totalJournalEntriesAnalyzed: analyzedJournalEntries.length,
    };
  }

  /**
   * Parse AI response and extract insights
   */
  static parseInsightsResponse(response: string): AIInsight[] {
    try {
      // Always log raw response to help debug parsing issues
      try {
        // eslint-disable-next-line no-console
        logger.error('[AIAssistantService] Raw AI response (insights):', { component: 'aiAssistantService', operation: '[aiassistantservice]RawResponse' }, new Error(response));
      } catch {}

      // Sanitize common wrapping formats (code fences, prose)
      let working = String(response).trim();
      // Quick fence trim
      working = working.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      // Remove leading prose up to a fenced block if present
      working = working.replace(/^[\s\S]*?```(?:json)?[\r\n]*/i, '');
      // Trim at end fence if present
      const fenceCloseIdx = working.lastIndexOf('```');
      if (fenceCloseIdx !== -1) {
        working = working.slice(0, fenceCloseIdx);
      }
      working = working.trim();
      // If not starting with {, slice between first { and last }
      if (!working.startsWith('{')) {
        const start = working.indexOf('{');
        const end = working.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          working = working.slice(start, end + 1);
        }
      }

      const parsed = JSON.parse(working);

      if (parsed && parsed.insights && Array.isArray(parsed.insights)) {
        return parsed.insights.map((insight: unknown) => {
          const insightObj = insight as Record<string, unknown>;
          return {
            id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: (insightObj.type as string) || 'recommendation',
            title: (insightObj.title as string) || 'AI Recommendation',
            description: (insightObj.description as string) || '',
            confidence: Math.max(0, Math.min(1, (insightObj.confidence as number) || 0.5)),
            createdAt: new Date().toISOString(),
            source: 'openai', // This will be set by the calling function
            category: (insightObj.category as string) || 'tasks',
            actionable: insightObj.actionable !== false,
            metadata: (insightObj.metadata as Record<string, unknown>) || {},
          } as AIInsight;
        });
      }
      if (Array.isArray(parsed)) {
        return parsed.map((insight: unknown) => {
          const insightObj = insight as Record<string, unknown>;
          return {
            id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: (insightObj.type as string) || 'recommendation',
            title: (insightObj.title as string) || 'AI Recommendation',
            description: (insightObj.description as string) || '',
            confidence: Math.max(0, Math.min(1, (insightObj.confidence as number) || 0.5)),
            createdAt: new Date().toISOString(),
            source: 'openai',
            category: (insightObj.category as string) || 'tasks',
            actionable: insightObj.actionable !== false,
            metadata: (insightObj.metadata as Record<string, unknown>) || {},
          } as AIInsight;
        });
      }
    } catch (error) {
      try {
        // eslint-disable-next-line no-console
        logger.error('Failed to parse AI insights response:', { component: 'aiAssistantService', operation: 'failedParseInsights' }, new Error(response));
      } catch {}
    }

    return [];
  }

  /**
   * Parse AI response and extract recap
   */
  static parseRecapResponse(response: string, type: 'weekly' | 'monthly', period: { start: string; end: string }): AIRecap | null {
    try {
      const parsed = JSON.parse(response);
      
      return {
        id: `recap_${type}_${Date.now()}`,
        type,
        title: parsed.title || `${type === 'weekly' ? 'Weekly' : 'Monthly'} Recap`,
        summary: parsed.summary || '',
        highlights: parsed.highlights || [],
        challenges: parsed.challenges || [],
        recommendations: parsed.recommendations || [],
        period,
        createdAt: new Date().toISOString(),
        source: 'openai', // This will be set by the calling function
        metadata: parsed.metrics || {},
      };
    } catch (error) {
      logger.error('Failed to parse AI recap response:', { component: 'aiAssistantService', operation: 'failedParseRecap' }, error as Error);
      return null;
    }
  }

  /**
   * Validate API key format
   */
  static validateApiKeyFormat(provider: 'openai' | 'gemini' | 'anthropic', apiKey: string): boolean {
    if (!apiKey || apiKey.trim().length === 0) {
      return false;
    }

    switch (provider) {
      case 'openai':
        return apiKey.startsWith('sk-') && apiKey.length > 20;
      case 'gemini':
        return apiKey.length > 10; // Gemini keys vary in format
      case 'anthropic':
        return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
      default:
        return false;
    }
  }

  /**
   * Estimate token usage for analysis
   */
  static estimateTokenUsage(tasks: Task[], journalEntries: JournalEntry[]): number {
    // Rough estimate: ~4 characters per token
    const taskTokens = tasks.reduce((acc, task) => {
      return acc + (task.title?.length || 0) + (task.description?.length || 0);
    }, 0) / 4;

    const journalTokens = journalEntries.reduce((acc, entry) => {
      return acc + (entry.content?.length || 0);
    }, 0) / 4;

    // Add prompt overhead (~500 tokens) and response tokens (~1000 tokens)
    return Math.ceil(taskTokens + journalTokens + 1500);
  }

  /**
   * Get provider-specific configuration
   */
  static getProviderConfig(provider: 'openai' | 'gemini' | 'anthropic') {
    const configs = {
      openai: {
        name: 'OpenAI',
        model: 'gpt-3.5-turbo',
        maxTokens: 4096,
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        keyPrefix: 'sk-',
      },
      gemini: {
        name: 'Google Gemini',
        model: 'gemini-pro',
        maxTokens: 8192,
        apiEndpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
        keyPrefix: '',
      },
      anthropic: {
        name: 'Anthropic Claude',
        model: 'claude-3-sonnet-20240229',
        maxTokens: 4096,
        apiEndpoint: 'https://api.anthropic.com/v1/messages',
        keyPrefix: 'sk-ant-',
      },
    };

    return configs[provider];
  }

  /**
   * Apply quality scoring, filtering, deduplication, and ranking to insights
   * This is the integration point for InsightQualityService
   */
  static applyQualityScoring(
    rawInsights: AIInsight[],
    context?: {
      previousInsights?: AIInsight[];
      focusAreas?: string[];
      recentCategories?: string[];
      minimumQuality?: number;
    }
  ): AIInsight[] {
    logger.info(`📊 Applying quality scoring to ${rawInsights.length} insights`, {
      component: 'aiAssistantService',
      operation: 'applyQualityScoring',
    });

    // Use InsightQualityService to process insights through the full pipeline:
    // validate → score → filter → deduplicate → rank
    const scoredInsights = InsightQualityService.processInsights(rawInsights, context);

    // Convert ScoredInsight back to AIInsight (strip quality metadata for state storage)
    const processedInsights: AIInsight[] = scoredInsights.map((insight: ScoredInsight) => {
      // Keep the quality score in metadata for potential UI display
      const baseInsight: AIInsight = {
        id: insight.id,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        confidence: insight.confidence,
        createdAt: insight.createdAt,
        source: insight.source,
        category: insight.category,
        actionable: insight.actionable,
        metadata: {
          ...(insight.metadata || {}),
          qualityScore: insight.qualityScore,
          similarTo: insight.similarTo,
          supersedes: insight.supersedes,
        },
      };
      return baseInsight;
    });

    logger.info(
      `✅ Quality scoring complete: ${rawInsights.length} → ${processedInsights.length} high-quality insights`,
      {
        component: 'aiAssistantService',
        operation: 'applyQualityScoring',
        metadata: {
          filtered: rawInsights.length - processedInsights.length,
          avgQuality: processedInsights.length > 0
            ? (processedInsights.reduce((sum, i: any) => sum + (i.metadata?.qualityScore?.overall || 0), 0) / processedInsights.length).toFixed(2)
            : '0.00',
        },
      }
    );

    return processedInsights;
  }
}

export default AIAssistantService;
