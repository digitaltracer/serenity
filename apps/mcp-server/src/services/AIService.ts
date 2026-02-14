import { db } from '../utils/pool.js';
import logger from '../utils/logger.js';
import { DatabaseError } from '../utils/errors.js';

export interface AIInsight {
  id: string;
  provider: 'openai' | 'gemini' | 'anthropic' | 'local';
  type: 'productivity' | 'behavior' | 'recommendation' | 'warning';
  title: string;
  description: string;
  confidence: number;
  category: 'tasks' | 'journal' | 'habits' | 'goals';
  actionable: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface AIRecap {
  id: string;
  provider: 'openai' | 'gemini' | 'anthropic' | 'local';
  type: 'weekly' | 'monthly';
  title: string;
  summary: string;
  highlights: string[];
  challenges: string[];
  recommendations: string[];
  period: {
    start: string;
    end: string;
  };
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface GenerateInsightsParams {
  dataTypes: ('tasks' | 'journal')[];
  analysisMode?: 'incremental' | 'window' | 'full';
  timeWindow?: {
    start: string;
    end: string;
  };
}

export interface GenerateSummaryParams {
  type: 'weekly' | 'monthly';
  period: {
    start: string;
    end: string;
  };
}

export interface GetInsightsFilters {
  category?: 'tasks' | 'journal' | 'habits' | 'goals';
  type?: 'productivity' | 'behavior' | 'recommendation' | 'warning';
  limit?: number;
  offset?: number;
}

/**
 * AI Service
 * Handles AI insights and summaries using shared database pool
 */
export class AIService {
  constructor() {
    // No initialization needed - uses shared pool
  }

  /**
   * Get AI insights from database with optional filters
   */
  async getInsights(userId: string, filters?: GetInsightsFilters): Promise<AIInsight[]> {
    logger.info('Getting AI insights', { userId, filters });

    try {
      let query = `
        SELECT
          id,
          provider,
          type,
          title,
          description,
          confidence,
          category,
          actionable,
          metadata,
          created_at as "createdAt"
        FROM ai_insights
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      // Note: ai_insights table doesn't have user_id in the schema
      // This is a limitation of the current schema design
      // In production, you'd want to add user_id to ai_insights table

      if (filters?.category) {
        query += ` AND category = $${paramIndex++}`;
        params.push(filters.category);
      }

      if (filters?.type) {
        query += ` AND type = $${paramIndex++}`;
        params.push(filters.type);
      }

      query += ` ORDER BY created_at DESC`;

      if (filters?.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }

      const result = await db.query(query, params);

      logger.info('AI insights retrieved successfully', {
        userId,
        count: result.rows.length,
      });

      return result.rows as AIInsight[];
    } catch (error) {
      logger.error('Failed to get AI insights', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        filters,
      });
      throw new DatabaseError('Failed to retrieve AI insights');
    }
  }

  /**
   * Generate new AI insights based on user data
   * This creates simple rule-based insights. In production, this would call actual AI APIs
   */
  async generateInsights(userId: string, params: GenerateInsightsParams): Promise<AIInsight[]> {
    logger.info('Generating AI insights', { userId, params });

    try {
      const insights: AIInsight[] = [];

      // Get user's tasks for analysis
      if (params.dataTypes.includes('tasks')) {
        const tasksQuery = `
          SELECT
            id,
            title,
            completed,
            priority,
            due_date as "dueDate",
            created_at as "createdAt",
            completed_at as "completedAt"
          FROM tasks
          WHERE user_id = $1
        `;

        const tasksResult = await db.query(tasksQuery, [userId]);
        const tasks = tasksResult.rows;

        // Analyze task patterns and generate insights
        const overdueTasks = tasks.filter(
          (t: any) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
        );

        const highPriorityIncomplete = tasks.filter(
          (t: any) => !t.completed && t.priority === 'high'
        );

        // Generate insights based on patterns
        if (overdueTasks.length > 0) {
          const insight = await this.createInsight(userId, {
            provider: 'local',
            type: 'warning',
            title: `${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''}`,
            description: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} that need attention. Consider reviewing and updating deadlines or completing them.`,
            confidence: 0.9,
            category: 'tasks',
            actionable: true,
            metadata: {
              overdueCount: overdueTasks.length,
              taskIds: overdueTasks.map((t: any) => t.id),
            },
          });
          insights.push(insight);
        }

        if (highPriorityIncomplete.length > 3) {
          const insight = await this.createInsight(userId, {
            provider: 'local',
            type: 'recommendation',
            title: 'Many High-Priority Tasks Pending',
            description: `You have ${highPriorityIncomplete.length} high-priority tasks pending. Consider focusing on completing these before taking on new work.`,
            confidence: 0.85,
            category: 'tasks',
            actionable: true,
            metadata: {
              highPriorityCount: highPriorityIncomplete.length,
            },
          });
          insights.push(insight);
        }

        // Check completion rate
        const completedCount = tasks.filter((t: any) => t.completed).length;
        const totalCount = tasks.length;
        if (totalCount > 0) {
          const completionRate = (completedCount / totalCount) * 100;

          if (completionRate > 70) {
            const insight = await this.createInsight(userId, {
              provider: 'local',
              type: 'productivity',
              title: 'Great Task Completion Rate!',
              description: `You've completed ${completionRate.toFixed(1)}% of your tasks. Keep up the excellent work!`,
              confidence: 1.0,
              category: 'tasks',
              actionable: false,
              metadata: {
                completionRate,
                completedCount,
                totalCount,
              },
            });
            insights.push(insight);
          } else if (completionRate < 30) {
            const insight = await this.createInsight(userId, {
              provider: 'local',
              type: 'behavior',
              title: 'Low Task Completion Rate',
              description: `Your current completion rate is ${completionRate.toFixed(1)}%. Consider breaking down tasks into smaller, more manageable pieces.`,
              confidence: 0.8,
              category: 'tasks',
              actionable: true,
              metadata: {
                completionRate,
                completedCount,
                totalCount,
              },
            });
            insights.push(insight);
          }
        }
      }

      // Get user's journal entries for analysis
      if (params.dataTypes.includes('journal')) {
        const journalQuery = `
          SELECT
            id,
            content,
            mood,
            date,
            created_at as "createdAt"
          FROM journal_entries
          WHERE user_id = $1
          ORDER BY date DESC
          LIMIT 30
        `;

        const journalResult = await db.query(journalQuery, [userId]);
        const entries = journalResult.rows;

        if (entries.length > 0) {
          // Analyze journaling consistency
          const daysSinceLastEntry = Math.floor(
            (Date.now() - new Date(entries[0].date).getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceLastEntry > 7) {
            const insight = await this.createInsight(userId, {
              provider: 'local',
              type: 'recommendation',
              title: 'Journal Entry Gap Detected',
              description: `It's been ${daysSinceLastEntry} days since your last journal entry. Regular journaling can help track your progress and reflect on your experiences.`,
              confidence: 0.75,
              category: 'journal',
              actionable: true,
              metadata: {
                daysSinceLastEntry,
                lastEntryDate: entries[0].date,
              },
            });
            insights.push(insight);
          } else if (entries.length >= 7) {
            const insight = await this.createInsight(userId, {
              provider: 'local',
              type: 'productivity',
              title: 'Consistent Journaling Habit',
              description: `You've maintained regular journal entries. This consistency helps with self-reflection and tracking your journey!`,
              confidence: 0.9,
              category: 'journal',
              actionable: false,
              metadata: {
                recentEntryCount: entries.length,
              },
            });
            insights.push(insight);
          }

          // Analyze mood patterns if available
          const moodEntries = entries.filter((e: any) => e.mood);
          if (moodEntries.length > 5) {
            const stressedCount = moodEntries.filter((e: any) => e.mood === 'stressed').length;
            const happyCount = moodEntries.filter((e: any) => e.mood === 'happy').length;

            if (stressedCount > moodEntries.length / 2) {
              const insight = await this.createInsight(userId, {
                provider: 'local',
                type: 'warning',
                title: 'High Stress Levels Detected',
                description: `Over half of your recent entries indicate stress. Consider taking breaks and practicing self-care.`,
                confidence: 0.8,
                category: 'journal',
                actionable: true,
                metadata: {
                  stressedCount,
                  totalMoodEntries: moodEntries.length,
                },
              });
              insights.push(insight);
            } else if (happyCount > moodEntries.length / 2) {
              const insight = await this.createInsight(userId, {
                provider: 'local',
                type: 'productivity',
                title: 'Positive Mood Trend',
                description: `Your recent journal entries show predominantly positive moods. Keep doing what you're doing!`,
                confidence: 0.85,
                category: 'journal',
                actionable: false,
                metadata: {
                  happyCount,
                  totalMoodEntries: moodEntries.length,
                },
              });
              insights.push(insight);
            }
          }
        }
      }

      logger.info('AI insights generated successfully', {
        userId,
        insightCount: insights.length,
      });

      return insights;
    } catch (error) {
      logger.error('Failed to generate AI insights', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        params,
      });
      throw new DatabaseError('Failed to generate AI insights');
    }
  }

  /**
   * Generate a summary/recap for a time period
   */
  async generateSummary(userId: string, params: GenerateSummaryParams): Promise<AIRecap> {
    logger.info('Generating AI summary', { userId, params });

    try {
      // Get tasks for the period
      const tasksQuery = `
        SELECT
          id,
          title,
          completed,
          priority,
          created_at as "createdAt",
          completed_at as "completedAt"
        FROM tasks
        WHERE user_id = $1
          AND created_at >= $2
          AND created_at <= $3
        ORDER BY created_at DESC
      `;

      const tasksResult = await db.query(tasksQuery, [
        userId,
        params.period.start,
        params.period.end,
      ]);
      const tasks = tasksResult.rows;

      // Get journal entries for the period
      const journalQuery = `
        SELECT
          id,
          title,
          content,
          mood,
          date,
          created_at as "createdAt"
        FROM journal_entries
        WHERE user_id = $1
          AND date >= $2::date
          AND date <= $3::date
        ORDER BY date DESC
      `;

      const journalResult = await db.query(journalQuery, [
        userId,
        params.period.start,
        params.period.end,
      ]);
      const entries = journalResult.rows;

      // Generate summary content
      const completedTasks = tasks.filter((t: any) => t.completed);
      const highlights: string[] = [];
      const challenges: string[] = [];
      const recommendations: string[] = [];

      // Highlights
      if (completedTasks.length > 0) {
        highlights.push(`Completed ${completedTasks.length} task${completedTasks.length > 1 ? 's' : ''}`);
      }

      if (entries.length > 0) {
        highlights.push(`Wrote ${entries.length} journal entr${entries.length > 1 ? 'ies' : 'y'}`);
      }

      const highPriorityCompleted = completedTasks.filter((t: any) => t.priority === 'high');
      if (highPriorityCompleted.length > 0) {
        highlights.push(`Completed ${highPriorityCompleted.length} high-priority task${highPriorityCompleted.length > 1 ? 's' : ''}`);
      }

      // Challenges
      const incompleteTasks = tasks.filter((t: any) => !t.completed);
      if (incompleteTasks.length > completedTasks.length) {
        challenges.push(`More tasks created than completed (${incompleteTasks.length} pending)`);
      }

      const stressedEntries = entries.filter((e: any) => e.mood === 'stressed');
      if (stressedEntries.length > entries.length / 2 && entries.length > 0) {
        challenges.push('Multiple journal entries indicate high stress levels');
      }

      // Recommendations
      if (incompleteTasks.length > 5) {
        recommendations.push('Consider prioritizing and breaking down large tasks');
      }

      if (entries.length < 3 && params.type === 'weekly') {
        recommendations.push('Try to journal more regularly to track your progress');
      }

      if (completedTasks.length > 0) {
        const avgCompletionTime = completedTasks
          .filter((t: any) => t.completedAt)
          .reduce((sum: number, t: any) => {
            const created = new Date(t.createdAt).getTime();
            const completed = new Date(t.completedAt).getTime();
            return sum + (completed - created);
          }, 0) / completedTasks.length;

        const avgDays = Math.floor(avgCompletionTime / (1000 * 60 * 60 * 24));
        if (avgDays > 7) {
          recommendations.push('Tasks are taking longer to complete - consider setting smaller milestones');
        }
      }

      // Create and save the recap
      const recap = await this.createRecap(userId, {
        provider: 'local',
        type: params.type,
        title: `${params.type === 'weekly' ? 'Weekly' : 'Monthly'} Summary`,
        summary: `During this period, you created ${tasks.length} tasks and wrote ${entries.length} journal entries. ${completedTasks.length > 0 ? `You completed ${completedTasks.length} tasks, showing good progress.` : 'Focus on completing pending tasks.'}`,
        highlights: highlights.length > 0 ? highlights : ['No significant highlights this period'],
        challenges: challenges.length > 0 ? challenges : ['No major challenges identified'],
        recommendations: recommendations.length > 0 ? recommendations : ['Keep up the current pace'],
        period: params.period,
        metadata: {
          totalTasks: tasks.length,
          completedTasks: completedTasks.length,
          totalJournalEntries: entries.length,
          completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
        },
      });

      logger.info('AI summary generated successfully', { userId, recapId: recap.id });

      return recap;
    } catch (error) {
      logger.error('Failed to generate AI summary', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        params,
      });
      throw new DatabaseError('Failed to generate AI summary');
    }
  }

  /**
   * Create and store an insight in the database
   */
  private async createInsight(_userId: string, data: Omit<AIInsight, 'id' | 'createdAt'>): Promise<AIInsight> {
    const result = await db.query(
      `INSERT INTO ai_insights (
        provider, type, title, description, confidence,
        category, actionable, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        provider,
        type,
        title,
        description,
        confidence,
        category,
        actionable,
        metadata,
        created_at as "createdAt"`,
      [
        data.provider,
        data.type,
        data.title,
        data.description,
        data.confidence,
        data.category,
        data.actionable,
        JSON.stringify(data.metadata),
      ]
    );

    return result.rows[0] as AIInsight;
  }

  /**
   * Create and store a recap in the database
   */
  private async createRecap(_userId: string, data: Omit<AIRecap, 'id' | 'createdAt'>): Promise<AIRecap> {
    const result = await db.query(
      `INSERT INTO ai_recaps (
        provider, type, title, summary, highlights,
        challenges, recommendations, period, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        provider,
        type,
        title,
        summary,
        highlights,
        challenges,
        recommendations,
        period,
        metadata,
        created_at as "createdAt"`,
      [
        data.provider,
        data.type,
        data.title,
        data.summary,
        JSON.stringify(data.highlights),
        JSON.stringify(data.challenges),
        JSON.stringify(data.recommendations),
        JSON.stringify(data.period),
        JSON.stringify(data.metadata),
      ]
    );

    return result.rows[0] as AIRecap;
  }
}

// Export singleton instance
export const aiService = new AIService();
