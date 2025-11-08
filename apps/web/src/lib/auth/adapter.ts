/**
 * PostgreSQL adapter for NextAuth
 * Custom adapter to work with our existing database schema
 */

import { Adapter, AdapterAccount, AdapterSession, AdapterUser } from 'next-auth/adapters'
import { db } from '../db/postgres'
import { v4 as uuidv4 } from 'uuid'

export function PostgresAdapter(): Adapter {
  return {
    async createUser(user): Promise<AdapterUser> {
      const id = uuidv4()
      const result = await db.query(
        `INSERT INTO users (id, name, email, email_verified, avatar_url, preferences, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [
          id,
          user.name,
          user.email,
          user.emailVerified || false,
          user.image,
          JSON.stringify({
            theme: 'system',
            compactMode: false,
            notifications: {
              enabled: true,
              sounds: true,
              taskReminders: true,
              dailyReview: false,
            },
            language: 'en',
            dateFormat: 'MM/dd/yyyy',
            timeFormat: '12h',
          }),
        ]
      )

      const dbUser = result.rows[0]
      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        emailVerified: dbUser.email_verified ? new Date(dbUser.email_verified) : null,
        image: dbUser.avatar_url,
      }
    },

    async getUser(id): Promise<AdapterUser | null> {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [id])
      if (result.rows.length === 0) return null

      const user = result.rows[0]
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.email_verified ? new Date(user.email_verified) : null,
        image: user.avatar_url,
      }
    },

    async getUserByEmail(email): Promise<AdapterUser | null> {
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email])
      if (result.rows.length === 0) return null

      const user = result.rows[0]
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.email_verified ? new Date(user.email_verified) : null,
        image: user.avatar_url,
      }
    },

    async getUserByAccount({ providerAccountId, provider }): Promise<AdapterUser | null> {
      const result = await db.query(
        `SELECT u.* FROM users u
         JOIN accounts a ON u.id = a.user_id
         WHERE a.provider = $1 AND a.provider_account_id = $2`,
        [provider, providerAccountId]
      )

      if (result.rows.length === 0) return null

      const user = result.rows[0]
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.email_verified ? new Date(user.email_verified) : null,
        image: user.avatar_url,
      }
    },

    async updateUser(user): Promise<AdapterUser> {
      const result = await db.query(
        `UPDATE users
         SET name = $2, email = $3, email_verified = $4, avatar_url = $5, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [user.id, user.name, user.email, user.emailVerified, user.image]
      )

      const dbUser = result.rows[0]
      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        emailVerified: dbUser.email_verified ? new Date(dbUser.email_verified) : null,
        image: dbUser.avatar_url,
      }
    },

    async deleteUser(userId): Promise<void> {
      await db.query('DELETE FROM users WHERE id = $1', [userId])
    },

    async linkAccount(account): Promise<AdapterAccount | null | undefined> {
      const id = uuidv4()
      await db.query(
        `INSERT INTO accounts (
          id, user_id, type, provider, provider_account_id,
          refresh_token, access_token, expires_at, token_type,
          scope, id_token, session_state, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
        [
          id,
          account.userId,
          account.type,
          account.provider,
          account.providerAccountId,
          account.refresh_token,
          account.access_token,
          account.expires_at,
          account.token_type,
          account.scope,
          account.id_token,
          account.session_state,
        ]
      )

      return account as AdapterAccount
    },

    async unlinkAccount({ providerAccountId, provider }): Promise<void> {
      await db.query(
        'DELETE FROM accounts WHERE provider = $1 AND provider_account_id = $2',
        [provider, providerAccountId]
      )
    },

    async createSession(session): Promise<AdapterSession> {
      const id = uuidv4()
      await db.query(
        `INSERT INTO sessions (id, session_token, user_id, expires, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [id, session.sessionToken, session.userId, session.expires]
      )

      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      }
    },

    async getSessionAndUser(sessionToken): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      const result = await db.query(
        `SELECT s.*, u.* FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.session_token = $1`,
        [sessionToken]
      )

      if (result.rows.length === 0) return null

      const row = result.rows[0]
      return {
        session: {
          sessionToken: row.session_token,
          userId: row.user_id,
          expires: new Date(row.expires),
        },
        user: {
          id: row.id,
          name: row.name,
          email: row.email,
          emailVerified: row.email_verified ? new Date(row.email_verified) : null,
          image: row.avatar_url,
        },
      }
    },

    async updateSession(session): Promise<AdapterSession | null | undefined> {
      const result = await db.query(
        `UPDATE sessions
         SET expires = $2
         WHERE session_token = $1
         RETURNING *`,
        [session.sessionToken, session.expires]
      )

      if (result.rows.length === 0) return null

      const row = result.rows[0]
      return {
        sessionToken: row.session_token,
        userId: row.user_id,
        expires: new Date(row.expires),
      }
    },

    async deleteSession(sessionToken): Promise<void> {
      await db.query('DELETE FROM sessions WHERE session_token = $1', [sessionToken])
    },

    async createVerificationToken(token): Promise<any> {
      await db.query(
        `INSERT INTO verification_tokens (identifier, token, expires)
         VALUES ($1, $2, $3)`,
        [token.identifier, token.token, token.expires]
      )

      return token
    },

    async useVerificationToken({ identifier, token }): Promise<any> {
      const result = await db.query(
        `DELETE FROM verification_tokens
         WHERE identifier = $1 AND token = $2
         RETURNING *`,
        [identifier, token]
      )

      if (result.rows.length === 0) return null

      const row = result.rows[0]
      return {
        identifier: row.identifier,
        token: row.token,
        expires: new Date(row.expires),
      }
    },
  }
}
