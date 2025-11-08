import type Database from 'better-sqlite3';
import { logger } from '@serenity/core';

export interface AnalysisSummaryRow {
  id: string;
  created_at: string;
  summary_text: string;
  key_themes: string; // JSON array
  tracked_patterns: string; // JSON array
  user_focus_areas: string; // JSON array
  tasks_analyzed: number;
  journals_analyzed: number;
  insights_generated: number;
}

export interface InsightThemeRow {
  id: string;
  theme_name: string;
  category: string;
  first_seen: string;
  last_seen: string;
  occurrence_count: number;
  severity_trend: string | null; // 'improving', 'stable', 'worsening'
  insight_ids: string; // JSON array
}

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

export interface AIProviderCredentialRow {
  id: string;
  provider: 'openai' | 'gemini' | 'anthropic';
  name: string;
  api_key_encrypted: string;
  model_preference: string | null;
  enabled: number;
  priority: number;
  metadata: string; // JSON
  last_used_at: string | null;
  total_requests: number;
  total_tokens: number;
  success_count: number;
  error_count: number;
  last_error: string | null;
  last_error_at: string | null;
  created_at: string;
  updated_at: string;
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
  async addUsage(entries: Array<{ timestamp?: string; provider: 'openai' | 'gemini' | 'anthropic'; operation: 'analyze' | 'recap' | 'quickadd' | 'summary'; promptTokens: number; completionTokens: number; totalTokens: number }>): Promise<void> {
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

  // ===== Analysis Summaries Methods =====

  /**
   * Add an analysis summary
   */
  async addAnalysisSummary(summary: Omit<AnalysisSummaryRow, 'id' | 'created_at'>): Promise<string> {
    const id = `summary_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const sql = `
      INSERT INTO analysis_summaries (
        id, summary_text, key_themes, tracked_patterns,
        user_focus_areas, tasks_analyzed, journals_analyzed, insights_generated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const stmt = this.db.prepare(sql);
    stmt.run(
      id,
      summary.summary_text,
      typeof summary.key_themes === 'string' ? summary.key_themes : JSON.stringify(summary.key_themes || []),
      typeof summary.tracked_patterns === 'string' ? summary.tracked_patterns : JSON.stringify(summary.tracked_patterns || []),
      typeof summary.user_focus_areas === 'string' ? summary.user_focus_areas : JSON.stringify(summary.user_focus_areas || []),
      summary.tasks_analyzed || 0,
      summary.journals_analyzed || 0,
      summary.insights_generated || 0
    );

    logger.info(`✅ Created analysis summary ${id}`, {
      component: 'ai',
      operation: 'createdAnalysisSummary',
      metadata: {
        tasksAnalyzed: summary.tasks_analyzed,
        journalsAnalyzed: summary.journals_analyzed,
        insightsGenerated: summary.insights_generated
      }
    });

    return id;
  }

  /**
   * Get recent analysis summaries
   */
  async getRecentAnalysisSummaries(limit: number = 3): Promise<AnalysisSummaryRow[]> {
    const sql = `
      SELECT * FROM analysis_summaries
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const stmt = this.db.prepare(sql);
    return stmt.all(limit) as AnalysisSummaryRow[];
  }

  /**
   * Get all analysis summaries
   */
  async getAllAnalysisSummaries(limit: number = 50): Promise<AnalysisSummaryRow[]> {
    const sql = `
      SELECT * FROM analysis_summaries
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const stmt = this.db.prepare(sql);
    return stmt.all(limit) as AnalysisSummaryRow[];
  }

  /**
   * Get analysis summary by ID
   */
  async getAnalysisSummaryById(id: string): Promise<AnalysisSummaryRow | null> {
    const sql = `SELECT * FROM analysis_summaries WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    return (stmt.get(id) as AnalysisSummaryRow) || null;
  }

  /**
   * Delete old analysis summaries (keep only the most recent N)
   */
  async deleteOldAnalysisSummaries(keepCount: number = 10): Promise<number> {
    const sql = `
      DELETE FROM analysis_summaries
      WHERE id NOT IN (
        SELECT id FROM analysis_summaries
        ORDER BY created_at DESC
        LIMIT ?
      )
    `;

    const stmt = this.db.prepare(sql);
    const result = stmt.run(keepCount);

    if (result.changes > 0) {
      logger.info(`✅ Deleted ${result.changes} old analysis summaries`, {
        component: 'ai',
        operation: 'deletedOldSummaries',
        metadata: { deletedCount: result.changes, keptCount: keepCount }
      });
    }

    return result.changes;
  }

  /**
   * Get analysis summaries within a date range
   */
  async getAnalysisSummariesByDateRange(startDate: string, endDate: string): Promise<AnalysisSummaryRow[]> {
    const sql = `
      SELECT * FROM analysis_summaries
      WHERE datetime(created_at) BETWEEN datetime(?) AND datetime(?)
      ORDER BY created_at DESC
    `;

    const stmt = this.db.prepare(sql);
    return stmt.all(startDate, endDate) as AnalysisSummaryRow[];
  }

  // ===== Insight Themes Methods =====

  /**
   * Get or create a theme
   * Returns existing theme or creates a new one
   */
  async getOrCreateTheme(themeName: string, category: string): Promise<InsightThemeRow> {
    // Try to get existing theme
    const existingTheme = this.db.prepare('SELECT * FROM insight_themes WHERE theme_name = ?').get(themeName) as InsightThemeRow | undefined;

    if (existingTheme) {
      return existingTheme;
    }

    // Create new theme
    const id = `theme_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const sql = `
      INSERT INTO insight_themes (id, theme_name, category)
      VALUES (?, ?, ?)
    `;

    this.db.prepare(sql).run(id, themeName, category);

    logger.info(`✅ Created new theme: ${themeName}`, {
      component: 'ai',
      operation: 'createdTheme',
      metadata: { themeId: id, themeName, category }
    });

    return this.db.prepare('SELECT * FROM insight_themes WHERE id = ?').get(id) as InsightThemeRow;
  }

  /**
   * Track a theme occurrence (update counts and last_seen)
   */
  async trackThemeOccurrence(themeId: string, insightId: string, confidence: number): Promise<void> {
    // Get current theme
    const theme = this.db.prepare('SELECT * FROM insight_themes WHERE id = ?').get(themeId) as InsightThemeRow;
    if (!theme) {
      logger.warn(`⚠️ Theme ${themeId} not found`, { component: 'ai', operation: 'themeNotFound' });
      return;
    }

    // Parse insight IDs
    const insightIds = JSON.parse(theme.insight_ids || '[]');
    insightIds.push(insightId);

    // Calculate severity trend based on recent confidences
    const severityTrend = await this.calculateSeverityTrend(themeId, confidence);

    // Update theme
    const sql = `
      UPDATE insight_themes
      SET occurrence_count = occurrence_count + 1,
          last_seen = CURRENT_TIMESTAMP,
          insight_ids = ?,
          severity_trend = ?
      WHERE id = ?
    `;

    this.db.prepare(sql).run(JSON.stringify(insightIds), severityTrend, themeId);

    logger.info(`✅ Tracked theme occurrence: ${theme.theme_name} (occurrence #${theme.occurrence_count + 1})`, {
      component: 'ai',
      operation: 'trackedTheme',
      metadata: {
        themeId,
        occurrenceCount: theme.occurrence_count + 1,
        severityTrend
      }
    });
  }

  /**
   * Calculate severity trend for a theme
   */
  private async calculateSeverityTrend(themeId: string, currentConfidence: number): Promise<string> {
    // Get recent insights for this theme (last 5)
    const theme = this.db.prepare('SELECT * FROM insight_themes WHERE id = ?').get(themeId) as InsightThemeRow;
    if (!theme) return 'stable';

    const insightIds = JSON.parse(theme.insight_ids || '[]');
    if (insightIds.length === 0) return 'stable';

    // Get last 3 insights with confidence scores
    const recentInsightIds = insightIds.slice(-3);
    const placeholders = recentInsightIds.map(() => '?').join(',');
    const sql = `SELECT confidence FROM ai_insights WHERE id IN (${placeholders}) ORDER BY created_at ASC`;

    const recentInsights = this.db.prepare(sql).all(...recentInsightIds) as Array<{ confidence: number }>;

    if (recentInsights.length < 2) return 'stable';

    // Calculate trend: compare average of older insights vs newer insights
    const olderConfidence = recentInsights[0].confidence;
    const newerConfidence = currentConfidence;

    const change = newerConfidence - olderConfidence;

    if (change > 0.1) return 'worsening'; // Higher confidence in problem = worsening
    if (change < -0.1) return 'improving'; // Lower confidence = improving
    return 'stable';
  }

  /**
   * Get all themes
   */
  async getAllThemes(limit: number = 100): Promise<InsightThemeRow[]> {
    const sql = `SELECT * FROM insight_themes ORDER BY last_seen DESC LIMIT ?`;
    return this.db.prepare(sql).all(limit) as InsightThemeRow[];
  }

  /**
   * Get themes by category
   */
  async getThemesByCategory(category: string): Promise<InsightThemeRow[]> {
    const sql = `SELECT * FROM insight_themes WHERE category = ? ORDER BY last_seen DESC`;
    return this.db.prepare(sql).all(category) as InsightThemeRow[];
  }

  /**
   * Get recurring themes (occurred 2+ times)
   */
  async getRecurringThemes(): Promise<InsightThemeRow[]> {
    const sql = `SELECT * FROM insight_themes WHERE occurrence_count >= 2 ORDER BY occurrence_count DESC, last_seen DESC`;
    return this.db.prepare(sql).all() as InsightThemeRow[];
  }

  /**
   * Update insight with theme information
   */
  async updateInsightTheme(insightId: string, themeId: string, isRecurring: boolean, occurrenceNumber: number): Promise<void> {
    const sql = `
      UPDATE ai_insights
      SET theme_id = ?,
          is_recurring = ?,
          occurrence_number = ?
      WHERE id = ?
    `;

    this.db.prepare(sql).run(themeId, isRecurring ? 1 : 0, occurrenceNumber, insightId);
  }

  // ===== Summary Methods =====

  /**
   * Create a new summary
   */
  async createSummary(summary: {
    id: string;
    title: string;
    content: string;
    summaryType: 'tasks' | 'journal' | 'combined';
    startDate: string;
    endDate: string;
    wordCount: number;
    metadata: string;
    provider: 'openai' | 'gemini' | 'anthropic' | 'local';
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }): Promise<void> {
    const sql = `
      INSERT INTO summaries (
        id, title, content, summary_type, start_date, end_date,
        word_count, metadata, provider, prompt_tokens, completion_tokens, total_tokens
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.db.prepare(sql).run(
      summary.id,
      summary.title,
      summary.content,
      summary.summaryType,
      summary.startDate,
      summary.endDate,
      summary.wordCount,
      summary.metadata,
      summary.provider,
      summary.promptTokens,
      summary.completionTokens,
      summary.totalTokens
    );

    logger.info(`✅ Created summary: ${summary.title}`, {
      component: 'ai',
      operation: 'createdSummary',
      metadata: { summaryId: summary.id, type: summary.summaryType }
    });
  }

  /**
   * Get all summaries
   */
  async getAllSummaries(): Promise<any[]> {
    const sql = `SELECT * FROM summaries ORDER BY generated_at DESC`;
    return this.db.prepare(sql).all();
  }

  /**
   * Get summary by ID
   */
  async getSummaryById(id: string): Promise<any | null> {
    const sql = `SELECT * FROM summaries WHERE id = ?`;
    return this.db.prepare(sql).get(id) || null;
  }

  /**
   * Delete a summary
   */
  async deleteSummary(id: string): Promise<boolean> {
    const sql = `DELETE FROM summaries WHERE id = ?`;
    const result = this.db.prepare(sql).run(id);
    return result.changes > 0;
  }

  /**
   * Get summaries by type
   */
  async getSummariesByType(type: 'tasks' | 'journal' | 'combined'): Promise<any[]> {
    const sql = `SELECT * FROM summaries WHERE summary_type = ? ORDER BY generated_at DESC`;
    return this.db.prepare(sql).all(type);
  }

  /**
   * Get summaries by date range
   */
  async getSummariesByDateRange(startDate: string, endDate: string): Promise<any[]> {
    const sql = `
      SELECT * FROM summaries
      WHERE start_date >= ? AND end_date <= ?
      ORDER BY generated_at DESC
    `;
    return this.db.prepare(sql).all(startDate, endDate);
  }

  // ===== AI Provider Credentials Methods =====

  /**
   * List all AI provider credentials, sorted by priority
   */
  async listCredentials(enabledOnly: boolean = false): Promise<AIProviderCredentialRow[]> {
    const sql = enabledOnly
      ? `SELECT * FROM ai_provider_credentials WHERE enabled = 1 ORDER BY priority ASC`
      : `SELECT * FROM ai_provider_credentials ORDER BY priority ASC`;
    return this.db.prepare(sql).all() as AIProviderCredentialRow[];
  }

  /**
   * Get credentials by provider, sorted by priority
   */
  async getCredentialsByProvider(
    provider: string,
    enabledOnly: boolean = true
  ): Promise<AIProviderCredentialRow[]> {
    const sql = enabledOnly
      ? `SELECT * FROM ai_provider_credentials WHERE provider = ? AND enabled = 1 ORDER BY priority ASC`
      : `SELECT * FROM ai_provider_credentials WHERE provider = ? ORDER BY priority ASC`;
    return this.db.prepare(sql).all(provider) as AIProviderCredentialRow[];
  }

  /**
   * Get a single credential by ID
   */
  async getCredentialById(id: string): Promise<AIProviderCredentialRow | null> {
    const sql = `SELECT * FROM ai_provider_credentials WHERE id = ?`;
    return (this.db.prepare(sql).get(id) as AIProviderCredentialRow) || null;
  }

  /**
   * Create a new credential
   */
  async createCredential(data: {
    id: string;
    provider: string;
    name: string;
    apiKeyEncrypted: string;
    modelPreference?: string | null;
    priority?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO ai_provider_credentials (
        id, provider, name, api_key_encrypted, model_preference,
        enabled, priority, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `;
    this.db.prepare(sql).run(
      data.id,
      data.provider,
      data.name,
      data.apiKeyEncrypted,
      data.modelPreference || null,
      data.priority || 0,
      JSON.stringify(data.metadata || {}),
      now,
      now
    );
    logger.info(`✅ Created AI credential: ${data.provider}/${data.name}`, {
      component: 'SQLiteAIQueries',
      operation: 'createCredential'
    });
  }

  /**
   * Update a credential
   */
  async updateCredential(
    id: string,
    updates: {
      name?: string;
      modelPreference?: string | null;
      enabled?: boolean;
      priority?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.modelPreference !== undefined) {
      fields.push('model_preference = ?');
      values.push(updates.modelPreference);
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(updates.enabled ? 1 : 0);
    }
    if (updates.priority !== undefined) {
      fields.push('priority = ?');
      values.push(updates.priority);
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?');
      values.push(JSON.stringify(updates.metadata));
    }

    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const sql = `UPDATE ai_provider_credentials SET ${fields.join(', ')} WHERE id = ?`;
    const result = this.db.prepare(sql).run(...values);

    if (result.changes > 0) {
      logger.info(`✅ Updated AI credential: ${id}`, {
        component: 'SQLiteAIQueries',
        operation: 'updateCredential'
      });
    }
  }

  /**
   * Delete a credential
   */
  async deleteCredential(id: string): Promise<boolean> {
    const sql = `DELETE FROM ai_provider_credentials WHERE id = ?`;
    const result = this.db.prepare(sql).run(id);

    if (result.changes > 0) {
      logger.info(`✅ Deleted AI credential: ${id}`, {
        component: 'SQLiteAIQueries',
        operation: 'deleteCredential'
      });
      return true;
    }
    return false;
  }

  /**
   * Record successful API call for a credential
   */
  async recordCredentialSuccess(id: string, tokensUsed: number): Promise<void> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE ai_provider_credentials
      SET
        last_used_at = ?,
        total_requests = total_requests + 1,
        total_tokens = total_tokens + ?,
        success_count = success_count + 1,
        updated_at = ?
      WHERE id = ?
    `;
    this.db.prepare(sql).run(now, tokensUsed, now, id);
  }

  /**
   * Record failed API call for a credential
   */
  async recordCredentialError(id: string, error: string): Promise<void> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE ai_provider_credentials
      SET
        total_requests = total_requests + 1,
        error_count = error_count + 1,
        last_error = ?,
        last_error_at = ?,
        updated_at = ?
      WHERE id = ?
    `;
    this.db.prepare(sql).run(error, now, now, id);
  }

  /**
   * Bulk update priorities (for drag-and-drop reordering)
   */
  async updateCredentialPriorities(priorities: Array<{ id: string; priority: number }>): Promise<void> {
    const updateMany = this.db.transaction(() => {
      const sql = `UPDATE ai_provider_credentials SET priority = ?, updated_at = ? WHERE id = ?`;
      const stmt = this.db.prepare(sql);
      const now = new Date().toISOString();

      for (const item of priorities) {
        stmt.run(item.priority, now, item.id);
      }
    });

    updateMany();
    logger.info(`✅ Updated ${priorities.length} credential priorities`, {
      component: 'SQLiteAIQueries',
      operation: 'updateCredentialPriorities'
    });
  }
}
