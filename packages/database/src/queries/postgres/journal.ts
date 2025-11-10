import { PostgresAdapter } from '../../adapters/PostgresAdapter';

export class PostgresJournalQueries {
  private adapter: PostgresAdapter;
  constructor(adapter: PostgresAdapter) { this.adapter = adapter; }

  async list(userId: string): Promise<any[]> {
    const res = await this.adapter.query('SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY date DESC', [userId]);
    return res.rows;
  }

  async create(userId: string, input: any): Promise<any> {
    const res = await this.adapter.query(
      `INSERT INTO journal_entries (user_id, title, content, date, tags, pinned, mood)
       VALUES ($1, $2, $3, $4, COALESCE($5,'{}'), COALESCE($6,false), $7) RETURNING *`,
      [userId, input.title || null, input.content, input.date, input.tags || [], input.pinned, input.mood || null]
    );
    return res.rows[0];
  }

  async update(id: string, updates: any): Promise<any> {
    const fields: string[] = []; const values: any[] = []; let i = 1;
    for (const [k, v] of Object.entries(updates)) { fields.push(`${to_snake(k)} = $${++i}`); values.push(v); }
    const sql = `UPDATE journal_entries SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const res = await this.adapter.query(sql, [id, ...values]);
    return res.rows[0];
  }

  async remove(id: string): Promise<void> { await this.adapter.query('DELETE FROM journal_entries WHERE id = $1', [id]); }
}

function to_snake(camel: string): string { return camel.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`); }




