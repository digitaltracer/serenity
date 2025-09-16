import type Database from 'better-sqlite3';

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
    const sql = `INSERT INTO ai_usage (id, timestamp, provider, operation, prompt_tokens, completion_tokens, total_tokens) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const stmt = this.db.prepare(sql);
    const insertMany = this.db.transaction((rows: typeof entries) => {
      for (const r of rows) {
        const id = `usage_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const ts = r.timestamp || new Date().toISOString();
        stmt.run(id, ts, r.provider, r.operation, Math.floor(r.promptTokens||0), Math.floor(r.completionTokens||0), Math.floor(r.totalTokens||0));
      }
    });
    insertMany(entries);
  }

  async listUsage(limit = 500): Promise<Array<{ id: string; timestamp: string; provider: string; operation: string; prompt_tokens: number; completion_tokens: number; total_tokens: number }>> {
    const sql = `SELECT * FROM ai_usage ORDER BY timestamp DESC LIMIT ?`;
    const stmt = this.db.prepare(sql);
    return stmt.all(limit) as any;
  }
}
