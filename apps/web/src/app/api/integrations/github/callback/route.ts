/**
 * GitHub OAuth Callback
 * Handles the OAuth redirect from GitHub
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // User ID
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('GitHub OAuth error:', error)
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

    // Exchange code for token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed')
      return NextResponse.redirect(new URL('/integrations?error=token_exchange_failed', request.url))
    }

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error('GitHub token error:', tokenData.error_description || tokenData.error)
      return NextResponse.redirect(new URL('/integrations?error=token_error', request.url))
    }

    // Store token in database
    await db.query(
      `INSERT INTO integrations (user_id, provider, access_token, enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (user_id, provider)
       DO UPDATE SET
         access_token = $3,
         enabled = $4,
         updated_at = NOW()`,
      [
        session.user.id,
        'github',
        tokenData.access_token,
        true,
      ]
    )

    return NextResponse.redirect(new URL('/integrations?success=github_connected', request.url))
  } catch (error) {
    console.error('GitHub OAuth callback failed:', error)
    return NextResponse.redirect(new URL('/integrations?error=callback_failed', request.url))
  }
}
