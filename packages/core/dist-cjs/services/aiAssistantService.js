"use strict";
/**
 * AI Assistant Service
 * Handles AI provider integration, data preprocessing, and analysis coordination
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAssistantService = void 0;
const logger_1 = require("../utils/logger");
const insightQualityService_1 = require("./insightQualityService");
class AIAssistantService {
    /**
     * Generate goal suggestions based on user activity patterns
     */
    static generateGoalSuggestions(data) {
        const suggestions = [];
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
    static preprocessTasks(tasks) {
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
    static generateLocalInsights(tasks, journalEntries) {
        const insights = [];
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
        startOfWeek.setHours(0, 0, 0, 0);
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
        }
        else if (entriesThisWeek.length >= 3) {
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
        const tagCounts = new Map();
        tasks.forEach(t => (t.tags || []).forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)));
        journalEntries.forEach(e => (e.tags || []).forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)));
        const topTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([tag]) => tag);
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
    static preprocessJournalEntries(entries) {
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
    static generateInsightPrompts(data) {
        const prompts = {};
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
    static generateRecapPrompts(data) {
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
    static filterUnanalyzedData(tasks, journalEntries, analysisTracker) {
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
            logger_1.logger.info(`🔍 AI Analysis Filtering Results:`, { component: 'aiAssistantService', operation: 'analysisFilteringResults:' });
            logger_1.logger.info(`📊 Tasks: ${newTasks.length} new / ${filteredTasksCount} already processed`, { component: 'aiAssistantService', operation: 'tasks:${newtasks.length}New' });
            logger_1.logger.info(`📝 Journal: ${newJournalEntries.length} new / ${filteredJournalCount} already processed`, { component: 'aiAssistantService', operation: 'journal:${newjournalentries.length}New' });
            if (lastTaskAnalysisDate) {
                logger_1.logger.info(`⏰ Last task analysis: ${lastTaskAnalysisDate.toISOString()}`, { component: 'aiAssistantService', operation: 'lastTaskAnalysis:' });
            }
            if (lastJournalAnalysisDate) {
                logger_1.logger.info(`⏰ Last journal analysis: ${lastJournalAnalysisDate.toISOString()}`, { component: 'aiAssistantService', operation: 'lastJournalAnalysis:' });
            }
        }
        return { newTasks, newJournalEntries };
    }
    /**
     * Create analysis summary for tracking
     */
    static createAnalysisSummary(analyzedTasks, analyzedJournalEntries) {
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
    static parseInsightsResponse(response) {
        try {
            // Always log raw response to help debug parsing issues
            try {
                // eslint-disable-next-line no-console
                logger_1.logger.error('[AIAssistantService] Raw AI response (insights):', { component: 'aiAssistantService', operation: '[aiassistantservice]RawResponse' }, new Error(response));
            }
            catch { }
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
                return parsed.insights.map((insight) => {
                    const insightObj = insight;
                    return {
                        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        type: insightObj.type || 'recommendation',
                        title: insightObj.title || 'AI Recommendation',
                        description: insightObj.description || '',
                        confidence: Math.max(0, Math.min(1, insightObj.confidence || 0.5)),
                        createdAt: new Date().toISOString(),
                        source: 'openai', // This will be set by the calling function
                        category: insightObj.category || 'tasks',
                        actionable: insightObj.actionable !== false,
                        metadata: insightObj.metadata || {},
                    };
                });
            }
            if (Array.isArray(parsed)) {
                return parsed.map((insight) => {
                    const insightObj = insight;
                    return {
                        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        type: insightObj.type || 'recommendation',
                        title: insightObj.title || 'AI Recommendation',
                        description: insightObj.description || '',
                        confidence: Math.max(0, Math.min(1, insightObj.confidence || 0.5)),
                        createdAt: new Date().toISOString(),
                        source: 'openai',
                        category: insightObj.category || 'tasks',
                        actionable: insightObj.actionable !== false,
                        metadata: insightObj.metadata || {},
                    };
                });
            }
        }
        catch (error) {
            try {
                // eslint-disable-next-line no-console
                logger_1.logger.error('Failed to parse AI insights response:', { component: 'aiAssistantService', operation: 'failedParseInsights' }, new Error(response));
            }
            catch { }
        }
        return [];
    }
    /**
     * Parse AI response and extract recap
     */
    static parseRecapResponse(response, type, period) {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to parse AI recap response:', { component: 'aiAssistantService', operation: 'failedParseRecap' }, error);
            return null;
        }
    }
    /**
     * Validate API key format
     */
    static validateApiKeyFormat(provider, apiKey) {
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
    static estimateTokenUsage(tasks, journalEntries) {
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
    static getProviderConfig(provider) {
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
     * Generate an analysis summary from insights for context continuity
     * This summary will be used in future analyses to track longitudinal patterns
     */
    static generateAnalysisSummary(params) {
        const { insights, tasksAnalyzed, journalsAnalyzed, userProfile } = params;
        // Extract key themes from insights (top themes by frequency and importance)
        const themeMap = new Map();
        insights.forEach(insight => {
            // Extract theme from insight type and category
            const theme = `${insight.category}_${insight.type}`;
            const existing = themeMap.get(theme) || { count: 0, totalConfidence: 0 };
            themeMap.set(theme, {
                count: existing.count + 1,
                totalConfidence: existing.totalConfidence + insight.confidence
            });
        });
        // Get top 5 themes sorted by frequency and confidence
        const keyThemes = Array.from(themeMap.entries())
            .map(([theme, data]) => ({
            theme,
            score: data.count * data.totalConfidence
        }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(t => t.theme);
        // Extract tracked patterns from high-confidence insights
        const trackedPatterns = insights
            .filter(insight => insight.confidence >= 0.6) // Only track high-confidence patterns
            .map(insight => ({
            pattern: insight.title,
            confidence: insight.confidence,
            category: insight.category
        }))
            .slice(0, 10); // Keep top 10 patterns
        // Get user focus areas from profile
        const userFocusAreas = userProfile?.focusAreas || [];
        // Generate summary text
        const topInsights = insights
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 3);
        const summaryParts = [];
        // Overview
        summaryParts.push(`Analyzed ${tasksAnalyzed} tasks and ${journalsAnalyzed} journal entries, generating ${insights.length} insights.`);
        // Top insights
        if (topInsights.length > 0) {
            summaryParts.push('\n\nKey Findings:');
            topInsights.forEach((insight, idx) => {
                summaryParts.push(`\n${idx + 1}. ${insight.title} (confidence: ${(insight.confidence * 100).toFixed(0)}%)`);
            });
        }
        // User focus
        if (userFocusAreas.length > 0) {
            summaryParts.push(`\n\nCurrent Focus Areas: ${userFocusAreas.slice(0, 3).join(', ')}`);
        }
        // Active goals
        if (userProfile?.activeGoals && userProfile.activeGoals.length > 0) {
            const goalTitles = userProfile.activeGoals.slice(0, 3).map(g => g.title);
            summaryParts.push(`\n\nActive Goals: ${goalTitles.join(', ')}`);
        }
        // Common tags/themes
        if (userProfile?.commonTags && userProfile.commonTags.length > 0) {
            const topTags = userProfile.commonTags.slice(0, 3).map(t => t.tag);
            summaryParts.push(`\n\nCommon Themes: ${topTags.join(', ')}`);
        }
        const summary_text = summaryParts.join('');
        logger_1.logger.info('📝 Generated analysis summary', {
            component: 'aiAssistantService',
            operation: 'generatedAnalysisSummary',
            metadata: {
                insightsCount: insights.length,
                keyThemesCount: keyThemes.length,
                trackedPatternsCount: trackedPatterns.length,
                summaryLength: summary_text.length
            }
        });
        return {
            summary_text,
            key_themes: keyThemes,
            tracked_patterns: trackedPatterns,
            user_focus_areas: userFocusAreas,
            tasks_analyzed: tasksAnalyzed,
            journals_analyzed: journalsAnalyzed,
            insights_generated: insights.length
        };
    }
    /**
     * Apply quality scoring, filtering, deduplication, and ranking to insights
     * This is the integration point for InsightQualityService
     */
    static applyQualityScoring(rawInsights, context) {
        logger_1.logger.info(`📊 Applying quality scoring to ${rawInsights.length} insights`, {
            component: 'aiAssistantService',
            operation: 'applyQualityScoring',
        });
        // Use InsightQualityService to process insights through the full pipeline:
        // validate → score → filter → deduplicate → rank
        const scoredInsights = insightQualityService_1.InsightQualityService.processInsights(rawInsights, context);
        // Convert ScoredInsight back to AIInsight (strip quality metadata for state storage)
        const processedInsights = scoredInsights.map((insight) => {
            // Keep the quality score in metadata for potential UI display
            const baseInsight = {
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
        logger_1.logger.info(`✅ Quality scoring complete: ${rawInsights.length} → ${processedInsights.length} high-quality insights`, {
            component: 'aiAssistantService',
            operation: 'applyQualityScoring',
            metadata: {
                filtered: rawInsights.length - processedInsights.length,
                avgQuality: processedInsights.length > 0
                    ? (processedInsights.reduce((sum, i) => sum + (i.metadata?.qualityScore?.overall || 0), 0) / processedInsights.length).toFixed(2)
                    : '0.00',
            },
        });
        return processedInsights;
    }
}
exports.AIAssistantService = AIAssistantService;
exports.default = AIAssistantService;
