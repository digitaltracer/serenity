import React, { useState, useEffect } from 'react';
import { JournalEntry } from '@serenity/core';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { RichTextEditor } from './RichTextEditor';
import { TagInput } from './TagInput';
import { Pin, Calendar } from 'lucide-react';

export interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Partial<JournalEntry>) => void;
  entry?: JournalEntry | null;
}

const JournalEntryModal: React.FC<JournalEntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  entry,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: '',
    tags: [] as string[],
    pinned: false,
    mood: '' as JournalEntry['mood'] | '',
  });


  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title || '',
        content: entry.content,
        date: new Date(entry.date).toISOString().split('T')[0],
        tags: entry.tags,
        pinned: entry.pinned,
        mood: entry.mood || '',
      });
    } else {
      setFormData({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        tags: [],
        pinned: false,
        mood: '',
      });
    }
  }, [entry, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) return;

    const entryData: Partial<JournalEntry> = {
      ...formData,
      title: formData.title || undefined,
      date: new Date(formData.date),
      mood: formData.mood || undefined,
    };

    if (entry) {
      entryData.id = entry.id;
    }

    onSave(entryData);
    onClose();
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData(prev => ({
      ...prev,
      tags,
    }));
  };

  const moodOptions = [
    { value: '', label: 'No mood selected' },
    { value: 'happy', label: '😊 Happy' },
    { value: 'excited', label: '🎉 Excited' },
    { value: 'neutral', label: '😐 Neutral' },
    { value: 'sad', label: '😢 Sad' },
    { value: 'stressed', label: '😰 Stressed' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry ? 'Edit Journal Entry' : 'New Journal Entry'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title and Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Title (optional)"
            placeholder="Give your entry a title..."
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />
          
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            required
          />
        </div>

        {/* Content Editor */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Content
          </label>
          <RichTextEditor
            value={formData.content}
            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
            placeholder="Write your thoughts..."
            minHeight={300}
          />
        </div>

        {/* Mood and Pin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Mood"
            value={formData.mood}
            onChange={(e) => setFormData(prev => ({ ...prev, mood: e.target.value as JournalEntry['mood'] }))}
            options={moodOptions}
          />
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Options
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={formData.pinned ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, pinned: !prev.pinned }))}
              >
                <Pin className="w-4 h-4 mr-2" />
                {formData.pinned ? 'Pinned' : 'Pin Entry'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tags */}
        <TagInput
          label="Tags"
          value={formData.tags}
          onChange={handleTagsChange}
          placeholder="Add a tag..."
          maxTags={8}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            {entry ? 'Update Entry' : 'Save Entry'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export { JournalEntryModal };