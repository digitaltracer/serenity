import React, { useState, useEffect } from 'react';
import { JournalEntry } from '@serenity/core';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { CustomSelect } from './CustomSelect';
import { RichTextEditor } from './RichTextEditor';
import { TagInput } from './TagInput';
import { DatePicker } from './DatePicker';
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
    date: new Date() as Date,
    tags: [] as string[],
    pinned: false,
    mood: '' as JournalEntry['mood'] | '',
  });


  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title || '',
        content: entry.content,
        date: new Date(entry.date),
        tags: entry.tags,
        pinned: entry.pinned,
        mood: entry.mood || '',
      });
    } else {
      setFormData({
        title: '',
        content: '',
        date: new Date(),
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
      date: formData.date,
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
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        {/* Title and Date */}
        <div className="space-y-3">
          <Input
            label="Title (optional)"
            placeholder="Give your entry a title..."
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />
          
          <DatePicker
            label="Date"
            value={formData.date}
            onChange={(date) => setFormData(prev => ({ ...prev, date: date || new Date() }))}
            required
            className="text-sm"
          />
        </div>

        {/* Content Editor */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Content
          </label>
          <RichTextEditor
            value={formData.content}
            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
            placeholder="Write your thoughts..."
            minHeight={150}
          />
        </div>

        {/* Mood and Pin */}
        <div className="space-y-3">
          <CustomSelect
            label="Mood"
            value={formData.mood}
            onChange={(value) => setFormData(prev => ({ ...prev, mood: value as JournalEntry['mood'] }))}
            options={moodOptions}
            className="text-sm"
          />
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Options
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={formData.pinned ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, pinned: !prev.pinned }))}
                className="text-xs h-8 rounded-lg"
              >
                <Pin className="w-3 h-3 mr-1" />
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
          className="text-sm"
        />

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-gray-200/30 dark:border-gray-700/20">
          <Button type="submit" className="flex-1 rounded-lg text-sm h-9">
            {entry ? 'Update Entry' : 'Save Entry'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="rounded-lg text-sm h-9">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export { JournalEntryModal };