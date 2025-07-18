import { getDatabase } from '../connection';
import { Project } from '@serenity/core';

export const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
  const db = getDatabase();
  
  const result = await db.one(`
    INSERT INTO projects (user_id, name, description, color, icon, archived)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [
    project.userId || null,
    project.name,
    project.description || null,
    project.color,
    project.icon || null,
    project.archived
  ]);

  return mapProjectFromDB(result);
};

export const getProjects = async (userId: string): Promise<Project[]> => {
  const db = getDatabase();
  
  const results = await db.any(`
    SELECT * FROM projects 
    WHERE user_id = $1 
    ORDER BY created_at DESC
  `, [userId]);

  return results.map(mapProjectFromDB);
};

export const getActiveProjects = async (userId: string): Promise<Project[]> => {
  const db = getDatabase();
  
  const results = await db.any(`
    SELECT * FROM projects 
    WHERE user_id = $1 AND archived = FALSE
    ORDER BY created_at DESC
  `, [userId]);

  return results.map(mapProjectFromDB);
};

export const getProjectById = async (projectId: string, userId: string): Promise<Project | null> => {
  const db = getDatabase();
  
  const result = await db.oneOrNone(`
    SELECT * FROM projects 
    WHERE id = $1 AND user_id = $2
  `, [projectId, userId]);

  return result ? mapProjectFromDB(result) : null;
};

export const updateProject = async (projectId: string, userId: string, updates: Partial<Project>): Promise<Project | null> => {
  const db = getDatabase();
  
  const setClause = [];
  const values = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    setClause.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    setClause.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.color !== undefined) {
    setClause.push(`color = $${paramIndex++}`);
    values.push(updates.color);
  }
  if (updates.icon !== undefined) {
    setClause.push(`icon = $${paramIndex++}`);
    values.push(updates.icon);
  }
  if (updates.archived !== undefined) {
    setClause.push(`archived = $${paramIndex++}`);
    values.push(updates.archived);
  }

  if (setClause.length === 0) {
    return getProjectById(projectId, userId);
  }

  values.push(projectId, userId);

  const result = await db.oneOrNone(`
    UPDATE projects 
    SET ${setClause.join(', ')}
    WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
    RETURNING *
  `, values);

  return result ? mapProjectFromDB(result) : null;
};

export const deleteProject = async (projectId: string, userId: string): Promise<boolean> => {
  const db = getDatabase();
  
  const result = await db.result(`
    DELETE FROM projects 
    WHERE id = $1 AND user_id = $2
  `, [projectId, userId]);

  return result.rowCount > 0;
};

export const getProjectWithTaskCount = async (userId: string): Promise<Array<Project & { taskCount: number }>> => {
  const db = getDatabase();
  
  const results = await db.any(`
    SELECT 
      p.*,
      COUNT(t.id) as task_count
    FROM projects p
    LEFT JOIN tasks t ON p.id = t.project_id AND t.completed = FALSE
    WHERE p.user_id = $1 AND p.archived = FALSE
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `, [userId]);

  return results.map(row => ({
    ...mapProjectFromDB(row),
    taskCount: parseInt(row.task_count) || 0
  }));
};

// Helper function to map database row to Project object
const mapProjectFromDB = (row: any): Project => {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    icon: row.icon,
    archived: row.archived,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
};