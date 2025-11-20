/**
 * AI Summary API endpoint
 * Handles summary generation and retrieval
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const GenerateSummarySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  types: z.array(z.enum(['tasks', 'journal'])),
  provider: z.enum(['openai', 'anthropic', 'gemini']).optional(),
})

/**
 * Generate AI summary
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { startDate, endDate, types, provider = 'openai' } = GenerateSummarySchema.parse(body)

    // Fetch tasks and journal entries in date range
    const tasksResult = await db.query(
      `SELECT * FROM tasks
       WHERE user_id = $1
       AND (due_date BETWEEN $2 AND $3 OR created_at BETWEEN $2 AND $3)
       ORDER BY due_date DESC, created_at DESC`,
      [session.user.id, startDate, endDate]
    )

    const journalResult = await db.query(
      `SELECT * FROM journal_entries
       WHERE user_id = $1
       AND date BETWEEN $2 AND $3
       ORDER BY date DESC`,
      [session.user.id, startDate, endDate]
    )

    const tasks = tasksResult.rows
    const journals = journalResult.rows

    // Build prompt for AI
    const prompt = buildSummaryPrompt(tasks, journals, types, startDate, endDate)

    // Get API key for provider (assuming stored in user settings)
    const settingsResult = await db.query(
      'SELECT ai_settings FROM users WHERE id = $1',
      [session.user.id]
    )

    let apiKey: string | null = null
    if (settingsResult.rows[0]?.ai_settings) {
      const aiSettings = settingsResult.rows[0].ai_settings
      apiKey = aiSettings[`${provider}ApiKey`] || null
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: `No API key configured for ${provider}` },
        { status: 400 }
      )
    }

    // Call AI provider
    const { content, usage } = await callAIProvider(provider, prompt, apiKey)

    // Extract title from response (first # heading or generate)
    const titleMatch = content.match(/^#\s+(.+)$/m)
    const title = titleMatch
      ? titleMatch[1].trim()
      : `Summary: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`

    // Determine summary type
    const summaryType = types.length === 2 ? 'combined' : types[0]

    // Calculate word count
    const wordCount = content.trim().split(/\s+/).length

    // Generate ID
    const id = `summary_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Store summary in database
    const insertResult = await db.query(
      `INSERT INTO summaries (
        id, user_id, title, content, summary_type, start_date, end_date,
        word_count, metadata, provider, prompt_tokens, completion_tokens, total_tokens,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *`,
      [
        id,
        session.user.id,
        title,
        content,
        summaryType,
        startDate,
        endDate,
        wordCount,
        JSON.stringify({}),
        provider,
        usage.promptTokens || 0,
        usage.completionTokens || 0,
        usage.totalTokens || 0,
      ]
    )

    // Track AI usage
    if (usage.totalTokens > 0) {
      await db.query(
        `INSERT INTO ai_usage (
          user_id, provider, operation, prompt_tokens, completion_tokens, total_tokens, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          session.user.id,
          provider,
          'summary',
          usage.promptTokens,
          usage.completionTokens,
          usage.totalTokens,
        ]
      )
    }

    const summary = insertResult.rows[0]

    return NextResponse.json({
      success: true,
      summary: {
        id: summary.id,
        title: summary.title,
        content: summary.content,
        summaryType: summary.summary_type,
        startDate: summary.start_date,
        endDate: summary.end_date,
        generatedAt: summary.created_at,
        wordCount: summary.word_count,
        metadata: JSON.parse(summary.metadata || '{}'),
        provider: summary.provider,
        promptTokens: summary.prompt_tokens,
        completionTokens: summary.completion_tokens,
        totalTokens: summary.total_tokens,
      },
    })
  } catch (error) {
    console.error('Failed to generate summary:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate summary',
      },
      { status: 500 }
    )
  }
}

/**
 * Get all summaries
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await db.query(
      `SELECT * FROM summaries
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [session.user.id]
    )

    const summaries = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      summaryType: row.summary_type,
      startDate: row.start_date,
      endDate: row.end_date,
      generatedAt: row.created_at,
      wordCount: row.word_count,
      metadata: JSON.parse(row.metadata || '{}'),
      provider: row.provider,
      promptTokens: row.prompt_tokens,
      completionTokens: row.completion_tokens,
      totalTokens: row.total_tokens,
    }))

    return NextResponse.json({ success: true, summaries })
  } catch (error) {
    console.error('Failed to fetch summaries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch summaries' },
      { status: 500 }
    )
  }
}

/**
 * Build AI prompt for summary generation
 */
function buildSummaryPrompt(
  tasks: any[],
  journals: any[],
  types: ('tasks' | 'journal')[],
  startDate: string,
  endDate: string
): string {
  const start = new Date(startDate).toLocaleDateString()
  const end = new Date(endDate).toLocaleDateString()

  let prompt = `Generate a comprehensive summary for the period from ${start} to ${end}.\n\n`

  if (types.includes('tasks') && tasks.length > 0) {
    prompt += `## Tasks (${tasks.length} total)\n\n`
    tasks.forEach((task, idx) => {
      if (idx < 50) { // Limit to first 50 to avoid token limits
        prompt += `- [${task.completed ? 'x' : ' '}] ${task.title}`
        if (task.priority) prompt += ` (Priority: ${task.priority})`
        if (task.due_date) prompt += ` (Due: ${new Date(task.due_date).toLocaleDateString()})`
        prompt += '\n'
      }
    })
    prompt += '\n'
  }

  if (types.includes('journal') && journals.length > 0) {
    prompt += `## Journal Entries (${journals.length} total)\n\n`
    journals.forEach((entry, idx) => {
      if (idx < 20) { // Limit to first 20 entries
        prompt += `### ${new Date(entry.date).toLocaleDateString()}`
        if (entry.title) prompt += ` - ${entry.title}`
        if (entry.mood) prompt += ` (Mood: ${entry.mood})`
        prompt += `\n${entry.content.substring(0, 500)}${entry.content.length > 500 ? '...' : ''}\n\n`
      }
    })
  }

  prompt += `\nPlease provide:\n`
  prompt += `1. A concise summary title (start with #)\n`
  prompt += `2. Key highlights and achievements\n`
  prompt += `3. Patterns or trends observed\n`
  prompt += `4. Areas for improvement\n`
  prompt += `5. Overall productivity assessment\n\n`
  prompt += `Format the response in markdown.`

  return prompt
}

/**
 * Call AI provider API
 */
async function callAIProvider(
  provider: string,
  prompt: string,
  apiKey: string
): Promise<{ content: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  if (provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful productivity assistant that creates insightful summaries.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    }
  } else if (provider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
    }
  } else if (provider === 'gemini') {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return {
      content: data.candidates[0].content.parts[0].text,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
    }
  }

  throw new Error(`Unsupported provider: ${provider}`)
}
