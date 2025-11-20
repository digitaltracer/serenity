/**
 * AI API Key Management endpoint
 * Handles secure storage and retrieval of AI provider API keys
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/postgres';
import { z } from 'zod';

export const dynamic = 'force-dynamic'

const ApiKeySchema = z.object({
  provider: z.enum(['openai', 'gemini', 'anthropic']),
  apiKey: z.string().min(1),
});

/**
 * POST - Store API key for a provider
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = ApiKeySchema.parse(body);

    // Validate API key format
    const validation = validateApiKeyFormat(data.provider, data.apiKey);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
      }, { status: 400 });
    }

    // Store API key based on provider
    // Note: In a production environment, these should be encrypted before storing
    // For now, storing as-is (encryption can be added via encryption lib)
    const columnMap = {
      openai: 'ai_api_key_encrypted',
      gemini: 'ai_gemini_key_encrypted',
      anthropic: 'ai_anthropic_key_encrypted',
    };

    const column = columnMap[data.provider];

    await db.query(
      `UPDATE users SET ${column} = $1, updated_at = NOW() WHERE id = $2`,
      [data.apiKey, session.user.id]
    );

    // If no active provider is set, set this as the active provider
    const settingsResult = await db.query(
      `SELECT ai_provider FROM users WHERE id = $1`,
      [session.user.id]
    );

    if (!settingsResult.rows[0]?.ai_provider) {
      await db.query(
        `UPDATE users SET ai_provider = $1 WHERE id = $2`,
        [data.provider, session.user.id]
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to store API key:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request format',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to store API key',
    }, { status: 500 });
  }
}

/**
 * DELETE - Remove API key for a provider
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (!provider || !['openai', 'gemini', 'anthropic'].includes(provider)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid provider',
      }, { status: 400 });
    }

    const columnMap: Record<string, string> = {
      openai: 'ai_api_key_encrypted',
      gemini: 'ai_gemini_key_encrypted',
      anthropic: 'ai_anthropic_key_encrypted',
    };

    const column = columnMap[provider];

    await db.query(
      `UPDATE users SET ${column} = NULL, updated_at = NOW() WHERE id = $1`,
      [session.user.id]
    );

    // If this was the active provider, clear it
    const settingsResult = await db.query(
      `SELECT ai_provider FROM users WHERE id = $1`,
      [session.user.id]
    );

    if (settingsResult.rows[0]?.ai_provider === provider) {
      await db.query(
        `UPDATE users SET ai_provider = NULL WHERE id = $1`,
        [session.user.id]
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to delete API key:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete API key',
    }, { status: 500 });
  }
}

/**
 * Validate API key format for a provider
 */
function validateApiKeyFormat(
  provider: 'openai' | 'gemini' | 'anthropic',
  apiKey: string
): { valid: boolean; error?: string } {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, error: 'API key cannot be empty' };
  }

  switch (provider) {
    case 'openai':
      if (!apiKey.startsWith('sk-')) {
        return { valid: false, error: 'OpenAI API keys must start with "sk-"' };
      }
      if (apiKey.length < 20) {
        return { valid: false, error: 'OpenAI API key is too short' };
      }
      break;

    case 'anthropic':
      if (!apiKey.startsWith('sk-ant-')) {
        return { valid: false, error: 'Anthropic API keys must start with "sk-ant-"' };
      }
      if (apiKey.length < 20) {
        return { valid: false, error: 'Anthropic API key is too short' };
      }
      break;

    case 'gemini':
      if (apiKey.length < 10) {
        return { valid: false, error: 'Gemini API key is too short' };
      }
      break;

    default:
      return { valid: false, error: `Unknown provider: ${provider}` };
  }

  return { valid: true };
}
