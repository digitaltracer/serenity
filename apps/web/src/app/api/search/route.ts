/**
 * Global Search API endpoint
 * Performs full-text search across tasks, journal entries, projects, and goals
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

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const contentTypes = searchParams.get('types')?.split(',') || ['tasks', 'journal', 'projects', 'goals']
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    if (!query.trim()) {
      return NextResponse.json({ results: [] })
    }

    const results: any[] = []
    const searchTerm = `%${query.toLowerCase()}%`

    // Search tasks
    if (contentTypes.includes('tasks')) {
      const tasksResult = await db.query(
        `SELECT
          id,
          title,
          description,
          completed,
          priority,
          due_date as "dueDate",
          project_id as "projectId",
          tags,
          created_at as "createdAt",
          updated_at as "updatedAt",
          'task' as type
         FROM tasks
         WHERE user_id = $1
         AND (LOWER(title) LIKE $2 OR LOWER(description) LIKE $2)
         ORDER BY
           CASE
             WHEN LOWER(title) LIKE $2 THEN 1
             WHEN LOWER(description) LIKE $2 THEN 2
             ELSE 3
           END,
           updated_at DESC
         LIMIT $3`,
        [session.user.id, searchTerm, Math.floor(limit / contentTypes.length)]
      )

      results.push(...tasksResult.rows.map(row => ({
        ...row,
        score: row.title.toLowerCase().includes(query.toLowerCase()) ? 1.0 : 0.5,
        matchedFields: [
          row.title.toLowerCase().includes(query.toLowerCase()) ? 'title' : null,
          row.description?.toLowerCase().includes(query.toLowerCase()) ? 'description' : null
        ].filter(Boolean)
      })))
    }

    // Search journal entries
    if (contentTypes.includes('journal')) {
      const journalResult = await db.query(
        `SELECT
          id,
          title,
          content,
          mood,
          tags,
          date,
          pinned,
          created_at as "createdAt",
          updated_at as "updatedAt",
          'journal' as type
         FROM journal_entries
         WHERE user_id = $1
         AND (LOWER(title) LIKE $2 OR LOWER(content) LIKE $2)
         ORDER BY
           CASE
             WHEN LOWER(title) LIKE $2 THEN 1
             WHEN LOWER(content) LIKE $2 THEN 2
             ELSE 3
           END,
           date DESC
         LIMIT $3`,
        [session.user.id, searchTerm, Math.floor(limit / contentTypes.length)]
      )

      results.push(...journalResult.rows.map(row => ({
        ...row,
        score: row.title?.toLowerCase().includes(query.toLowerCase()) ? 1.0 : 0.5,
        matchedFields: [
          row.title?.toLowerCase().includes(query.toLowerCase()) ? 'title' : null,
          row.content?.toLowerCase().includes(query.toLowerCase()) ? 'content' : null
        ].filter(Boolean)
      })))
    }

    // Search projects
    if (contentTypes.includes('projects')) {
      const projectsResult = await db.query(
        `SELECT
          id,
          name,
          description,
          color,
          archived,
          created_at as "createdAt",
          updated_at as "updatedAt",
          'project' as type
         FROM projects
         WHERE user_id = $1
         AND (LOWER(name) LIKE $2 OR LOWER(description) LIKE $2)
         AND archived = false
         ORDER BY
           CASE
             WHEN LOWER(name) LIKE $2 THEN 1
             WHEN LOWER(description) LIKE $2 THEN 2
             ELSE 3
           END,
           updated_at DESC
         LIMIT $3`,
        [session.user.id, searchTerm, Math.floor(limit / contentTypes.length)]
      )

      results.push(...projectsResult.rows.map(row => ({
        ...row,
        title: row.name, // Normalize to have title field
        score: row.name.toLowerCase().includes(query.toLowerCase()) ? 1.0 : 0.5,
        matchedFields: [
          row.name.toLowerCase().includes(query.toLowerCase()) ? 'name' : null,
          row.description?.toLowerCase().includes(query.toLowerCase()) ? 'description' : null
        ].filter(Boolean)
      })))
    }

    // Search goals
    if (contentTypes.includes('goals')) {
      const goalsResult = await db.query(
        `SELECT
          id,
          title,
          description,
          status,
          target_value as "targetValue",
          current_value as "currentValue",
          deadline,
          created_at as "createdAt",
          updated_at as "updatedAt",
          'goal' as type
         FROM goals
         WHERE user_id = $1
         AND (LOWER(title) LIKE $2 OR LOWER(description) LIKE $2)
         ORDER BY
           CASE
             WHEN LOWER(title) LIKE $2 THEN 1
             WHEN LOWER(description) LIKE $2 THEN 2
             ELSE 3
           END,
           updated_at DESC
         LIMIT $3`,
        [session.user.id, searchTerm, Math.floor(limit / contentTypes.length)]
      )

      results.push(...goalsResult.rows.map(row => ({
        ...row,
        score: row.title.toLowerCase().includes(query.toLowerCase()) ? 1.0 : 0.5,
        matchedFields: [
          row.title.toLowerCase().includes(query.toLowerCase()) ? 'title' : null,
          row.description?.toLowerCase().includes(query.toLowerCase()) ? 'description' : null
        ].filter(Boolean)
      })))
    }

    // Sort all results by score and then by date
    results.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }
      return new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime()
    })

    return NextResponse.json({
      results: results.slice(0, limit),
      query,
      totalResults: results.length
    })
  } catch (error) {
    console.error('Search failed:', error)
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
