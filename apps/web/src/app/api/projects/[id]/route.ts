import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'

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

    const allowedFields = ['name', 'description', 'color', 'icon', 'archived', 'encrypted', 'encryption_iv']
    const fieldMap: Record<string, string> = {
      name: 'name',
      description: 'description',
      color: 'color',
      icon: 'icon',
      archived: 'archived',
      encrypted: 'encrypted',
      encryptionIv: 'encryption_iv',
    }

    Object.entries(body).forEach(([key, value]) => {
      const dbField = fieldMap[key]
      if (dbField && allowedFields.includes(dbField)) {
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
      `UPDATE projects SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND user_id = $${paramCount++}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const project = result.rows[0]
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
    })
  } catch (error) {
    console.error('Failed to update project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
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
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [params.id, session.user.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
