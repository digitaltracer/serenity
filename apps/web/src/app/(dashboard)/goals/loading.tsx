import { PageSkeleton } from '@/components/skeletons/PageSkeleton'

export default function GoalsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-28" />
        <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-32" />
      </div>
      <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
