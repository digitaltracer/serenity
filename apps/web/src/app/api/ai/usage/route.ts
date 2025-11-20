/**
 * AI Usage API endpoint
 * Retrieves AI usage statistics for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/postgres';

export const dynamic = 'force-dynamic'

interface AIUsageRecord {
  id?: number;
  provider: 'openai' | 'gemini' | 'anthropic';
  operation: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get limit from query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    // Query AI usage records from database
    // Note: This assumes an ai_usage table exists. If not, it will return an empty array.
    try {
      const result = await db.query(
        `SELECT
          id,
          provider,
          operation,
          prompt_tokens as "promptTokens",
          completion_tokens as "completionTokens",
          total_tokens as "totalTokens",
          created_at as timestamp
         FROM ai_usage
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [session.user.id, limit]
      );

      const usage: AIUsageRecord[] = result.rows;

      return NextResponse.json({
        success: true,
        usage,
      });
    } catch (queryError) {
      // If table doesn't exist yet, return empty array
      console.log('AI usage table may not exist yet:', queryError);
      return NextResponse.json({
        success: true,
        usage: [],
      });
    }

  } catch (error) {
    console.error('Failed to list AI usage:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to list AI usage',
    }, { status: 500 });
  }
}
