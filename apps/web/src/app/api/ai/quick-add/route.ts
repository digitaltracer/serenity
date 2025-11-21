/**
 * AI Quick Add API endpoint
 * Processes natural language input into structured tasks or journal entries
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/postgres';
import { z } from 'zod';

export const dynamic = 'force-dynamic'

const QuickAddSchema = z.object({
  text: z.string().min(1),
  provider: z.enum(['openai', 'gemini', 'anthropic']).optional(),
  debug: z.boolean().optional(),
});

interface AIQuickAddResult {
  success: boolean;
  data?: {
    kind: 'task' | 'journal';
    title?: string | null;
    description?: string | null;
    tags?: string[];
    priority?: 'low' | 'medium' | 'high' | null;
    dueDate?: string | null;
    project?: string | null;
  };
  error?: string;
  debug?: {
    provider?: string;
    model?: string;
    contentSample?: string;
  };
}

/**
 * Make API call to AI provider
 */
async function callAIProvider(
  provider: 'openai' | 'gemini' | 'anthropic',
  apiKey: string,
  instruction: string
): Promise<{ success: boolean; content?: string; model?: string; error?: string }> {
  try {
    switch (provider) {
      case 'openai': {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: instruction }],
            temperature: 0.2,
            max_tokens: 1000,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          return { success: false, error: `OpenAI API error: ${response.status} ${error}` };
        }

        const data = await response.json();
        return {
          success: true,
          content: data.choices[0]?.message?.content || '',
          model: data.model,
        };
      }

      case 'anthropic': {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 1000,
            temperature: 0.2,
            messages: [{ role: 'user', content: instruction }],
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          return { success: false, error: `Anthropic API error: ${response.status} ${error}` };
        }

        const data = await response.json();
        return {
          success: true,
          content: data.content[0]?.text || '',
          model: data.model,
        };
      }

      case 'gemini': {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: instruction }]
              }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1000,
              },
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          return { success: false, error: `Gemini API error: ${response.status} ${error}` };
        }

        const data = await response.json();
        return {
          success: true,
          content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
          model: 'gemini-1.5-flash',
        };
      }

      default:
        return { success: false, error: `Unsupported provider: ${provider}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error calling AI provider',
    };
  }
}

/**
 * Parse JSON response from AI with fallback mechanisms
 */
interface ParsedAIResponse {
  intent?: string;
  data?: {
    title?: string;
    content?: string;
    tags?: string[];
    priority?: "low" | "medium" | "high";
    dueDate?: string;
    project?: string;
  };
}


function parseAIResponse(content: string): ParsedAIResponse | null {
  // Try direct JSON parse
  try {
    return JSON.parse(content.trim());
  } catch {
    // Try to extract from markdown code blocks
    const markdownMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
      try {
        return JSON.parse(markdownMatch[1].trim());
      } catch {
        // Continue to regex fallback
      }
    }

    // Fallback to regex extraction
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }

    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<AIQuickAddResult>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = QuickAddSchema.parse(body);

    const text = data.text.trim();
    if (!text) {
      return NextResponse.json({ success: false, error: 'Empty input' });
    }

    // Get user's AI provider settings
    let provider = data.provider;
    let apiKey: string | null = null;

    // If no provider specified, get the active provider from settings
    if (!provider) {
      const settingsResult = await db.query(
        `SELECT ai_provider, ai_api_key_encrypted FROM users WHERE id = $1`,
        [session.user.id]
      );

      if (settingsResult.rows.length > 0 && settingsResult.rows[0].ai_provider) {
        provider = settingsResult.rows[0].ai_provider;
        apiKey = settingsResult.rows[0].ai_api_key_encrypted;
      }
    } else {
      // Get API key for specified provider
      const settingsResult = await db.query(
        `SELECT ai_api_key_encrypted FROM users WHERE id = $1 AND ai_provider = $2`,
        [session.user.id, provider]
      );

      if (settingsResult.rows.length > 0) {
        apiKey = settingsResult.rows[0].ai_api_key_encrypted;
      }
    }

    if (!provider || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'AI provider not configured. Please set up your AI provider in settings.',
      });
    }

    // Build the instruction prompt
    const currentDate = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const instruction = `You are an intelligent assistant for an application called "Serenity Notes". Your job is to analyze the user's input and convert it into a structured JSON object. Do not respond with conversational text, only the JSON object.

The current date is: **${currentDate}**.

The JSON object must have two top-level keys:
1. "intent": Can be either "CREATE_TASK" or "CREATE_JOURNAL".
2. "data": An object containing the extracted information.

### JSON Schema
- For "CREATE_TASK", the "data" object can contain:
    - "title": (string) The name of the task.
    - "dueDate": (string, ISO 8601 format YYYY-MM-DD) The calculated due date.
    - "priority": (string) Can be "low", "medium", or "high". Defaults to null if not mentioned.
    - "tags": (array of strings) Any tags mentioned, without the '#' symbol.
    - "project": (string) Project name if mentioned, otherwise null.
- For "CREATE_JOURNAL", the "data" object will contain:
    - "content": (string) The full text of the journal entry.
    - "tags": (array of strings) Any tags mentioned, without the '#' symbol.

### Examples

**User Input:** Remind me to call the accountant tomorrow #finance
**Your Output:**
{
  "intent": "CREATE_TASK",
  "data": {
    "title": "Call the accountant",
    "dueDate": "${tomorrow}",
    "priority": null,
    "tags": ["finance"],
    "project": null
  }
}

**User Input:** add "Finalize the presentation slides" to my list for this Friday, it's very important
**Your Output:**
{
  "intent": "CREATE_TASK",
  "data": {
    "title": "Finalize the presentation slides",
    "dueDate": "2025-09-15",
    "priority": "high",
    "tags": [],
    "project": null
  }
}

**User Input:** Journal: Today was a long day. We finally kicked off the new project and I'm feeling optimistic about the direction we're heading. #work
**Your Output:**
{
  "intent": "CREATE_JOURNAL",
  "data": {
    "content": "Today was a long day. We finally kicked off the new project and I'm feeling optimistic about the direction we're heading.",
    "tags": ["work"]
  }
}

**User Input:** Buy groceries for project dinner party tomorrow #shopping
**Your Output:**
{
  "intent": "CREATE_TASK",
  "data": {
    "title": "Buy groceries",
    "dueDate": "${tomorrow}",
    "priority": null,
    "tags": ["shopping"],
    "project": "dinner party"
  }
}

----

**User Input:** ${text}
**Your Output:**`;

    // Call AI provider
    const aiResult = await callAIProvider(provider, apiKey, instruction);

    if (!aiResult.success) {
      return NextResponse.json({
        success: false,
        error: aiResult.error || 'AI processing failed',
      });
    }

    // Parse response
    const parsed = parseAIResponse(aiResult.content || '');

    if (!parsed || !parsed.intent || !parsed.data) {
      return NextResponse.json({
        success: false,
        error: 'Failed to parse AI response',
        debug: data.debug ? { contentSample: aiResult.content?.slice(0, 500) } : undefined,
      });
    }

    // Convert to legacy format for compatibility
    const result = {
      kind: parsed.intent === 'CREATE_TASK' ? ('task' as const) : ('journal' as const),
      title: parsed.data.title || null,
      description: parsed.data.content || null,
      tags: parsed.data.tags || [],
      priority: parsed.data.priority || null,
      dueDate: parsed.data.dueDate || null,
      project: parsed.data.project || null,
    };

    return NextResponse.json({
      success: true,
      data: result,
      debug: data.debug ? {
        provider,
        model: aiResult.model,
        contentSample: aiResult.content?.slice(0, 500),
      } : undefined,
    });

  } catch (error) {
    console.error('AI quick-add error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error during Quick Add',
    }, { status: 500 });
  }
}
