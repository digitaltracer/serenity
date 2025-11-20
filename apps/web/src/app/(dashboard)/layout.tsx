import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'

export const dynamic = 'force-dynamic'

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
