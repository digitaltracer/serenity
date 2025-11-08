/**
 * Journal API endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'
import { z } from 'zod'

const JournalSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1),
  date: z.string(),
  tags: z.array(z.string()).default([]),
  pinned: z.boolean().default(false),
  mood: z.enum(['happy', 'neutral', 'sad', 'excited', 'stressed']).optional().nullable(),
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
      'SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
      [session.user.id]
    )

    const entries = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      date: row.date,
      tags: row.tags || [],
      pinned: row.pinned,
      mood: row.mood,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      encrypted: row.encrypted,
      encryptionIv: row.encryption_iv,
      userId: row.user_id,
    }))

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Failed to fetch journal entries:', error)
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = JournalSchema.parse(body)

    const result = await db.query(
      `INSERT INTO journal_entries (
        user_id, title, content, date, tags, pinned, mood, encrypted, encryption_iv, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [
        session.user.id,
        data.title || null,
        data.content,
        data.date,
        data.tags,
        data.pinned,
        data.mood || null,
        data.encrypted,
        data.encryptionIv || null,
      ]
    )

    const entry = result.rows[0]

    await db.query(
      `INSERT INTO sync_metadata (user_id, entity_type, entity_id, version, last_modified_by, last_modified_at)
       VALUES ($1, 'journal', $2, 1, 'web', NOW())`,
      [session.user.id, entry.id]
    )

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
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Failed to create journal entry:', error)
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 })
  }
}
