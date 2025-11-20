/**
 * Google Calendar Sync endpoint
 * Syncs events from Google Calendar to tasks
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

/**
 * Sync Google Calendar events
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Google Calendar integration
    const integrationResult = await db.query(
      'SELECT * FROM integrations WHERE user_id = $1 AND provider = $2 AND enabled = true',
      [session.user.id, 'google_calendar']
    )

    if (integrationResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      )
    }

    const integration = integrationResult.rows[0]

    // Check if token is expired
    let accessToken = integration.access_token
    if (new Date(integration.expires_at) < new Date()) {
      // Refresh token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
        }),
      })

      if (refreshResponse.ok) {
        const tokens = await refreshResponse.json()
        accessToken = tokens.access_token

        // Update stored tokens
        await db.query(
          `UPDATE integrations
           SET access_token = $1, expires_at = $2, updated_at = NOW()
           WHERE user_id = $3 AND provider = $4`,
          [
            tokens.access_token,
            new Date(Date.now() + tokens.expires_in * 1000),
            session.user.id,
            'google_calendar',
          ]
        )
      }
    }

    // Fetch calendar events (next 30 days)
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)

    const eventsResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${now.toISOString()}&` +
      `timeMax=${futureDate.toISOString()}&` +
      `singleEvents=true&` +
      `orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!eventsResponse.ok) {
      throw new Error('Failed to fetch calendar events')
    }

    const eventsData = await eventsResponse.json()
    const events = eventsData.items || []

    // Convert events to tasks (only if not already synced)
    let syncedCount = 0
    for (const event of events) {
      if (!event.summary) continue

      // Check if already synced
      const existingTask = await db.query(
        `SELECT id FROM tasks
         WHERE user_id = $1 AND metadata->>'google_event_id' = $2`,
        [session.user.id, event.id]
      )

      if (existingTask.rows.length > 0) continue

      // Create task from event
      const dueDate = event.start?.dateTime || event.start?.date
      await db.query(
        `INSERT INTO tasks (
          user_id, title, description, due_date, tags, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          session.user.id,
          event.summary,
          event.description || '',
          dueDate,
          ['google-calendar'],
          JSON.stringify({
            google_event_id: event.id,
            google_event_link: event.htmlLink,
            synced_from: 'google_calendar',
          }),
        ]
      )

      syncedCount++
    }

    // Update last sync time
    await db.query(
      'UPDATE integrations SET last_sync_at = NOW() WHERE user_id = $1 AND provider = $2',
      [session.user.id, 'google_calendar']
    )

    return NextResponse.json({
      success: true,
      syncedCount,
      totalEvents: events.length,
    })
  } catch (error) {
    console.error('Google Calendar sync failed:', error)
    return NextResponse.json(
      { error: 'Failed to sync Google Calendar' },
      { status: 500 }
    )
  }
}

/**
 * Get sync status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integrationResult = await db.query(
      'SELECT last_sync_at, enabled FROM integrations WHERE user_id = $1 AND provider = $2',
      [session.user.id, 'google_calendar']
    )

    if (integrationResult.rows.length === 0) {
      return NextResponse.json({
        connected: false,
        lastSyncAt: null,
      })
    }

    const integration = integrationResult.rows[0]

    return NextResponse.json({
      connected: true,
      enabled: integration.enabled,
      lastSyncAt: integration.last_sync_at,
    })
  } catch (error) {
    console.error('Failed to get sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}
