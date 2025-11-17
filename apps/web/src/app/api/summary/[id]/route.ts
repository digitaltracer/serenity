/**
 * Individual Summary API endpoint
 * Handles GET and DELETE operations for specific summaries
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * Get summary by ID
 */
export async function GET(
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
      `SELECT * FROM summaries
       WHERE id = $1 AND user_id = $2`,
      [id, session.user.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Summary not found' }, { status: 404 })
    }

    const row = result.rows[0]
    const summary = {
      id: row.id,
      title: row.title,
      content: row.content,
      summaryType: row.summary_type,
      startDate: row.start_date,
      endDate: row.end_date,
      generatedAt: row.created_at,
      wordCount: row.word_count,
      metadata: JSON.parse(row.metadata || '{}'),
      provider: row.provider,
      promptTokens: row.prompt_tokens,
      completionTokens: row.completion_tokens,
      totalTokens: row.total_tokens,
    }

    return NextResponse.json({ success: true, summary })
  } catch (error) {
    console.error('Failed to fetch summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch summary' },
      { status: 500 }
    )
  }
}

/**
 * Delete summary
 */
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
      'DELETE FROM summaries WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, session.user.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Summary not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, id: result.rows[0].id })
  } catch (error) {
    console.error('Failed to delete summary:', error)
    return NextResponse.json(
      { error: 'Failed to delete summary' },
      { status: 500 }
    )
  }
}
