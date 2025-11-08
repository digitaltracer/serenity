import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (!session.user.hasEncryptionKey) {
    redirect('/auth/setup-encryption')
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <a href="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium">
                Dashboard
              </a>
              <a href="/actionhub" className="inline-flex items-center px-1 pt-1 text-sm font-medium">
                ActionHub
              </a>
              <a href="/journal" className="inline-flex items-center px-1 pt-1 text-sm font-medium">
                Journal
              </a>
              <a href="/goals" className="inline-flex items-center px-1 pt-1 text-sm font-medium">
                Goals
              </a>
              <a href="/analytics" className="inline-flex items-center px-1 pt-1 text-sm font-medium">
                Analytics
              </a>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-4">{session.user.name}</span>
              <form action={async () => {
                'use server'
                const { signOut } = await import('@/lib/auth/config')
                await signOut({ redirectTo: '/' })
              }}>
                <button type="submit" className="text-sm hover:underline">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
