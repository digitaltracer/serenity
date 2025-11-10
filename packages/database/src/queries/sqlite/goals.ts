/**
 * SQLite Goal Queries for Serenity
 */

import Database from 'better-sqlite3';
import { Goal } from '@serenity/core';
import { v4 as uuidv4 } from 'uuid';

export class SQLiteGoalQueries {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  // Map Goal object -> goals table columns
  private goalToColumns(goal: Goal): {
    id: string;
    title: string;
    description: string | null;
    type: string;
    target_value: number;
    current_value: number;
    unit: string | null;
    target_date: string | null;
    status: string;
    project_id: string | null;
    created_at: string;
    updated_at: string;
  } {
    const target = goal.progress?.target ?? goal.config?.targetCount ?? goal.config?.streakDays ?? goal.config?.targetRate ?? 0;
    const current = goal.progress?.current ?? 0;
    const unit = goal.config?.timeframe ? `${goal.config.timeframe}` : null;
    const targetDate = goal.progress?.periodEnd ? new Date(goal.progress.periodEnd).toISOString() : null;
    const projectId = goal.config?.projectId || null;

    return {
      id: goal.id,
      title: goal.title,
      description: goal.description || null,
      type: goal.type,
      target_value: typeof target === 'number' ? target : 0,
      current_value: typeof current === 'number' ? current : 0,
      unit,
      target_date: targetDate,
      status: goal.status,
      project_id: projectId,
      created_at: (goal.createdAt instanceof Date ? goal.createdAt : new Date(goal.createdAt)).toISOString(),
      updated_at: (goal.updatedAt instanceof Date ? goal.updatedAt : new Date(goal.updatedAt)).toISOString(),
    };
  }

  // Map DB row -> Goal object with sensible defaults
  private rowToGoal(row: any): Goal {
    const config = {
      targetCount: row.target_value ?? undefined,
      projectId: row.project_id ?? undefined,
      timeframe: (row.unit as 'daily' | 'weekly' | 'monthly') || 'weekly',
    } as Goal['config'];

    const progress = {
      current: row.current_value ?? 0,
      target: row.target_value ?? 0,
      percentage: row.target_value ? Math.min(100, Math.round(((row.current_value ?? 0) / row.target_value) * 100)) : 0,
      isCompleted: !!(row.target_value && row.current_value >= row.target_value),
      periodStart: new Date(row.created_at),
      periodEnd: row.target_date ? new Date(row.target_date) : new Date(row.updated_at),
    } as Goal['progress'];

    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      type: row.type,
      config,
      progress,
      status: (row.status as Goal['status']) || 'active',
      priority: 'medium',
      reminders: [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      userId: undefined,
    };
  }

  listGoals(): Goal[] {
    const stmt = this.db.prepare(`
      SELECT * FROM goals ORDER BY created_at DESC
    `);
    const rows = stmt.all();
    return rows.map((r: any) => this.rowToGoal(r));
  }

  getGoalById(id: string): Goal | null {
    const stmt = this.db.prepare(`SELECT * FROM goals WHERE id = ?`);
    const row = stmt.get(id);
    return row ? this.rowToGoal(row) : null;
  }

  createGoal(goal: Omit<Goal, 'id'>): Goal {
    const id = `goal_${uuidv4()}`;
    const now = new Date();
    const full: Goal = {
      ...goal,
      id,
      createdAt: goal.createdAt || now,
      updatedAt: goal.updatedAt || now,
      reminders: goal.reminders || [],
    } as Goal;
    return this.createGoalWithId(full);
  }

  createGoalWithId(goal: Goal): Goal {
    const cols = this.goalToColumns(goal);
    const stmt = this.db.prepare(`
      INSERT INTO goals (
        id, title, description, type, target_value, current_value, unit, target_date, status, project_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      cols.id,
      cols.title,
      cols.description,
      cols.type,
      cols.target_value,
      cols.current_value,
      cols.unit,
      cols.target_date,
      cols.status,
      cols.project_id,
      cols.created_at,
      cols.updated_at,
    );
    const created = this.getGoalById(cols.id)!;
    return created;
  }

  updateGoal(id: string, updates: Partial<Goal>): Goal | null {
    const existing = this.getGoalById(id);
    if (!existing) return null;
    const merged: Goal = {
      ...existing,
      ...updates,
      config: { ...existing.config, ...(updates as any).config },
      progress: { ...existing.progress, ...(updates as any).progress },
      updatedAt: new Date(),
    };
    const cols = this.goalToColumns(merged);
    const stmt = this.db.prepare(`
      UPDATE goals SET
        title = ?,
        description = ?,
        type = ?,
        target_value = ?,
        current_value = ?,
        unit = ?,
        target_date = ?,
        status = ?,
        project_id = ?,
        updated_at = ?
      WHERE id = ?
    `);
    stmt.run(
      cols.title,
      cols.description,
      cols.type,
      cols.target_value,
      cols.current_value,
      cols.unit,
      cols.target_date,
      cols.status,
      cols.project_id,
      cols.updated_at,
      cols.id,
    );
    return this.getGoalById(id);
  }

  deleteGoal(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM goals WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

