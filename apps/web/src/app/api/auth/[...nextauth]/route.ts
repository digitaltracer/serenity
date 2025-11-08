/**
 * NextAuth API route handler
 * Handles all OAuth authentication flows
 */

import { handlers } from '@/lib/auth/config'

export const { GET, POST } = handlers
