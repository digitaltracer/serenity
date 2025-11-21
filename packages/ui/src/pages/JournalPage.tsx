'use client'

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectAllEntries,
  selectPinnedEntries,
  selectCompactMode,
  addEntry,
  updateEntry,
  deleteEntry,
  togglePin,
  setJournalFilter,
  updateGoalsProgress,
  selectAllTasks,
  selectAllProjects,
  JournalEntry
} from '@serenity/core';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { JournalEntryCard } from '../components/JournalEntryCard';
import { SelectableItem } from '../components/SelectableItem';
import { BulkOperationsToolbar } from '../components/BulkOperationsToolbar';
import { BulkActionsButton } from '../components/BulkActionsButton';
import { JournalEntryModal } from '../components/JournalEntryModal';
import { JournalTemplateSelector } from '../components/JournalTemplateSelector';
import { cn } from '../utils/cn';
import { JournalTemplate } from '@serenity/core';
import { Plus, BookOpen, Search, Pin, FileText } from 'lucide-react';

export const JournalPage: React.FC = () => {
  const dispatch = useDispatch();
  const entries = useSelector(selectAllEntries);
  const pinnedEntries = useSelector(selectPinnedEntries);
  const tasks = useSelector(selectAllTasks);
  const projects = useSelector(selectAllProjects);
  const compactMode = useSelector(selectCompactMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [activeView, setActiveView] = useState<'all' | 'pinned'>('all');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{ content: string; tags: string[] } | null>(null);

  // Auto-update goal progress when journal entries change
  useEffect(() => {
    dispatch(updateGoalsProgress({ tasks, journalEntries: entries, projects }));
  }, [dispatch, tasks, entries, projects]);

  const thisMonthEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    const today = new Date();
    return entryDate.getMonth() === today.getMonth() && 
           entryDate.getFullYear() === today.getFullYear();
  });

  const totalWords = entries.reduce((sum, entry) => {
    return sum + entry.content.trim().split(/\s+/).length;
  }, 0);

  const avgWordsPerEntry = entries.length > 0 ? Math.round(totalWords / entries.length) : 0;

  // Filter entries based on search query and view
  const filteredEntries = activeView === 'pinned' ? pinnedEntries : entries;
  const displayedEntries = filteredEntries.filter(entry => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      entry.title?.toLowerCase().includes(query) ||
      entry.content.toLowerCase().includes(query) ||
      entry.tags.some(tag => tag.toLowerCase().includes(query)) ||
      entry.mood?.toLowerCase().includes(query)
    );
  });

  const handleCreateEntry = () => {
    setEditingEntry(null);
    setSelectedTemplate(null);
    setShowEntryModal(true);
  };

  const handleTemplateSelect = (template: JournalTemplate) => {
    setEditingEntry(null);
    setSelectedTemplate({
      content: template.content,
      tags: template.tags,
    });
    setShowEntryModal(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowEntryModal(true);
  };

  const handleSaveEntry = (entryData: Partial<JournalEntry>) => {
    if (editingEntry) {
      dispatch(updateEntry({ ...entryData, id: editingEntry.id }));
    } else {
      dispatch(addEntry({
        title: entryData.title,
        content: entryData.content!,
        date: entryData.date!,
        tags: entryData.tags || [],
        pinned: entryData.pinned || false,
        mood: entryData.mood,
      }));
    }
  };

  const handleTogglePin = (entryId: string) => {
    dispatch(togglePin(entryId));
  };

  const handleDeleteEntry = (entryId: string) => {
    dispatch(deleteEntry(entryId));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    dispatch(setJournalFilter({ search: query }));
  };

  return (
    <div className="flex-1 h-full bg-background">
      {/* Header */}
      <div className="bg-card text-card-foreground border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Journal
            </h1>
            <p className="text-sm text-muted-foreground">
              Capture thoughts, ideas, and reflections
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <BulkActionsButton variant="icon" />
            <Button 
              variant="secondary" 
              onClick={() => setShowTemplateSelector(true)} 
              className="rounded-xl gap-2"
            >
              <FileText className="w-4 h-4" />
              Templates
            </Button>
            <Button onClick={handleCreateEntry} className="rounded-xl gap-2">
              <Plus className="w-4 h-4" />
              New Entry
            </Button>
          </div>
        </div>
      </div>

      <div className={cn(
        'flex-1 overflow-auto',
        {
          'p-6': !compactMode,
          'p-4': compactMode,
        }
      )}>

      {/* Statistics */}
      <div className={cn(
        'grid grid-cols-1 md:grid-cols-3',
        {
          'gap-6 mb-6': !compactMode,
          'gap-4 mb-4': compactMode,
        }
      )}>
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
            className="rounded-xl"
          />
        </div>
        
        {/* View Filters */}
        <div className="flex gap-2">
          <Button
            variant={activeView === 'all' ? 'primary' : 'secondary'}
            onClick={() => setActiveView('all')}
            className="rounded-xl"
          >
            All Entries
          </Button>
          <Button
            variant={activeView === 'pinned' ? 'primary' : 'secondary'}
            onClick={() => setActiveView('pinned')}
            className="rounded-xl"
          >
            <Pin className="w-4 h-4 mr-2" />
            Pinned
          </Button>
        </div>
      </div>

      {/* Template Selector Modal */}
      <JournalTemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={handleTemplateSelect}
      />

      {/* Journal Entry Modal */}
      <JournalEntryModal
        isOpen={showEntryModal}
        onClose={() => {
          setShowEntryModal(false);
          setEditingEntry(null);
          setSelectedTemplate(null);
        }}
        onSave={handleSaveEntry}
        entry={editingEntry}
        templateContent={selectedTemplate?.content}
        templateTags={selectedTemplate?.tags}
      />

      {/* Entries List */}
      <div className={cn(
        {
          'space-y-4': !compactMode,
          'space-y-2': compactMode,
        }
      )}>
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
              <Button onClick={handleCreateEntry} className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Write Your First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          displayedEntries.map((entry) => (
            <SelectableItem key={entry.id} id={entry.id} type="journalEntries">
              <JournalEntryCard
                entry={entry}
                onClick={handleEditEntry}
                onTogglePin={handleTogglePin}
                onDelete={handleDeleteEntry}
              />
            </SelectableItem>
          ))
        )}
      </div>
      </div>
      
      {/* Bulk Operations Toolbar */}
      <BulkOperationsToolbar />
    </div>
  );
};
