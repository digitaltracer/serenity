import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db/postgres'
import { EncryptionSetup } from '@/components/auth/EncryptionSetup'

export default async function SetupEncryptionPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  // Check if user already has encryption set up
  const result = await db.query(
    'SELECT 1 FROM user_encryption_keys WHERE user_id = $1',
    [session.user.id]
  )

  if (result.rows.length > 0) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <EncryptionSetup />
    </div>
  )
}
