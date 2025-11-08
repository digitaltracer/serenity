/**
 * Stats API endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [tasks, projects, journal, goals] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM tasks WHERE user_id = $1', [session.user.id]),
      db.query('SELECT COUNT(*) as count FROM projects WHERE user_id = $1', [session.user.id]),
      db.query('SELECT COUNT(*) as count FROM journal_entries WHERE user_id = $1', [session.user.id]),
      db.query('SELECT COUNT(*) as count FROM goals WHERE user_id = $1', [session.user.id]),
    ])

    return NextResponse.json({
      totalTasks: parseInt(tasks.rows[0].count),
      totalProjects: parseInt(projects.rows[0].count),
      totalJournalEntries: parseInt(journal.rows[0].count),
      totalGoals: parseInt(goals.rows[0].count),
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
