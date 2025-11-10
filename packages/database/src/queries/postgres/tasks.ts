import { PostgresAdapter } from '../../adapters/PostgresAdapter';
import type { QueryResult } from 'pg';

export class PostgresTaskQueries {
  private adapter: PostgresAdapter;

  constructor(adapter: PostgresAdapter) {
    this.adapter = adapter;
  }

  async list(userId: string): Promise<any[]> {
    const result: QueryResult = await this.adapter.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  async create(userId: string, input: any): Promise<any> {
    const result = await this.adapter.query(
      `INSERT INTO tasks (user_id, project_id, title, description, completed, priority, due_date, tags, order_index)
       VALUES ($1, $2, $3, $4, COALESCE($5,false), COALESCE($6,'medium'), $7, COALESCE($8,'{}'), COALESCE($9,0))
       RETURNING *`,
      [userId, input.projectId || null, input.title, input.description || null, input.completed, input.priority, input.dueDate || null, input.tags || [], input.orderIndex || 0]
    );
    return result.rows[0];
  }

  async update(id: string, updates: any): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(updates)) {
      fields.push(`${to_snake(k)} = $${++idx}`);
      values.push(v);
    }
    const sql = `UPDATE tasks SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const result = await this.adapter.query(sql, [id, ...values]);
    return result.rows[0];
  }

  async remove(id: string): Promise<void> {
    await this.adapter.query('DELETE FROM tasks WHERE id = $1', [id]);
  }
}

function to_snake(camel: string): string {
  return camel.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}




