'use client'

import React from 'react';
import { Card, CardContent } from '../Card';
import { Sparkles } from 'lucide-react';

export interface EmptySummariesCardProps {
  message?: string;
}

export const EmptySummariesCard: React.FC<EmptySummariesCardProps> = ({
  message = 'Generate your first summary using the form above',
}) => {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No summaries yet</h3>
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
};
