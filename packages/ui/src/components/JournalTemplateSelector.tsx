import React from 'react';
import { journalTemplates, JournalTemplate } from '@serenity/core';
import { Modal } from './Modal';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { cn } from '../utils/cn';
import { 
  BookOpen, 
  Heart, 
  Target, 
  Users, 
  Calendar, 
  Sparkles, 
  Moon, 
  Smile 
} from 'lucide-react';

export interface JournalTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: JournalTemplate) => void;
}

const templateIcons: Record<string, React.ReactNode> = {
  'daily-reflection': <BookOpen className="w-6 h-6" />,
  'gratitude-journal': <Heart className="w-6 h-6" />,
  'goal-tracking': <Target className="w-6 h-6" />,
  'meeting-notes': <Users className="w-6 h-6" />,
  'weekly-review': <Calendar className="w-6 h-6" />,
  'creative-writing': <Sparkles className="w-6 h-6" />,
  'dream-journal': <Moon className="w-6 h-6" />,
  'mood-tracker': <Smile className="w-6 h-6" />,
};

const JournalTemplateSelector: React.FC<JournalTemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const handleTemplateSelect = (template: JournalTemplate) => {
    onSelect(template);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose a Template"
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Start your journal entry with a pre-defined template to guide your writing.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {journalTemplates.map((template) => (
            <Card
              key={template.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md hover:border-primary',
                'bg-card hover:bg-accent/50'
              )}
              onClick={() => handleTemplateSelect(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    {templateIcons[template.id] || <BookOpen className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold mb-1">
                      {template.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-3">
                <div className="flex flex-wrap gap-1.5 items-center">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-xs rounded-md bg-secondary/80 text-secondary-foreground font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end pt-3 border-t border-border mt-4">
          <Button variant="secondary" onClick={onClose} className="rounded-lg">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export { JournalTemplateSelector };

