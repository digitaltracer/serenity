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
          i.metadata || '{}'
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
      recap.highlights || '[]',
      recap.challenges || '[]',
      recap.recommendations || '[]',
      recap.period,
      recap.metadata || '{}'
    );
  }

  async listRecaps(limit = 50): Promise<AIRecapRow[]> {
    const sql = `SELECT * FROM ai_recaps ORDER BY created_at DESC LIMIT ?`;
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(limit) as AIRecapRow[];
    return rows;
  }
}
