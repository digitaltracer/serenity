/**
 * Google Calendar OAuth Callback
 * Handles the OAuth redirect from Google
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI = process.env.NEXTAUTH_URL + '/api/integrations/google/callback'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // User ID
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error)
      return NextResponse.redirect(new URL('/integrations?error=oauth_denied', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/integrations?error=no_code', request.url))
    }

    // Verify user session
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/login', request.url))
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
      const errorData = await tokenResponse.json()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(new URL('/integrations?error=token_exchange_failed', request.url))
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

    return NextResponse.redirect(new URL('/integrations?success=google_connected', request.url))
  } catch (error) {
    console.error('Google OAuth callback failed:', error)
    return NextResponse.redirect(new URL('/integrations?error=callback_failed', request.url))
  }
}
