'use client'

import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  RootState,
  selectFilteredTasks,
  selectActiveProjects,
  addTask,
  updateTask,
  toggleTask,
  setTaskFilter,
  Task
} from '@serenity/core'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  TaskCard,
  TaskModal,
  ProgressBar
} from '@serenity/ui'
import { Plus, Search, Filter, CheckSquare } from 'lucide-react'

export default function ActionHubPage() {
  const dispatch = useDispatch()
  const tasks = useSelector(selectFilteredTasks)
  const projects = useSelector(selectActiveProjects)
  const [searchQuery, setSearchQuery] = useState('')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const completedTasks = tasks.filter(task => task.completed)
  const remainingTasks = tasks.filter(task => !task.completed)
  const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0

  const handleCreateTask = () => {
    setEditingTask(null)
    setShowTaskModal(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowTaskModal(true)
  }

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      dispatch(updateTask({ ...taskData, id: editingTask.id }))
    } else {
      dispatch(addTask({
        title: taskData.title!,
        description: taskData.description || '',
        completed: false,
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate,
        projectId: taskData.projectId,
        tags: taskData.tags || [],
      }))
    }
  }

  const handleToggleTask = (taskId: string) => {
    dispatch(toggleTask(taskId))
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    dispatch(setTaskFilter({ search: query }))
  }

  const handleFilterChange = (filter: 'all' | 'pending' | 'completed') => {
    setActiveFilter(filter)
    dispatch(setTaskFilter({
      status: filter === 'all' ? 'all' : filter === 'pending' ? 'pending' : 'completed'
    }))
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            ActionHub
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organize your tasks and boost productivity
          </p>
        </div>
        <Button onClick={handleCreateTask}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {Math.round(completionRate)}%
            </div>
            <ProgressBar value={completionRate} variant="default" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {completedTasks.length} of {tasks.length} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {completedTasks.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tasks finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {remainingTasks.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tasks left to complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search tasks, projects, or tags..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'completed', label: 'Completed' },
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleFilterChange(filter.key as 'all' | 'pending' | 'completed')}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <Button variant="secondary">
          <Filter className="w-4 h-4 mr-2" />
          More Filters
        </Button>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false)
          setEditingTask(null)
        }}
        onSave={handleSaveTask}
        task={editingTask}
        projects={projects}
      />

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <CheckSquare className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No tasks yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get started by creating your first task
              </p>
              <Button onClick={handleCreateTask}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={handleToggleTask}
              onClick={handleEditTask}
            />
          ))
        )}
      </div>
    </div>
  )
}
