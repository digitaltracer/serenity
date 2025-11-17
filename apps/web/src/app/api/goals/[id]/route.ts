/**
 * Individual Goal API endpoint
 * Handles PATCH and DELETE operations for specific goals
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'

interface RouteParams {
  params: {
    id: string
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // Build dynamic UPDATE query based on provided fields
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (body.title !== undefined) {
      updates.push(`title = $${paramIndex++}`)
      values.push(body.title)
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(body.description)
    }

    if (body.type !== undefined) {
      updates.push(`type = $${paramIndex++}`)
      values.push(body.type)
    }

    if (body.config !== undefined) {
      updates.push(`config = $${paramIndex++}`)
      values.push(JSON.stringify(body.config))
    }

    if (body.progress !== undefined) {
      updates.push(`progress = $${paramIndex++}`)
      values.push(JSON.stringify(body.progress))
    }

    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      values.push(body.status)
    }

    if (body.priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`)
      values.push(body.priority)
    }

    if (body.reminders !== undefined) {
      updates.push(`reminders = $${paramIndex++}`)
      values.push(JSON.stringify(body.reminders))
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Always update updated_at
    updates.push(`updated_at = NOW()`)

    // Add user_id and id to values
    values.push(session.user.id, id)

    const query = `
      UPDATE goals
      SET ${updates.join(', ')}
      WHERE user_id = $${paramIndex++} AND id = $${paramIndex++}
      RETURNING *
    `

    const result = await db.query(query, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const goal = result.rows[0]
    return NextResponse.json({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      type: goal.type,
      config: goal.config,
      progress: goal.progress,
      status: goal.status,
      priority: goal.priority,
      reminders: goal.reminders,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
    })
  } catch (error) {
    console.error('Failed to update goal:', error)
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const result = await db.query(
      'DELETE FROM goals WHERE user_id = $1 AND id = $2 RETURNING id',
      [session.user.id, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, id: result.rows[0].id })
  } catch (error) {
    console.error('Failed to delete goal:', error)
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    )
  }
}
