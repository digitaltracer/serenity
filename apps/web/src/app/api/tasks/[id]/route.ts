/**
 * Individual task API endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'
import { z } from 'zod'

const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  encrypted: z.boolean().optional(),
  encryptionIv: z.string().optional().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = UpdateTaskSchema.parse(body)

    // Build dynamic update query
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (data.title !== undefined) {
      updates.push(`title = $${paramCount++}`)
      values.push(data.title)
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`)
      values.push(data.description)
    }
    if (data.completed !== undefined) {
      updates.push(`completed = $${paramCount++}`)
      values.push(data.completed)
    }
    if (data.priority !== undefined) {
      updates.push(`priority = $${paramCount++}`)
      values.push(data.priority)
    }
    if (data.dueDate !== undefined) {
      updates.push(`due_date = $${paramCount++}`)
      values.push(data.dueDate)
    }
    if (data.projectId !== undefined) {
      updates.push(`project_id = $${paramCount++}`)
      values.push(data.projectId)
    }
    if (data.tags !== undefined) {
      updates.push(`tags = $${paramCount++}`)
      values.push(data.tags)
    }
    if (data.encrypted !== undefined) {
      updates.push(`encrypted = $${paramCount++}`)
      values.push(data.encrypted)
    }
    if (data.encryptionIv !== undefined) {
      updates.push(`encryption_iv = $${paramCount++}`)
      values.push(data.encryptionIv)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    values.push(params.id, session.user.id)

    const result = await db.query(
      `UPDATE tasks SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND user_id = $${paramCount++}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Update sync metadata
    await db.query(
      `INSERT INTO sync_metadata (user_id, entity_type, entity_id, version, last_modified_by, last_modified_at)
       VALUES ($1, 'task', $2, 1, 'web', NOW())
       ON CONFLICT (entity_type, entity_id) DO UPDATE SET
         version = sync_metadata.version + 1,
         last_modified_by = 'web',
         last_modified_at = NOW()`,
      [session.user.id, params.id]
    )

    const task = result.rows[0]
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
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Failed to update task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await db.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [params.id, session.user.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Mark as deleted in sync metadata
    await db.query(
      `UPDATE sync_metadata SET is_deleted = TRUE, last_modified_at = NOW()
       WHERE entity_type = 'task' AND entity_id = $1`,
      [params.id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
