import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'

// Note: auth() automatically makes this route dynamic
// No force-dynamic needed - auth check provides security for all dashboard routes

export default async function Layout({
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
    <DashboardLayout user={session.user}>
      {children}
    </DashboardLayout>
  )
}
