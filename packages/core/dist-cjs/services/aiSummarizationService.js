"use strict";
/**
 * AI Summarization Service
 * Generates date-range based summaries of tasks and journal entries
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AISummarizationService = void 0;
const logger_1 = require("../utils/logger");
class AISummarizationService {
    /**
     * Generate a summary based on tasks and journal entries
     */
    static async generateSummary(request) {
        const { provider, startDate, endDate, types, tasks, journalEntries } = request;
        logger_1.logger.info('[AISummarizationService] Generating summary', {
            component: 'AISummarizationService',
            operation: 'generateSummary',
            metadata: { provider, startDate, endDate, types },
        });
        // Filter data by date range
        const filteredTasks = this.filterTasksByDateRange(tasks, startDate, endDate);
        const filteredJournals = this.filterJournalsByDateRange(journalEntries, startDate, endDate);
        // Determine summary type
        const summaryType = this.determineSummaryType(types);
        // Generate summary based on provider
        let result;
        if (provider === 'local') {
            result = this.generateLocalSummary(filteredTasks, filteredJournals, types, startDate, endDate);
        }
        else {
            // This will be implemented in the IPC handler using the AI provider
            // For now, return a placeholder that the IPC handler will replace
            result = this.generateLocalSummary(filteredTasks, filteredJournals, types, startDate, endDate);
        }
        logger_1.logger.info('[AISummarizationService] Summary generated successfully', {
            component: 'AISummarizationService',
            operation: 'generateSummary',
            metadata: { wordCount: result.wordCount, summaryType: result.summaryType },
        });
        return result;
    }
    /**
     * Filter tasks by date range
     */
    static filterTasksByDateRange(tasks, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end date
        return tasks.filter(task => {
            const taskDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
            return taskDate >= start && taskDate <= end;
        });
    }
    /**
     * Filter journal entries by date range
     */
    static filterJournalsByDateRange(journals, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return journals.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= start && entryDate <= end;
        });
    }
    /**
     * Determine summary type based on requested types
     */
    static determineSummaryType(types) {
        if (types.length === 2) {
            return 'combined';
        }
        return types[0];
    }
    /**
     * Generate a local summary without AI (fallback)
     */
    static generateLocalSummary(tasks, journals, types, startDate, endDate) {
        const includeTasks = types.includes('tasks');
        const includeJournals = types.includes('journal');
        let content = '';
        const metadata = {};
        // Format date range for title
        const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        // Generate title
        const title = `Summary: ${start} - ${end}`;
        // Tasks Summary
        if (includeTasks && tasks.length > 0) {
            const completedTasks = tasks.filter(t => t.completed);
            const pendingTasks = tasks.filter(t => !t.completed);
            content += `## Tasks Overview\n\n`;
            content += `**Period:** ${start} to ${end}\n\n`;
            content += `**Statistics:**\n`;
            content += `- Total tasks: ${tasks.length}\n`;
            content += `- Completed: ${completedTasks.length}\n`;
            content += `- In progress: ${pendingTasks.length}\n`;
            content += `- Completion rate: ${tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%\n\n`;
            // Priority breakdown
            const byPriority = {
                high: tasks.filter(t => t.priority === 'high').length,
                medium: tasks.filter(t => t.priority === 'medium').length,
                low: tasks.filter(t => t.priority === 'low').length,
            };
            content += `**By Priority:**\n`;
            content += `- High: ${byPriority.high}\n`;
            content += `- Medium: ${byPriority.medium}\n`;
            content += `- Low: ${byPriority.low}\n\n`;
            // Completed tasks
            if (completedTasks.length > 0) {
                content += `**Completed Tasks:**\n`;
                completedTasks.slice(0, 10).forEach(task => {
                    content += `- ✅ ${task.title}\n`;
                });
                if (completedTasks.length > 10) {
                    content += `- ...and ${completedTasks.length - 10} more\n`;
                }
                content += `\n`;
            }
            // Pending tasks
            if (pendingTasks.length > 0) {
                content += `**Pending Tasks:**\n`;
                pendingTasks.slice(0, 5).forEach(task => {
                    content += `- ⏳ ${task.title}\n`;
                });
                if (pendingTasks.length > 5) {
                    content += `- ...and ${pendingTasks.length - 5} more\n`;
                }
                content += `\n`;
            }
            // Extract tags
            const allTags = new Set();
            tasks.forEach(task => {
                if (task.tags) {
                    task.tags.forEach(tag => allTags.add(tag));
                }
            });
            if (allTags.size > 0) {
                content += `**Tags:** ${Array.from(allTags).join(', ')}\n\n`;
            }
            // Store task stats in metadata
            metadata.taskStats = {
                totalTasks: tasks.length,
                completedTasks: completedTasks.length,
                byPriority,
                byCategory: {}, // Could be expanded if categories are added
            };
            if (allTags.size > 0) {
                metadata.tags = Array.from(allTags);
            }
        }
        // Journal Summary
        if (includeJournals && journals.length > 0) {
            if (includeTasks) {
                content += `\n---\n\n`;
            }
            content += `## Journal Insights\n\n`;
            content += `**Period:** ${start} to ${end}\n\n`;
            content += `**Statistics:**\n`;
            content += `- Total entries: ${journals.length}\n`;
            // Word count
            const totalWords = journals.reduce((sum, entry) => {
                const wordCount = entry.content.trim().split(/\s+/).length;
                return sum + wordCount;
            }, 0);
            content += `- Total words written: ${totalWords}\n`;
            content += `- Average words per entry: ${Math.round(totalWords / journals.length)}\n\n`;
            // Mood analysis
            const moods = journals.filter(j => j.mood).map(j => j.mood);
            if (moods.length > 0) {
                const moodCounts = {};
                moods.forEach(mood => {
                    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
                });
                const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];
                const moodValues = {
                    'happy': 5,
                    'excited': 5,
                    'neutral': 3,
                    'sad': 1,
                    'stressed': 2,
                };
                const averageMood = moods.reduce((sum, mood) => sum + (moodValues[mood] || 3), 0) / moods.length;
                content += `**Mood Analysis:**\n`;
                content += `- Dominant mood: ${dominantMood}\n`;
                content += `- Average mood score: ${averageMood.toFixed(1)}/5\n\n`;
                metadata.moodAnalysis = {
                    averageMood,
                    dominantMood,
                    moodTrend: 'stable', // Could be calculated from temporal patterns
                };
            }
            // Recent entries
            if (journals.length > 0) {
                content += `**Recent Entries:**\n`;
                journals.slice(0, 5).forEach(entry => {
                    const date = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const preview = entry.content.slice(0, 100);
                    content += `- **${date}**: ${entry.title || preview}${entry.content.length > 100 ? '...' : ''}\n`;
                });
                if (journals.length > 5) {
                    content += `- ...and ${journals.length - 5} more entries\n`;
                }
                content += `\n`;
            }
            // Extract journal tags
            const journalTags = new Set();
            journals.forEach(entry => {
                if (entry.tags) {
                    entry.tags.forEach(tag => journalTags.add(tag));
                }
            });
            if (journalTags.size > 0) {
                content += `**Themes:** ${Array.from(journalTags).join(', ')}\n\n`;
                if (!metadata.tags) {
                    metadata.tags = Array.from(journalTags);
                }
                else {
                    metadata.tags = [...metadata.tags, ...Array.from(journalTags)];
                }
            }
        }
        // Calculate word count
        const wordCount = content.trim().split(/\s+/).length;
        return {
            title,
            content,
            summaryType: this.determineSummaryType(types),
            wordCount,
            metadata,
        };
    }
    /**
     * Build a prompt for AI provider
     */
    static buildSummaryPrompt(tasks, journals, types, startDate, endDate) {
        const includeTasks = types.includes('tasks');
        const includeJournals = types.includes('journal');
        const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        let prompt = `Generate a comprehensive summary for the period ${start} to ${end}.\n\n`;
        if (includeTasks) {
            prompt += `# Tasks Data (${tasks.length} total)\n\n`;
            prompt += JSON.stringify(tasks.map(t => ({
                title: t.title,
                description: t.description,
                completed: t.completed,
                priority: t.priority,
                tags: t.tags,
                dueDate: t.dueDate,
            })), null, 2);
            prompt += `\n\n`;
        }
        if (includeJournals) {
            prompt += `# Journal Data (${journals.length} total)\n\n`;
            prompt += JSON.stringify(journals.map(j => ({
                title: j.title,
                content: j.content.slice(0, 500), // Limit content length
                mood: j.mood,
                tags: j.tags,
                date: j.date,
            })), null, 2);
            prompt += `\n\n`;
        }
        prompt += `# Instructions\n\n`;
        prompt += `Generate a well-structured summary with the following sections:\n\n`;
        if (includeTasks) {
            prompt += `## Tasks Summary\n`;
            prompt += `- Overview paragraph (2-3 sentences)\n`;
            prompt += `- Key achievements (bullet points)\n`;
            prompt += `- Task statistics (completion rate, priorities, categories)\n`;
            prompt += `- Notable patterns or insights\n\n`;
        }
        if (includeJournals) {
            prompt += `## Journal Insights\n`;
            prompt += `- Overall mood analysis (dominant mood, patterns, trends)\n`;
            prompt += `- Key themes and topics\n`;
            prompt += `- Main achievements highlighted in entries\n`;
            prompt += `- Emotional patterns\n\n`;
        }
        prompt += `## Recommendations\n`;
        prompt += `- 3-5 actionable recommendations based on the data\n\n`;
        prompt += `Format the summary in clean markdown. Be concise but insightful.`;
        return prompt;
    }
    /**
     * Count words in text
     */
    static countWords(text) {
        return text.trim().split(/\s+/).length;
    }
}
exports.AISummarizationService = AISummarizationService;
