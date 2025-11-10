import { PostgresAdapter } from '../../adapters/PostgresAdapter';

export class PostgresProjectQueries {
  private adapter: PostgresAdapter;
  constructor(adapter: PostgresAdapter) { this.adapter = adapter; }

  async list(userId: string): Promise<any[]> {
    const res = await this.adapter.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.rows;
  }

  async create(userId: string, input: any): Promise<any> {
    const res = await this.adapter.query(
      `INSERT INTO projects (user_id, name, description, color, icon, archived)
       VALUES ($1, $2, $3, COALESCE($4,'#3B82F6'), $5, COALESCE($6,false)) RETURNING *`,
      [userId, input.name, input.description || null, input.color, input.icon || null, input.archived]
    );
    return res.rows[0];
  }

  async update(id: string, updates: any): Promise<any> {
    const fields: string[] = []; const values: any[] = []; let i = 1;
    for (const [k, v] of Object.entries(updates)) { fields.push(`${to_snake(k)} = $${++i}`); values.push(v); }
    const sql = `UPDATE projects SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const res = await this.adapter.query(sql, [id, ...values]);
    return res.rows[0];
  }

  async remove(id: string): Promise<void> { await this.adapter.query('DELETE FROM projects WHERE id = $1', [id]); }
}

function to_snake(camel: string): string { return camel.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`); }




