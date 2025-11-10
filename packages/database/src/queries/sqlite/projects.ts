/**
 * SQLite Project Queries for Serenity Notes
 */

import Database from 'better-sqlite3';
import { Project } from '@serenity/core';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@serenity/core';

export class SQLiteProjectQueries {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Get all projects
   */
  getAllProjects(): Project[] {
    const stmt = this.db.prepare(`
      SELECT * FROM projects 
      ORDER BY created_at DESC
    `);

    const rows = stmt.all();
    return rows.map(this.rowToProject);
  }

  /**
   * Get project by ID
   */
  getProjectById(id: string): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.rowToProject(row) : null;
  }

  /**
   * Get active projects (not archived)
   */
  getActiveProjects(): Project[] {
    const stmt = this.db.prepare(`
      SELECT * FROM projects 
      WHERE archived = 0
      ORDER BY created_at DESC
    `);

    const rows = stmt.all();
    return rows.map(this.rowToProject);
  }

  /**
   * Create a new project
   */
  createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const id = this.generateId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO projects (
        id, name, description, color, archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      project.name,
      project.description || null,
      project.color || '#3B82F6',
      project.archived ? 1 : 0,
      now,
      now
    );

    return this.getProjectById(id)!;
  }

  /**
   * Create a project with a specific ID (used by middleware to preserve Redux IDs)
   */
  createProjectWithId(project: Project): Project {
    logger.info('📁 SQLite: Creating project with existing ID:', { component: 'projects', operation: 'sqlite:CreatingProject' });
    
    const stmt = this.db.prepare(`
      INSERT INTO projects (
        id, name, description, color, archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertResult = stmt.run(
      project.id,
      project.name,
      project.description || null,
      project.color,
      project.archived ? 1 : 0,
      project.createdAt.toISOString(),
      project.updatedAt.toISOString()
    );
    
    logger.info(`Project inserted with existing ID ${project.id}`, { component: 'projects', operation: 'projectInserted' });

    const savedProject = this.getProjectById(project.id)!;
    logger.info('Returning saved project', { component: 'projects', operation: 'returningSavedProject', metadata: { id: savedProject.id, name: savedProject.name } });
    
    return savedProject;
  }

  /**
   * Update a project
   */
  updateProject(id: string, updates: Partial<Project>): Project | null {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    // Build dynamic update query
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color);
    }
    if (updates.archived !== undefined) {
      fields.push('archived = ?');
      values.push(updates.archived ? 1 : 0);
    }

    if (fields.length === 0) {
      return this.getProjectById(id);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE projects 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);
    return this.getProjectById(id);
  }

  /**
   * Delete a project
   */
  deleteProject(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Archive/unarchive a project
   */
  archiveProject(id: string, archived: boolean = true): Project | null {
    return this.updateProject(id, { archived });
  }

  /**
   * Get project with task count
   */
  getProjectWithTaskCount(id: string): (Project & { taskCount: number; completedTasks: number }) | null {
    const project = this.getProjectById(id);
    if (!project) return null;

    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_tasks
      FROM tasks 
      WHERE project_id = ?
    `);

    const stats = stmt.get(id) as { total_tasks: number; completed_tasks: number };

    return {
      ...project,
      taskCount: stats.total_tasks,
      completedTasks: stats.completed_tasks || 0
    };
  }

  /**
   * Get all projects with task counts
   */
  getProjectsWithTaskCounts(): (Project & { taskCount: number; completedTasks: number })[] {
    const stmt = this.db.prepare(`
      SELECT 
        p.*,
        COALESCE(t.total_tasks, 0) as task_count,
        COALESCE(t.completed_tasks, 0) as completed_tasks
      FROM projects p
      LEFT JOIN (
        SELECT 
          project_id,
          COUNT(*) as total_tasks,
          SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_tasks
        FROM tasks 
        GROUP BY project_id
      ) t ON p.id = t.project_id
      ORDER BY p.created_at DESC
    `);

    const rows = stmt.all();
    return rows.map((row: any) => ({
      ...this.rowToProject(row),
      taskCount: row.task_count,
      completedTasks: row.completed_tasks || 0
    }));
  }

  /**
   * Search projects
   */
  searchProjects(query: string): Project[] {
    const stmt = this.db.prepare(`
      SELECT * FROM projects 
      WHERE name LIKE ? OR description LIKE ?
      ORDER BY created_at DESC
    `);

    const searchTerm = `%${query}%`;
    const rows = stmt.all(searchTerm, searchTerm);
    return rows.map(this.rowToProject);
  }

  /**
   * Convert database row to Project object
   */
  private rowToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      color: row.color || '#3B82F6',
      archived: Boolean(row.archived),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return uuidv4();
  }
}