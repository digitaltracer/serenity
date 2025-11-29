import { PostgresAdapter } from '@serenity/database';
import { config } from '../config/env.js';
import logger from '../utils/logger.js';
import { NotFoundError, ValidationError, DatabaseError } from '../utils/errors.js';
import type { Project } from '../types/index.js';

export interface CreateProjectData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  archived?: boolean;
}

export interface ProjectFilters {
  archived?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Project Service
 * Uses PostgresAdapter from @serenity/database for database operations
 */
export class ProjectService {
  private adapter: PostgresAdapter;

  constructor() {
    this.adapter = new PostgresAdapter({
      connectionString: config.databaseUrl,
    });
  }

  /**
   * Get projects for a user with optional filters
   */
  async getProjects(userId: string, filters?: ProjectFilters): Promise<Project[]> {
    logger.info('Getting projects', { userId, filters });

    try {
      let query = `
        SELECT
          id,
          user_id as "userId",
          name,
          description,
          color,
          icon,
          archived,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM projects
        WHERE user_id = $1
      `;

      const params: any[] = [userId];
      let paramIndex = 2;

      // Apply filters
      if (filters?.archived !== undefined) {
        query += ` AND archived = $${paramIndex++}`;
        params.push(filters.archived);
      }

      query += ` ORDER BY created_at DESC`;

      if (filters?.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }

      const result = await this.adapter.query(query, params);

      logger.info('Projects retrieved successfully', {
        userId,
        count: result.rows.length,
      });

      return result.rows as Project[];
    } catch (error) {
      logger.error('Failed to get projects', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        filters,
      });
      throw new DatabaseError('Failed to retrieve projects');
    }
  }

  /**
   * Get a single project by ID
   */
  async getProjectById(userId: string, projectId: string): Promise<Project | null> {
    logger.info('Getting project by ID', { userId, projectId });

    try {
      const query = `
        SELECT
          id,
          user_id as "userId",
          name,
          description,
          color,
          icon,
          archived,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM projects
        WHERE id = $1 AND user_id = $2
      `;

      const result = await this.adapter.query(query, [projectId, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as Project;
    } catch (error) {
      logger.error('Failed to get project by ID', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        projectId,
      });
      throw new DatabaseError('Failed to retrieve project');
    }
  }

  /**
   * Create a new project
   */
  async createProject(userId: string, data: CreateProjectData): Promise<Project> {
    logger.info('Creating project', { userId, name: data.name });

    try {
      const projectResult = await this.adapter.query(
        `INSERT INTO projects (
          user_id, name, description, color, icon
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          user_id as "userId",
          name,
          description,
          color,
          icon,
          archived,
          created_at as "createdAt",
          updated_at as "updatedAt"`,
        [
          userId,
          data.name,
          data.description || null,
          data.color || '#3B82F6',
          data.icon || null,
        ]
      );

      const project = projectResult.rows[0] as Project;

      logger.info('Project created successfully', { projectId: project.id });
      return project;
    } catch (error) {
      logger.error('Failed to create project', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        data,
      });
      throw new DatabaseError('Failed to create project');
    }
  }

  /**
   * Update an existing project
   */
  async updateProject(userId: string, projectId: string, data: UpdateProjectData): Promise<Project> {
    logger.info('Updating project', { userId, projectId, data });

    try {
      // Verify ownership
      const ownershipCheck = await this.adapter.query(
        `SELECT id FROM projects WHERE id = $1 AND user_id = $2`,
        [projectId, userId]
      );

      if (ownershipCheck.rows.length === 0) {
        throw new NotFoundError('Project not found or access denied');
      }

      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }

      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }

      if (data.color !== undefined) {
        updates.push(`color = $${paramIndex++}`);
        values.push(data.color);
      }

      if (data.icon !== undefined) {
        updates.push(`icon = $${paramIndex++}`);
        values.push(data.icon);
      }

      if (data.archived !== undefined) {
        updates.push(`archived = $${paramIndex++}`);
        values.push(data.archived);
      }

      if (updates.length === 0) {
        throw new ValidationError('No fields to update');
      }

      updates.push(`updated_at = NOW()`);
      values.push(projectId);

      const query = `
        UPDATE projects
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING
          id,
          user_id as "userId",
          name,
          description,
          color,
          icon,
          archived,
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const result = await this.adapter.query(query, values);

      logger.info('Project updated successfully', { projectId });
      return result.rows[0] as Project;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Failed to update project', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        projectId,
        data,
      });
      throw new DatabaseError('Failed to update project');
    }
  }

  /**
   * Archive a project
   */
  async archiveProject(userId: string, projectId: string): Promise<Project> {
    logger.info('Archiving project', { userId, projectId });

    try {
      const result = await this.adapter.query(
        `UPDATE projects
         SET archived = true,
             updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING
           id,
           user_id as "userId",
           name,
           description,
           color,
           icon,
           archived,
           created_at as "createdAt",
           updated_at as "updatedAt"`,
        [projectId, userId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Project not found or access denied');
      }

      logger.info('Project archived successfully', { projectId });
      return result.rows[0] as Project;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to archive project', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        projectId,
      });
      throw new DatabaseError('Failed to archive project');
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(userId: string, projectId: string): Promise<void> {
    logger.info('Deleting project', { userId, projectId });

    try {
      const result = await this.adapter.query(
        `DELETE FROM projects
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [projectId, userId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Project not found or access denied');
      }

      logger.info('Project deleted successfully', { projectId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to delete project', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        projectId,
      });
      throw new DatabaseError('Failed to delete project');
    }
  }
}

// Export singleton instance
export const projectService = new ProjectService();
