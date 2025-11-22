/**
 * Integrations Status API endpoint
 * Returns status of all integrations for the current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all integrations for user
    const result = await db.query(
      `SELECT provider, enabled, last_sync_at, created_at
       FROM integrations
       WHERE user_id = $1`,
      [session.user.id]
    )

    const integrations: Record<string, any> = {
      google_calendar: {
        connected: false,
        enabled: false,
        lastSyncAt: null,
      },
      github: {
        connected: false,
        enabled: false,
        lastSyncAt: null,
      },
    }

    for (const row of result.rows) {
      integrations[row.provider] = {
        connected: true,
        enabled: row.enabled,
        lastSyncAt: row.last_sync_at,
        connectedAt: row.created_at,
      }
    }

    return NextResponse.json({ success: true, integrations })
  } catch (error) {
    console.error('Failed to get integrations status:', error)
    return NextResponse.json(
      { error: 'Failed to get integrations status' },
      { status: 500 }
    )
  }
}

/**
 * Toggle integration enabled status
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider, enabled } = await request.json()

    if (!provider || !['google_calendar', 'github'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    await db.query(
      `UPDATE integrations
       SET enabled = $1, updated_at = NOW()
       WHERE user_id = $2 AND provider = $3`,
      [enabled, session.user.id, provider]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update integration:', error)
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    )
  }
}
