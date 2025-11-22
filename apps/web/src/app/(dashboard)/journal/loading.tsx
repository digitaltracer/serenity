import { JournalSkeleton } from '@/components/skeletons/PageSkeleton'

export default function JournalLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-32" />
        <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-36" />
      </div>
      <JournalSkeleton />
    </div>
  )
}
