import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {session.user.name}!</h1>
          <p className="text-muted-foreground mt-2">
            Your productivity dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border border-border rounded-lg">
            <div className="text-4xl mb-2">📝</div>
            <h3 className="font-semibold text-lg">Tasks</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your tasks and projects
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Coming in Phase 3
            </p>
          </div>

          <div className="p-6 border border-border rounded-lg">
            <div className="text-4xl mb-2">📔</div>
            <h3 className="font-semibold text-lg">Journal</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Daily journaling and reflections
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Coming in Phase 3
            </p>
          </div>

          <div className="p-6 border border-border rounded-lg">
            <div className="text-4xl mb-2">🎯</div>
            <h3 className="font-semibold text-lg">Goals</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Track your goals and progress
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Coming in Phase 3
            </p>
          </div>
        </div>

        <div className="p-6 border border-border rounded-lg bg-muted/30">
          <h3 className="font-semibold mb-4">Phase 2: Authentication & Encryption ✅</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>OAuth authentication (Google, GitHub, Microsoft)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>End-to-end encryption setup</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Database schema extensions</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Session management</span>
            </li>
          </ul>
        </div>

        <div className="flex justify-center">
          <form action={async () => {
            'use server'
            const { signOut } = await import('@/lib/auth/config')
            await signOut({ redirectTo: '/' })
          }}>
            <button
              type="submit"
              className="px-6 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
