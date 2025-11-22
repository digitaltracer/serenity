import { SettingsSkeleton } from '@/components/skeletons/PageSkeleton'

export default function SettingsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-32" />
      <SettingsSkeleton />
    </div>
  )
}
