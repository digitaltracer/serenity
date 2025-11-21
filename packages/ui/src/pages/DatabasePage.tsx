'use client'

import React from 'react';
import { Card, CardContent } from '../components';
import { Database } from 'lucide-react';

/**
 * Shared DatabasePage component
 */
export const DatabasePage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-6 h-6 text-green-600 dark:text-green-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Database
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Database configuration and management
        </p>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">🗄️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Database Management
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Configure your database connection and manage your data storage.
            Connect to PostgreSQL or use local SQLite storage for offline access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
