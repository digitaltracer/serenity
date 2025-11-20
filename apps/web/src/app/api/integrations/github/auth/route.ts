/**
 * GitHub OAuth endpoint
 * Handles OAuth authentication flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
const GITHUB_REDIRECT_URI = process.env.NEXTAUTH_URL + '/api/integrations/github/callback'

/**
 * Initiate GitHub OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!GITHUB_CLIENT_ID) {
      return NextResponse.json(
        { error: 'GitHub OAuth not configured' },
        { status: 500 }
      )
    }

    // Generate OAuth URL
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_REDIRECT_URI,
      scope: 'repo read:user',
      state: session.user.id,
    })

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('GitHub auth initiation failed:', error)
    return NextResponse.json(
      { error: 'Failed to initiate GitHub authentication' },
      { status: 500 }
    )
  }
}

/**
 * Exchange code for tokens
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
        redirect_uri: GITHUB_REDIRECT_URI,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Token exchange failed')
    }

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error)
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('GitHub token exchange failed:', error)
    return NextResponse.json(
      { error: 'Failed to complete GitHub authentication' },
      { status: 500 }
    )
  }
}

/**
 * Disconnect GitHub
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.query(
      'DELETE FROM integrations WHERE user_id = $1 AND provider = $2',
      [session.user.id, 'github']
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('GitHub disconnect failed:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect GitHub' },
      { status: 500 }
    )
  }
}
