/**
 * AI Settings API endpoint
 * Manages AI provider configuration and API keys
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/postgres';

interface AISettingsResult {
  success: boolean;
  settings?: {
    activeProvider: string | null;
    providersWithKeys: {
      openai?: boolean;
      gemini?: boolean;
      anthropic?: boolean;
    };
  };
  error?: string;
}

/**
 * GET - Retrieve AI provider settings
 */
export async function GET(request: NextRequest): Promise<NextResponse<AISettingsResult>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's AI provider settings
    const result = await db.query(
      `SELECT ai_provider,
              ai_api_key_encrypted IS NOT NULL as has_openai_key,
              ai_gemini_key_encrypted IS NOT NULL as has_gemini_key,
              ai_anthropic_key_encrypted IS NOT NULL as has_anthropic_key
       FROM users
       WHERE id = $1`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    const row = result.rows[0];

    return NextResponse.json({
      success: true,
      settings: {
        activeProvider: row.ai_provider || null,
        providersWithKeys: {
          openai: row.has_openai_key || false,
          gemini: row.has_gemini_key || false,
          anthropic: row.has_anthropic_key || false,
        },
      },
    });

  } catch (error) {
    console.error('Failed to get AI settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve AI settings',
    }, { status: 500 });
  }
}

/**
 * PUT - Update AI provider settings
 */
export async function PUT(request: NextRequest): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { activeProvider } = body;

    if (activeProvider && !['openai', 'gemini', 'anthropic'].includes(activeProvider)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid provider',
      }, { status: 400 });
    }

    // Update active provider
    await db.query(
      `UPDATE users SET ai_provider = $1, updated_at = NOW() WHERE id = $2`,
      [activeProvider || null, session.user.id]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to update AI settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update AI settings',
    }, { status: 500 });
  }
}
