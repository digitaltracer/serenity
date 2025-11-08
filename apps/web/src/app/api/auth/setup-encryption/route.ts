/**
 * Encryption setup endpoint
 * Users must set up an encryption password after OAuth sign-in
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db/postgres'
import { hashPassword, generateSalt } from '@/lib/encryption/server-crypto'
import { z } from 'zod'

const SetupEncryptionSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ['passwordConfirm'],
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validation = SetupEncryptionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { password } = validation.data

    // Check if user already has encryption key
    const existing = await db.query(
      'SELECT 1 FROM user_encryption_keys WHERE user_id = $1',
      [session.user.id]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Encryption key already set up' },
        { status: 400 }
      )
    }

    // Hash the password and generate salt
    const salt = generateSalt()
    const passwordHash = await hashPassword(password)

    // Store in database
    await db.query(
      `INSERT INTO user_encryption_keys (user_id, password_hash, salt, key_derivation_version, created_at, updated_at)
       VALUES ($1, $2, $3, 1, NOW(), NOW())`,
      [session.user.id, passwordHash, salt]
    )

    // Log the event
    await db.query(
      `INSERT INTO audit_logs (user_id, action, metadata, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [session.user.id, 'setup_encryption', JSON.stringify({ success: true })]
    )

    return NextResponse.json({
      success: true,
      salt,
      message: 'Encryption password set up successfully',
    })
  } catch (error) {
    console.error('Encryption setup error:', error)
    return NextResponse.json(
      { error: 'Failed to set up encryption' },
      { status: 500 }
    )
  }
}

/**
 * Get encryption salt for key derivation
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await db.query(
      'SELECT salt FROM user_encryption_keys WHERE user_id = $1',
      [session.user.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Encryption key not set up' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      salt: result.rows[0].salt,
    })
  } catch (error) {
    console.error('Failed to get encryption salt:', error)
    return NextResponse.json(
      { error: 'Failed to get encryption salt' },
      { status: 500 }
    )
  }
}
