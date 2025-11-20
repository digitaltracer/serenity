/**
 * Goals API endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await db.query(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
      [session.user.id]
    )

    const goals = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      config: row.config,
      progress: row.progress,
      status: row.status,
      priority: row.priority,
      reminders: row.reminders,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return NextResponse.json(goals)
  } catch (error) {
    console.error('Failed to fetch goals:', error)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const result = await db.query(
      `INSERT INTO goals (
        user_id, title, description, type, config, progress, status, priority, reminders, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [
        session.user.id,
        body.title,
        body.description || null,
        body.type,
        JSON.stringify(body.config || {}),
        JSON.stringify(body.progress || {}),
        body.status || 'active',
        body.priority || 'medium',
        JSON.stringify(body.reminders || []),
      ]
    )

    const goal = result.rows[0]
    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error('Failed to create goal:', error)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}
