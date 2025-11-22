import { PageSkeleton } from '@/components/skeletons/PageSkeleton'

export default function IntegrationsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-44" />
      <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
