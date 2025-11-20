/**
 * Google Calendar OAuth endpoint
 * Handles OAuth authentication flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.NEXTAUTH_URL + '/api/integrations/google/callback'

/**
 * Initiate Google OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      )
    }

    // Generate OAuth URL
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
      state: session.user.id, // Pass user ID as state
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Google auth initiation failed:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Google authentication' },
      { status: 500 }
    )
  }
}

/**
 * Exchange code for tokens (called by callback)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Authorization code required' }, { status: 400 })
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Token exchange failed')
    }

    const tokens = await tokenResponse.json()

    // Store tokens in database
    await db.query(
      `INSERT INTO integrations (user_id, provider, access_token, refresh_token, expires_at, enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (user_id, provider)
       DO UPDATE SET
         access_token = $3,
         refresh_token = $4,
         expires_at = $5,
         enabled = $6,
         updated_at = NOW()`,
      [
        session.user.id,
        'google_calendar',
        tokens.access_token,
        tokens.refresh_token,
        new Date(Date.now() + tokens.expires_in * 1000),
        true,
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Google token exchange failed:', error)
    return NextResponse.json(
      { error: 'Failed to complete Google authentication' },
      { status: 500 }
    )
  }
}

/**
 * Disconnect Google Calendar
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.query(
      'DELETE FROM integrations WHERE user_id = $1 AND provider = $2',
      [session.user.id, 'google_calendar']
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Google disconnect failed:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Google Calendar' },
      { status: 500 }
    )
  }
}
