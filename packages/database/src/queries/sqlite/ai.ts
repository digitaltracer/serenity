import type Database from 'better-sqlite3';
import { logger } from '@serenity/core';

export interface AIInsightRow {
  id: string;
  provider: 'openai' | 'gemini' | 'anthropic' | 'local';
  type: 'productivity' | 'behavior' | 'recommendation' | 'warning';
  title: string;
  description: string;
  confidence: number;
  category: 'tasks' | 'journal' | 'habits' | 'goals';
  actionable: number;
  metadata: string; // JSON
  created_at: string;
  updated_at: string;
  // User feedback fields
  user_rating?: number | null;
  dismissed: number;
  marked_helpful: number;
  user_notes?: string | null;
  // Visualization and actionability fields
  visualization_data?: string | null; // JSON
  actionability_suggestions: string; // JSON array
}

export interface AIRecapRow {
  id: string;
  provider: 'openai' | 'gemini' | 'anthropic' | 'local';
  type: 'weekly' | 'monthly';
  title: string;
  summary: string;
  highlights: string; // JSON
  challenges: string; // JSON
  recommendations: string; // JSON
  period: string; // JSON { start, end }
  metadata: string; // JSON
  created_at: string;
  updated_at: string;
  // User interaction fields
  viewed: number;
  favorited: number;
  exported: number;
}

export class SQLiteAIQueries {
  constructor(private db: Database.Database) {}

  async addInsights(insights: Omit<AIInsightRow, 'id' | 'created_at'>[]): Promise<void> {
    const sql = `INSERT INTO ai_insights (provider, type, title, description, confidence, category, actionable, metadata)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const stmt = this.db.prepare(sql);
    const insertMany = this.db.transaction((rows: Omit<AIInsightRow, 'id' | 'created_at'>[]) => {
      for (const i of rows) {
        stmt.run(
          i.provider,
          i.type,
          i.title,
          i.description,
          i.confidence,
          i.category,
          i.actionable ? 1 : 0,
          typeof i.metadata === 'string' ? i.metadata : JSON.stringify(i.metadata || {})
        );
      }
    });
    insertMany(insights);
  }

  async listInsights(limit = 200): Promise<AIInsightRow[]> {
    const sql = `SELECT * FROM ai_insights ORDER BY created_at DESC LIMIT ?`;
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(limit) as AIInsightRow[];
    return rows;
  }

  async getRecentInsights(limit = 20): Promise<AIInsightRow[]> {
    const sql = `SELECT * FROM ai_insights ORDER BY created_at DESC LIMIT ?`;
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(limit) as AIInsightRow[];
    return rows;
  }

  async addRecap(recap: Omit<AIRecapRow, 'id' | 'created_at'>): Promise<void> {
    const sql = `INSERT INTO ai_recaps (provider, type, title, summary, highlights, challenges, recommendations, period, metadata)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const stmt = this.db.prepare(sql);
    stmt.run(
      recap.provider,
      recap.type,
      recap.title,
      recap.summary,
      typeof recap.highlights === 'string' ? recap.highlights : JSON.stringify(recap.highlights || []),
      typeof recap.challenges === 'string' ? recap.challenges : JSON.stringify(recap.challenges || []),
      typeof recap.recommendations === 'string' ? recap.recommendations : JSON.stringify(recap.recommendations || []),
      typeof recap.period === 'string' ? recap.period : JSON.stringify(recap.period),
      typeof recap.metadata === 'string' ? recap.metadata : JSON.stringify(recap.metadata || {})
    );
  }

  async listRecaps(limit = 50): Promise<AIRecapRow[]> {
    const sql = `SELECT * FROM ai_recaps ORDER BY created_at DESC LIMIT ?`;
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(limit) as AIRecapRow[];
    return rows;
  }

  // ===== Usage =====
  async addUsage(entries: Array<{ timestamp?: string; provider: 'openai' | 'gemini' | 'anthropic'; operation: 'analyze' | 'recap' | 'quickadd'; promptTokens: number; completionTokens: number; totalTokens: number }>): Promise<void> {
    if (!entries || entries.length === 0) return;

    // Deduplication: check for recent duplicate entries (within 5 seconds)
    const checkDuplicateStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM ai_usage
      WHERE provider = ? AND operation = ?
      AND total_tokens = ?
      AND datetime(timestamp) > datetime('now', '-5 seconds')
    `);

    const sql = `INSERT INTO ai_usage (id, timestamp, provider, operation, prompt_tokens, completion_tokens, total_tokens) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const stmt = this.db.prepare(sql);
    const insertMany = this.db.transaction((rows: typeof entries) => {
      for (const r of rows) {
        // Check for duplicates
        const duplicateCheck = checkDuplicateStmt.get(r.provider, r.operation, Math.floor(r.totalTokens||0)) as { count: number };
        if (duplicateCheck.count > 0) {
          logger.info(`🚫 Skipping duplicate AI usage entry: ${r.provider}/${r.operation}/${r.totalTokens} tokens`, { component: 'ai', operation: 'skippingDuplicateUsage' });
          continue;
        }

        const id = `usage_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const ts = r.timestamp || new Date().toISOString();
        stmt.run(id, ts, r.provider, r.operation, Math.floor(r.promptTokens||0), Math.floor(r.completionTokens||0), Math.floor(r.totalTokens||0));
        logger.info(`✅ Saved AI usage entry: ${r.provider}/${r.operation}/${r.totalTokens} tokens`, { component: 'ai', operation: 'savedUsageEntry:' });
      }
    });
    insertMany(entries);
  }

  async listUsage(limit = 500): Promise<Array<{ id: string; timestamp: string; provider: string; operation: string; prompt_tokens: number; completion_tokens: number; total_tokens: number }>> {
    const sql = `SELECT * FROM ai_usage ORDER BY timestamp DESC LIMIT ?`;
    const stmt = this.db.prepare(sql);
    return stmt.all(limit) as any;
  }

  // ===== Insight Feedback Methods =====

  /**
   * Update insight feedback (rating, dismissed, helpful, notes)
   */
  async updateInsightFeedback(insightId: string, feedback: {
    userRating?: number;
    dismissed?: boolean;
    markedHelpful?: boolean;
    userNotes?: string;
  }): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (feedback.userRating !== undefined) {
      updates.push('user_rating = ?');
      params.push(feedback.userRating);
    }
    if (feedback.dismissed !== undefined) {
      updates.push('dismissed = ?');
      params.push(feedback.dismissed ? 1 : 0);
    }
    if (feedback.markedHelpful !== undefined) {
      updates.push('marked_helpful = ?');
      params.push(feedback.markedHelpful ? 1 : 0);
    }
    if (feedback.userNotes !== undefined) {
      updates.push('user_notes = ?');
      params.push(feedback.userNotes);
    }

    if (updates.length === 0) return;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(insightId);

    const sql = `UPDATE ai_insights SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    stmt.run(...params);

    logger.info(`✅ Updated feedback for insight ${insightId}`, { component: 'ai', operation: 'updatedInsightFeedback' });
  }

  /**
   * Dismiss an insight
   */
  async dismissInsight(insightId: string): Promise<void> {
    const sql = `UPDATE ai_insights SET dismissed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    stmt.run(insightId);
    logger.info(`✅ Dismissed insight ${insightId}`, { component: 'ai', operation: 'dismissedInsight' });
  }

  /**
   * Get insights with filters
   */
  async getInsightsFiltered(filters: {
    category?: string;
    type?: string;
    dismissed?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<AIInsightRow[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.category) {
      conditions.push('category = ?');
      params.push(filters.category);
    }
    if (filters.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }
    if (filters.dismissed !== undefined) {
      conditions.push('dismissed = ?');
      params.push(filters.dismissed ? 1 : 0);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const sql = `SELECT * FROM ai_insights ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as AIInsightRow[];
  }

  /**
   * Delete old dismissed insights (cleanup)
   */
  async deleteOldDismissedInsights(daysOld: number = 90): Promise<number> {
    const sql = `DELETE FROM ai_insights WHERE dismissed = 1 AND datetime(created_at) < datetime('now', '-' || ? || ' days')`;
    const stmt = this.db.prepare(sql);
    const result = stmt.run(daysOld);
    logger.info(`✅ Deleted ${result.changes} old dismissed insights`, { component: 'ai', operation: 'deletedOldInsights' });
    return result.changes;
  }

  // ===== Recap Interaction Methods =====

  /**
   * Update recap interaction (viewed, favorited, exported)
   */
  async updateRecapInteraction(recapId: string, interaction: {
    viewed?: boolean;
    favorited?: boolean;
    exported?: boolean;
  }): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (interaction.viewed !== undefined) {
      updates.push('viewed = ?');
      params.push(interaction.viewed ? 1 : 0);
    }
    if (interaction.favorited !== undefined) {
      updates.push('favorited = ?');
      params.push(interaction.favorited ? 1 : 0);
    }
    if (interaction.exported !== undefined) {
      updates.push('exported = ?');
      params.push(interaction.exported ? 1 : 0);
    }

    if (updates.length === 0) return;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(recapId);

    const sql = `UPDATE ai_recaps SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    stmt.run(...params);

    logger.info(`✅ Updated interaction for recap ${recapId}`, { component: 'ai', operation: 'updatedRecapInteraction' });
  }

  /**
   * Get recaps with filters
   */
  async getRecapsFiltered(filters: {
    type?: 'weekly' | 'monthly';
    favorited?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<AIRecapRow[]> {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }
    if (filters.favorited !== undefined) {
      conditions.push('favorited = ?');
      params.push(filters.favorited ? 1 : 0);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    const sql = `SELECT * FROM ai_recaps ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as AIRecapRow[];
  }
}
