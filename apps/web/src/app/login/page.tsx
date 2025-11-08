import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { OAuthButtons } from '@/components/auth/OAuthButtons'

export default async function LoginPage() {
  // If user is already signed in, redirect to encryption setup or dashboard
  const session = await auth()
  if (session?.user) {
    if (session.user.hasEncryptionKey) {
      redirect('/dashboard')
    } else {
      redirect('/auth/setup-encryption')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-3xl font-bold">Welcome to Serenity</h2>
          <p className="mt-2 text-muted-foreground">
            Sign in to access your productivity workspace
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <OAuthButtons />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">
                Secure & Private
              </span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>End-to-end encrypted</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Self-hosted</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
