'use client'

import React from 'react';
import { Card, CardContent } from '../components';
import { Target } from 'lucide-react';

/**
 * Shared GoalsPage component
 */
export const GoalsPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Goals
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Track your goals and progress
        </p>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Goal Tracking
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Set and track your personal and professional goals
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
