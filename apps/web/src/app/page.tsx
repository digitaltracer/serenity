import { auth } from '@/lib/auth/config'
import Link from 'next/link'

export default async function LandingPage() {
  const session = await auth()

  // Determine the "Get Started" link based on auth status
  const getStartedHref = session?.user
    ? (session.user.hasEncryptionKey ? '/home' : '/auth/setup-encryption')
    : '/login'

  const getStartedText = session?.user ? 'Go to Dashboard' : 'Get Started'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Serenity Notes
        </h1>
        <p className="text-xl text-muted-foreground">
          Your productivity companion with tasks, journal, and AI insights
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link
            href={getStartedHref}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            {getStartedText}
          </Link>
          <a
            href="https://github.com/your-username/serenity"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
          >
            Learn More
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
          <div className="p-6 border border-border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">📝 Task Management</h3>
            <p className="text-sm text-muted-foreground">
              Organize your tasks with projects, priorities, and smart scheduling
            </p>
          </div>
          <div className="p-6 border border-border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">📔 Journal</h3>
            <p className="text-sm text-muted-foreground">
              Daily journaling with mood tracking and rich text formatting
            </p>
          </div>
          <div className="p-6 border border-border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">🤖 AI Insights</h3>
            <p className="text-sm text-muted-foreground">
              Get personalized productivity insights powered by AI
            </p>
          </div>
        </div>
        <div className="mt-12 text-sm text-muted-foreground">
          <p>
            🔒 End-to-end encrypted • 🔄 Sync with desktop • 🌐 Self-hosted
          </p>
        </div>
      </div>
    </div>
  )
}
