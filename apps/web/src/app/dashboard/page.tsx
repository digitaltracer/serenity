import { redirect } from 'next/navigation'

export default function DashboardPage() {
  // Redirect to actionhub as the main dashboard
  redirect('/actionhub')
}
