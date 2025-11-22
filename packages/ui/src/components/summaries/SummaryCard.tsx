'use client'

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Download, Trash2 } from 'lucide-react';

export interface Summary {
  id: string;
  title: string;
  content: string;
  summaryType: string;
  generatedAt: string;
  wordCount: number;
  metadata?: {
    tags?: string[];
    [key: string]: unknown;
  };
}

export interface SummaryCardProps {
  summary: Summary;
  onExport?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  summary,
  onExport,
  onDelete,
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{summary.title}</CardTitle>
            <div className="flex gap-2 items-center text-sm text-muted-foreground">
              <Badge variant="outline">{summary.summaryType}</Badge>
              <span>•</span>
              <span>{new Date(summary.generatedAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{summary.wordCount} words</span>
            </div>
          </div>
          <div className="flex gap-2">
            {onExport && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExport(summary.id)}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(summary.id)}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full overflow-y-auto">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: summary.content.replace(/\n/g, '<br />'),
              }}
            />
          </div>
        </div>

        {/* Tags */}
        {summary.metadata?.tags && summary.metadata.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-border/50">
            {summary.metadata.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
