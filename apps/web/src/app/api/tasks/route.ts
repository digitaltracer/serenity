/**
 * Tasks API endpoint
 * Handles CRUD operations for tasks with encryption support
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'
import { z } from 'zod'

const TaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).default([]),
  subtasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean(),
    order: z.number(),
  })).optional(),
  recurring: z.object({
    type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
    interval: z.number(),
    endDate: z.string().optional(),
  }).optional().nullable(),
  encrypted: z.boolean().default(false),
  encryptionIv: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await db.query(
      `SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC`,
      [session.user.id]
    )

    const tasks = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      completed: row.completed,
      priority: row.priority,
      dueDate: row.due_date,
      projectId: row.project_id,
      tags: row.tags || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      encrypted: row.encrypted,
      encryptionIv: row.encryption_iv,
      userId: row.user_id,
    }))

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = TaskSchema.parse(body)

    const result = await db.query(
      `INSERT INTO tasks (
        user_id, title, description, completed, priority, due_date, project_id, tags,
        encrypted, encryption_iv, recurring_pattern, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *`,
      [
        session.user.id,
        data.title,
        data.description || null,
        data.completed,
        data.priority,
        data.dueDate || null,
        data.projectId || null,
        data.tags,
        data.encrypted,
        data.encryptionIv || null,
        data.recurring ? JSON.stringify(data.recurring) : null,
      ]
    )

    const task = result.rows[0]

    // Create sync metadata
    await db.query(
      `INSERT INTO sync_metadata (user_id, entity_type, entity_id, version, last_modified_by, last_modified_at)
       VALUES ($1, 'task', $2, 1, 'web', NOW())
       ON CONFLICT (entity_type, entity_id) DO UPDATE SET
         version = sync_metadata.version + 1,
         last_modified_by = 'web',
         last_modified_at = NOW()`,
      [session.user.id, task.id]
    )

    return NextResponse.json({
      id: task.id,
      title: task.title,
      description: task.description,
      completed: task.completed,
      priority: task.priority,
      dueDate: task.due_date,
      projectId: task.project_id,
      tags: task.tags || [],
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      encrypted: task.encrypted,
      encryptionIv: task.encryption_iv,
      userId: task.user_id,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Failed to create task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
