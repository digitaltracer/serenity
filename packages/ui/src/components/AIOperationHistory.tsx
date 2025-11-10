import React, { useState, useMemo } from 'react';
import { cn } from '../utils/cn';
import { Filter, ChevronDown, History } from 'lucide-react';
import { Button } from './Button';
import { CustomSelect } from './CustomSelect';

interface AIUsageEntry {
  id: string;
  timestamp: string;
  provider: 'openai' | 'gemini' | 'anthropic';
  operation: 'analyze' | 'recap' | 'quickadd';
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIOperationHistoryProps {
  usage: AIUsageEntry[];
  pageSize?: number;
}

const providerLabels: Record<string, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  anthropic: 'Anthropic Claude',
};

const operationLabels: Record<string, string> = {
  analyze: 'AI Insights',
  recap: 'AI Recap',
  quickadd: 'Quick Add',
};

const providerColors: Record<string, string> = {
  openai: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  gemini: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  anthropic: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
};

export const AIOperationHistory: React.FC<AIOperationHistoryProps> = ({
  usage,
  pageSize = 50,
}) => {
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [operationFilter, setOperationFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(0);

  // Filter and sort data
  const filteredUsage = useMemo(() => {
    let filtered = [...usage];

    // Provider filter
    if (providerFilter !== 'all') {
      filtered = filtered.filter((entry) => entry.provider === providerFilter);
    }

    // Operation filter
    if (operationFilter !== 'all') {
      filtered = filtered.filter((entry) => entry.operation === operationFilter);
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (dateRangeFilter) {
        case '7d':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          cutoffDate.setDate(now.getDate() - 90);
          break;
      }

      filtered = filtered.filter((entry) => new Date(entry.timestamp) >= cutoffDate);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return filtered;
  }, [usage, providerFilter, operationFilter, dateRangeFilter]);

  // Pagination
  const paginatedUsage = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredUsage.slice(start, start + pageSize);
  }, [filteredUsage, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredUsage.length / pageSize);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getOperationDescription = (operation: string) => {
    switch (operation) {
      case 'analyze':
        return 'Generated insights from tasks and journal entries';
      case 'recap':
        return 'Created weekly/monthly recap summary';
      case 'quickadd':
        return 'AI-assisted quick task creation';
      default:
        return 'AI operation';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Operation History</h3>
          <span className="text-sm text-muted-foreground">
            ({filteredUsage.length} {filteredUsage.length === 1 ? 'entry' : 'entries'})
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />

          {/* Provider Filter */}
          <div className="min-w-[160px]">
            <CustomSelect
              value={providerFilter}
              onChange={(value) => {
                setProviderFilter(value);
                setCurrentPage(0);
              }}
              options={[
                { value: 'all', label: 'All Providers' },
                { value: 'openai', label: 'OpenAI' },
                { value: 'gemini', label: 'Google Gemini' },
                { value: 'anthropic', label: 'Anthropic Claude' },
              ]}
              placeholder="All Providers"
            />
          </div>

          {/* Operation Filter */}
          <div className="min-w-[160px]">
            <CustomSelect
              value={operationFilter}
              onChange={(value) => {
                setOperationFilter(value);
                setCurrentPage(0);
              }}
              options={[
                { value: 'all', label: 'All Operations' },
                { value: 'analyze', label: 'AI Insights' },
                { value: 'recap', label: 'AI Recap' },
                { value: 'quickadd', label: 'Quick Add' },
              ]}
              placeholder="All Operations"
            />
          </div>

          {/* Date Range Filter */}
          <div className="min-w-[150px]">
            <CustomSelect
              value={dateRangeFilter}
              onChange={(value) => {
                setDateRangeFilter(value);
                setCurrentPage(0);
              }}
              options={[
                { value: 'all', label: 'All Time' },
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: '90d', label: 'Last 90 Days' },
              ]}
              placeholder="All Time"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {paginatedUsage.length > 0 ? (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-accent/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Prompt
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Completion
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {paginatedUsage.map((entry) => (
                  <tr key={entry.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          providerColors[entry.provider]
                        )}
                      >
                        {providerLabels[entry.provider]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-foreground">
                        {operationLabels[entry.operation]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getOperationDescription(entry.operation)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                      {formatNumber(entry.promptTokens)}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                      {formatNumber(entry.completionTokens)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground text-right font-mono">
                      {formatNumber(entry.totalTokens)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center border border-dashed border-border rounded-lg">
          <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No operations found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {usage.length === 0
              ? 'Token usage will appear here after you use AI features'
              : 'Try adjusting your filters'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {currentPage * pageSize + 1} to{' '}
            {Math.min((currentPage + 1) * pageSize, filteredUsage.length)} of{' '}
            {filteredUsage.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
