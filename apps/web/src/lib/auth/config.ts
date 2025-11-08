/**
 * NextAuth configuration
 * OAuth providers: Google, GitHub, Microsoft
 */

import NextAuth, { DefaultSession } from 'next-auth'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import AzureAD from 'next-auth/providers/azure-ad'
import { PostgresAdapter } from './adapter'
import { db } from '../db/postgres'

// Extend the built-in session type
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      hasEncryptionKey: boolean
    } & DefaultSession['user']
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    AzureAD({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) {
        return false
      }

      // Update provider-specific ID in users table
      if (account) {
        const providerIdColumn = `${account.provider}_id`
        const validProviders = ['google', 'github', 'microsoft']

        if (validProviders.includes(account.provider)) {
          await db.query(
            `UPDATE users
             SET ${providerIdColumn} = $1,
                 auth_provider = $2,
                 avatar_url = COALESCE(avatar_url, $3),
                 last_login = NOW()
             WHERE id = $4`,
            [account.providerAccountId, account.provider, user.image, user.id]
          )
        }
      }

      return true
    },

    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id

        // Check if user has set up encryption key
        const result = await db.query(
          'SELECT 1 FROM user_encryption_keys WHERE user_id = $1',
          [user.id]
        )
        session.user.hasEncryptionKey = result.rows.length > 0
      }

      return session
    },
  },
  events: {
    async signIn({ user }) {
      // Log sign-in event
      await db.query(
        `INSERT INTO audit_logs (user_id, action, created_at)
         VALUES ($1, $2, NOW())`,
        [user.id, 'login']
      )
    },
  },
  debug: process.env.NODE_ENV === 'development',
})
