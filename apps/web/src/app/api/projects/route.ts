/**
 * Projects API endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const ProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().default('#3B82F6'),
  icon: z.string().optional(),
  archived: z.boolean().default(false),
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
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [session.user.id]
    )

    const projects = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      icon: row.icon,
      archived: row.archived,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      encrypted: row.encrypted,
      encryptionIv: row.encryption_iv,
      userId: row.user_id,
    }))

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = ProjectSchema.parse(body)

    const result = await db.query(
      `INSERT INTO projects (
        user_id, name, description, color, icon, archived, encrypted, encryption_iv, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *`,
      [
        session.user.id,
        data.name,
        data.description || null,
        data.color,
        data.icon || null,
        data.archived,
        data.encrypted,
        data.encryptionIv || null,
      ]
    )

    const project = result.rows[0]

    await db.query(
      `INSERT INTO sync_metadata (user_id, entity_type, entity_id, version, last_modified_by, last_modified_at)
       VALUES ($1, 'project', $2, 1, 'web', NOW())`,
      [session.user.id, project.id]
    )

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      icon: project.icon,
      archived: project.archived,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      encrypted: project.encrypted,
      encryptionIv: project.encryption_iv,
      userId: project.user_id,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Failed to create project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
