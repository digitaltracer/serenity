/**
 * GitHub Sync endpoint
 * Syncs issues and PRs from GitHub to tasks
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'

/**
 * Sync GitHub issues and PRs
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get GitHub integration
    const integrationResult = await db.query(
      'SELECT * FROM integrations WHERE user_id = $1 AND provider = $2 AND enabled = true',
      [session.user.id, 'github']
    )

    if (integrationResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'GitHub not connected' },
        { status: 400 }
      )
    }

    const integration = integrationResult.rows[0]
    const accessToken = integration.access_token

    // Fetch assigned issues and PRs
    const issuesResponse = await fetch(
      'https://api.github.com/issues?filter=assigned&state=open&per_page=100',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (!issuesResponse.ok) {
      throw new Error('Failed to fetch GitHub issues')
    }

    const issues = await issuesResponse.json()

    // Convert issues to tasks
    let syncedCount = 0
    for (const issue of issues) {
      // Check if already synced
      const existingTask = await db.query(
        `SELECT id FROM tasks
         WHERE user_id = $1 AND metadata->>'github_issue_id' = $2`,
        [session.user.id, issue.id.toString()]
      )

      if (existingTask.rows.length > 0) {
        // Update existing task
        await db.query(
          `UPDATE tasks
           SET title = $1, description = $2, updated_at = NOW()
           WHERE user_id = $3 AND metadata->>'github_issue_id' = $4`,
          [
            issue.title,
            issue.body || '',
            session.user.id,
            issue.id.toString(),
          ]
        )
      } else {
        // Create new task
        const isPR = !!issue.pull_request
        const tags = ['github']
        if (isPR) tags.push('pull-request')
        if (issue.labels) {
          tags.push(...issue.labels.map((l: any) => l.name))
        }

        // Determine priority based on labels
        let priority = 'medium'
        const labelNames = issue.labels?.map((l: any) => l.name.toLowerCase()) || []
        if (labelNames.includes('critical') || labelNames.includes('urgent')) {
          priority = 'high'
        } else if (labelNames.includes('low priority') || labelNames.includes('nice-to-have')) {
          priority = 'low'
        }

        await db.query(
          `INSERT INTO tasks (
            user_id, title, description, priority, tags, metadata, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [
            session.user.id,
            issue.title,
            issue.body || '',
            priority,
            tags,
            JSON.stringify({
              github_issue_id: issue.id.toString(),
              github_issue_number: issue.number,
              github_url: issue.html_url,
              github_repo: issue.repository_url.split('/').slice(-2).join('/'),
              github_state: issue.state,
              is_pull_request: isPR,
              synced_from: 'github',
            }),
          ]
        )
      }

      syncedCount++
    }

    // Update last sync time
    await db.query(
      'UPDATE integrations SET last_sync_at = NOW() WHERE user_id = $1 AND provider = $2',
      [session.user.id, 'github']
    )

    return NextResponse.json({
      success: true,
      syncedCount,
      totalIssues: issues.length,
    })
  } catch (error) {
    console.error('GitHub sync failed:', error)
    return NextResponse.json(
      { error: 'Failed to sync GitHub' },
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
      [session.user.id, 'github']
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
