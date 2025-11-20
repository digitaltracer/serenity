import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

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
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    const fieldMap: Record<string, string> = {
      title: 'title',
      content: 'content',
      date: 'date',
      tags: 'tags',
      pinned: 'pinned',
      mood: 'mood',
      encrypted: 'encrypted',
      encryptionIv: 'encryption_iv',
    }

    Object.entries(body).forEach(([key, value]) => {
      const dbField = fieldMap[key]
      if (dbField) {
        updates.push(`${dbField} = $${paramCount++}`)
        values.push(value)
      }
    })

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    updates.push('updated_at = NOW()')
    values.push(params.id, session.user.id)

    const result = await db.query(
      `UPDATE journal_entries SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND user_id = $${paramCount++}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    const entry = result.rows[0]
    return NextResponse.json({
      id: entry.id,
      title: entry.title,
      content: entry.content,
      date: entry.date,
      tags: entry.tags || [],
      pinned: entry.pinned,
      mood: entry.mood,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
      encrypted: entry.encrypted,
      encryptionIv: entry.encryption_iv,
      userId: entry.user_id,
    })
  } catch (error) {
    console.error('Failed to update journal entry:', error)
    return NextResponse.json({ error: 'Failed to update journal entry' }, { status: 500 })
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
      'DELETE FROM journal_entries WHERE id = $1 AND user_id = $2 RETURNING id',
      [params.id, session.user.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete journal entry:', error)
    return NextResponse.json({ error: 'Failed to delete journal entry' }, { status: 500 })
  }
}
