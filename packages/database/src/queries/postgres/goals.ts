import { PostgresAdapter } from '../../adapters/PostgresAdapter';

export class PostgresGoalQueries {
  private adapter: PostgresAdapter;
  constructor(adapter: PostgresAdapter) { this.adapter = adapter; }

  async list(userId: string): Promise<any[]> {
    const res = await this.adapter.query('SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.rows;
  }

  async create(userId: string, input: any): Promise<any> {
    const res = await this.adapter.query(
      `INSERT INTO goals (user_id, title, description, type, config, progress, status, priority, reminders)
       VALUES ($1, $2, $3, $4, COALESCE($5,'{}'), COALESCE($6,'{}'), COALESCE($7,'active'), COALESCE($8,'medium'), COALESCE($9,'[]')) RETURNING *`,
      [userId, input.title, input.description || null, input.type, input.config || {}, input.progress || {}, input.status, input.priority, input.reminders || []]
    );
    return res.rows[0];
  }

  async update(id: string, updates: any): Promise<any> {
    const fields: string[] = []; const values: any[] = []; let i = 1;
    for (const [k, v] of Object.entries(updates)) { fields.push(`${to_snake(k)} = $${++i}`); values.push(v); }
    const sql = `UPDATE goals SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const res = await this.adapter.query(sql, [id, ...values]);
    return res.rows[0];
  }

  async remove(id: string): Promise<void> { await this.adapter.query('DELETE FROM goals WHERE id = $1', [id]); }
}

function to_snake(camel: string): string { return camel.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`); }




