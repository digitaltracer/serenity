'use client'

import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectAllTasks, selectAllEntries } from '@serenity/core'
import { Card, CardHeader, CardTitle, CardContent, ProgressBar } from '@serenity/ui'
import { BarChart3, TrendingUp, Calendar, Target, Zap, Clock, BookOpen } from 'lucide-react'

const calculateStreak = (completedTasks: any[]) => {
  if (completedTasks.length === 0) return 0

  const today = new Date()
  let streak = 0
  let currentDate = new Date(today)

  while (streak < 30) { // Limit to prevent infinite loop
    const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

    const hasTasksThisDay = completedTasks.some(task => {
      const taskDate = task.updatedAt ? new Date(task.updatedAt) : new Date()
      return taskDate >= dayStart && taskDate < dayEnd
    })

    if (hasTasksThisDay) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

const getImprovementSuggestion = (allTasks: any[], completedTasks: any[]) => {
  const pendingTasks = allTasks.filter(task => !task.completed)
  const overdueTasks = pendingTasks.filter(task => {
    if (!task.dueDate) return false
    const dueDate = new Date(task.dueDate)
    return dueDate < new Date()
  })

  if (overdueTasks.length > 0) {
    return `You have ${overdueTasks.length} overdue tasks - consider prioritizing them`
  }

  const largeTasksWithoutSubtasks = allTasks.filter(task =>
    !task.completed &&
    task.description &&
    task.description.length > 100 &&
    (!task.subtasks || task.subtasks.length === 0)
  )

  if (largeTasksWithoutSubtasks.length > 0) {
    return `Consider breaking down ${largeTasksWithoutSubtasks.length} large tasks into subtasks`
  }

  if (completedTasks.length > 0) {
    return 'Great job! Keep up the momentum'
  }

  return 'Start by creating your first task'
}

export default function AnalyticsPage() {
  const tasks = useSelector(selectAllTasks)
  const journalEntries = useSelector(selectAllEntries)

  const analyticsData = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Task analytics
    const completedTasks = tasks.filter(task => task.completed)
    const tasksCompletedToday = completedTasks.filter(task => {
      const taskDate = task.updatedAt ? new Date(task.updatedAt) : new Date()
      return taskDate >= today
    }).length
    const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0

    // Calculate streak (simplified - consecutive days with at least one completed task)
    const activeStreak = calculateStreak(completedTasks)

    // Journal analytics
    const journalEntriesThisMonth = journalEntries.filter(entry => {
      const entryDate = entry.date ? new Date(entry.date) : new Date()
      return entryDate >= thisMonth
    }).length
    const avgWordsPerEntry = journalEntries.length > 0
      ? Math.round(journalEntries.reduce((sum, entry) => sum + entry.content.split(' ').length, 0) / journalEntries.length)
      : 0

    // Weekly insights
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const tasksByDay = completedTasks.reduce((acc, task) => {
      const taskDate = task.updatedAt ? new Date(task.updatedAt) : new Date()
      const day = dayOfWeek[taskDate.getDay()]
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const mostProductiveDay = Object.entries(tasksByDay).sort(([,a], [,b]) => b - a)[0]?.[0] || 'No data'

    const tasksByProject = tasks.reduce((acc, task) => {
      const project = task.projectId || 'No Project'
      acc[project] = (acc[project] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const topProject = Object.entries(tasksByProject).sort(([,a], [,b]) => b - a)[0]?.[0] || 'No data'

    const improvementArea = getImprovementSuggestion(tasks, completedTasks)

    return {
      tasksCompleted: completedTasks.length,
      tasksCompletedToday,
      completionRate,
      activeStreak,
      journalEntries: journalEntries.length,
      journalEntriesThisMonth,
      avgWordsPerEntry,
      mostProductiveDay,
      topProject,
      improvementArea
    }
  }, [tasks, journalEntries])

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your productivity and progress over time
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Tasks Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {analyticsData.tasksCompleted}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              +8% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Journal Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {analyticsData.journalEntries}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              +2 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {analyticsData.completionRate}%
            </div>
            <ProgressBar value={analyticsData.completionRate} variant="success" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Active Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {analyticsData.activeStreak} days
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              2 days to best record
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Task Completion Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Productivity Visualization</p>
                <p className="text-xs">Track your task completion trends over time with interactive charts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-28 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="text-sm">Task Distribution</div>
                  <div className="text-xs">Visualize how your tasks are distributed across projects</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-28 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="text-sm">Productivity Hours</div>
                  <div className="text-xs">Identify your most productive hours of the day</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Weekly Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Most Productive Day
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {analyticsData.mostProductiveDay}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Top Project
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {analyticsData.topProject}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Improvement Area
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {analyticsData.improvementArea}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
