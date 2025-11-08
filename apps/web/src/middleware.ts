/**
 * Next.js middleware for authentication and route protection
 */

export { auth as middleware } from '@/lib/auth/config'

// Note: Using export directly to avoid Edge Runtime issues with pg module

/*
import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/api/auth']

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // Allow access to public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  if (!req.auth) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check if user has set up encryption (except for the setup page)
  if (pathname !== '/auth/setup-encryption' && !req.auth.user?.hasEncryptionKey) {
    return NextResponse.redirect(new URL('/auth/setup-encryption', req.url))
  }

  return NextResponse.next()
})
*/

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
