import React, { useMemo } from 'react';
import { cn } from '../utils/cn';
import { Brain, TrendingUp, Activity, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface AIUsageEntry {
  id: string;
  timestamp: string;
  provider: 'openai' | 'gemini' | 'anthropic';
  operation: 'analyze' | 'recap' | 'quickadd';
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIUsageSummaryProps {
  usage: AIUsageEntry[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

interface ProviderStats {
  provider: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  operationCount: number;
  lastUsed?: string;
}

export const AIUsageSummary: React.FC<AIUsageSummaryProps> = ({
  usage,
  onRefresh,
  isRefreshing = false,
}) => {
  const providerStats = useMemo(() => {
    const stats: Record<string, ProviderStats> = {
      openai: {
        provider: 'OpenAI',
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        operationCount: 0,
      },
      gemini: {
        provider: 'Google Gemini',
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        operationCount: 0,
      },
      anthropic: {
        provider: 'Anthropic Claude',
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        operationCount: 0,
      },
    };

    usage.forEach((entry) => {
      const stat = stats[entry.provider];
      if (stat) {
        stat.totalTokens += entry.totalTokens;
        stat.promptTokens += entry.promptTokens;
        stat.completionTokens += entry.completionTokens;
        stat.operationCount += 1;

        if (!stat.lastUsed || new Date(entry.timestamp) > new Date(stat.lastUsed)) {
          stat.lastUsed = entry.timestamp;
        }
      }
    });

    return Object.values(stats);
  }, [usage]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return 'from-green-500 to-emerald-600';
      case 'google gemini':
        return 'from-blue-500 to-indigo-600';
      case 'anthropic claude':
        return 'from-purple-500 to-pink-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Usage Summary</h3>
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('w-4 h-4', { 'animate-spin': isRefreshing })} />
          </Button>
        )}
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {providerStats.map((stat) => (
          <div
            key={stat.provider}
            className="relative overflow-hidden rounded-lg border border-border bg-card p-4 transition-all hover:shadow-lg"
          >
            {/* Gradient Background */}
            <div
              className={cn(
                'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
                getProviderColor(stat.provider)
              )}
            />

            {/* Provider Name */}
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium text-foreground">{stat.provider}</h4>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              {/* Total Tokens */}
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {formatNumber(stat.totalTokens)}
                  </span>
                  <span className="text-xs text-muted-foreground">tokens</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3" />
                  <span>{stat.operationCount} operations</span>
                </div>
              </div>

              {/* Token Breakdown */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1">
                  <div className="text-muted-foreground mb-1">Prompt</div>
                  <div className="font-medium text-foreground">
                    {formatNumber(stat.promptTokens)}
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex-1">
                  <div className="text-muted-foreground mb-1">Completion</div>
                  <div className="font-medium text-foreground">
                    {formatNumber(stat.completionTokens)}
                  </div>
                </div>
              </div>

              {/* Last Used */}
              <div className="pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Last used: <span className="text-foreground">{formatDate(stat.lastUsed)}</span>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {stat.operationCount === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm">
                <p className="text-sm text-muted-foreground">No usage yet</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall Stats */}
      {usage.length > 0 && (
        <div className="p-4 rounded-lg bg-accent/30 border border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total Tokens</div>
              <div className="text-lg font-bold text-foreground">
                {formatNumber(usage.reduce((sum, e) => sum + e.totalTokens, 0))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total Operations</div>
              <div className="text-lg font-bold text-foreground">
                {formatNumber(usage.length)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Avg Tokens/Op</div>
              <div className="text-lg font-bold text-foreground">
                {formatNumber(Math.round(usage.reduce((sum, e) => sum + e.totalTokens, 0) / usage.length))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {usage.length === 0 && (
        <div className="p-8 text-center border border-dashed border-border rounded-lg">
          <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No usage data yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Token usage will appear here after you use AI features
          </p>
        </div>
      )}
    </div>
  );
};
