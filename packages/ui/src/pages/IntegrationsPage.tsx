'use client'

import React from 'react';
import { Card, CardContent } from '../components';
import { Globe } from 'lucide-react';

/**
 * Shared IntegrationsPage component
 */
export const IntegrationsPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Integrations
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Connect with external services and tools
        </p>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">🔗</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Third-Party Integrations
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Connect with Google Calendar, GitHub, and other services to sync your data
            and automate your workflows. Integration features coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
