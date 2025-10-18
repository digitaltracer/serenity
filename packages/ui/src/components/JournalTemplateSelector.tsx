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
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Start your journal entry with a pre-defined template to guide your writing.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2">
          {journalTemplates.map((template) => (
            <Card
              key={template.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md hover:border-primary',
                'bg-card hover:bg-accent/50'
              )}
              onClick={() => handleTemplateSelect(template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {templateIcons[template.id] || <BookOpen className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold mb-1">
                      {template.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end pt-3 border-t border-border">
          <Button variant="secondary" onClick={onClose} className="rounded-lg">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export { JournalTemplateSelector };

