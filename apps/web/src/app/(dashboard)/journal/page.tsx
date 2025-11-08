'use client'

import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  selectAllEntries,
  selectPinnedEntries,
  addEntry,
  updateEntry,
  togglePin,
  setJournalFilter,
  JournalEntry
} from '@serenity/core'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  JournalEntryCard,
  JournalEntryModal
} from '@serenity/ui'
import { Plus, BookOpen, Search, Pin } from 'lucide-react'

export default function JournalPage() {
  const dispatch = useDispatch()
  const entries = useSelector(selectAllEntries)
  const pinnedEntries = useSelector(selectPinnedEntries)
  const [searchQuery, setSearchQuery] = useState('')
  const [showEntryModal, setShowEntryModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [activeView, setActiveView] = useState<'all' | 'pinned'>('all')

  const thisMonthEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date)
    const today = new Date()
    return entryDate.getMonth() === today.getMonth() &&
           entryDate.getFullYear() === today.getFullYear()
  })

  const totalWords = entries.reduce((sum, entry) => {
    return sum + entry.content.trim().split(/\s+/).length
  }, 0)

  const avgWordsPerEntry = entries.length > 0 ? Math.round(totalWords / entries.length) : 0

  const displayedEntries = activeView === 'pinned' ? pinnedEntries : entries

  const handleCreateEntry = () => {
    setEditingEntry(null)
    setShowEntryModal(true)
  }

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry)
    setShowEntryModal(true)
  }

  const handleSaveEntry = (entryData: Partial<JournalEntry>) => {
    if (editingEntry) {
      dispatch(updateEntry({ ...entryData, id: editingEntry.id }))
    } else {
      dispatch(addEntry({
        title: entryData.title,
        content: entryData.content!,
        date: entryData.date!,
        tags: entryData.tags || [],
        pinned: entryData.pinned || false,
        mood: entryData.mood,
      }))
    }
  }

  const handleTogglePin = (entryId: string) => {
    dispatch(togglePin(entryId))
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    dispatch(setJournalFilter({ search: query }))
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Journal</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Capture thoughts, ideas, and reflections
          </p>
        </div>
        <Button onClick={handleCreateEntry}>
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {entries.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {thisMonthEntries.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Avg Words
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {avgWordsPerEntry}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search entries, tags, or content..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        {/* View Filters */}
        <div className="flex gap-2">
          <Button
            variant={activeView === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveView('all')}
          >
            All Entries
          </Button>
          <Button
            variant={activeView === 'pinned' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveView('pinned')}
          >
            <Pin className="w-4 h-4 mr-2" />
            Pinned
          </Button>
        </div>
      </div>

      {/* Journal Entry Modal */}
      <JournalEntryModal
        isOpen={showEntryModal}
        onClose={() => {
          setShowEntryModal(false)
          setEditingEntry(null)
        }}
        onSave={handleSaveEntry}
        entry={editingEntry}
      />

      {/* Entries List */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Start your journaling journey
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first journal entry to begin capturing your thoughts and experiences.
              </p>
              <Button onClick={handleCreateEntry}>
                <Plus className="w-4 h-4 mr-2" />
                Write Your First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          displayedEntries.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              onClick={handleEditEntry}
              onTogglePin={handleTogglePin}
            />
          ))
        )}
      </div>
    </div>
  )
}
