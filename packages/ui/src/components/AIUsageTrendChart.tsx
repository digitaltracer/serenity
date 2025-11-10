import React, { useState, useMemo } from 'react';
import { cn } from '../utils/cn';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AIUsageEntry {
  id: string;
  timestamp: string;
  provider: 'openai' | 'gemini' | 'anthropic';
  operation: 'analyze' | 'recap' | 'quickadd';
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIUsageTrendChartProps {
  usage: AIUsageEntry[];
}

type TimeRange = '7d' | '30d' | '90d' | 'all';
type ChartView = 'tokens' | 'operations';

const providerColors: Record<string, string> = {
  openai: '#10b981', // green-500
  gemini: '#3b82f6', // blue-500
  anthropic: '#a855f7', // purple-500
};

export const AIUsageTrendChart: React.FC<AIUsageTrendChartProps> = ({ usage }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [chartView, setChartView] = useState<ChartView>('tokens');

  const chartData = useMemo(() => {
    if (usage.length === 0) return [];

    // Filter by time range
    const now = new Date();
    const cutoffDate = new Date();

    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        // Get oldest entry
        const oldestEntry = usage.reduce((oldest, entry) => {
          const entryDate = new Date(entry.timestamp);
          return entryDate < oldest ? entryDate : oldest;
        }, new Date());
        cutoffDate.setTime(oldestEntry.getTime() - 86400000); // 1 day before oldest
        break;
    }

    const filteredUsage = usage.filter((entry) => new Date(entry.timestamp) >= cutoffDate);

    // Group by date
    const groupedByDate: Record<string, any> = {};

    filteredUsage.forEach((entry) => {
      const date = new Date(entry.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      if (!groupedByDate[date]) {
        groupedByDate[date] = {
          date,
          openai: 0,
          gemini: 0,
          anthropic: 0,
          openaiOps: 0,
          geminiOps: 0,
          anthropicOps: 0,
        };
      }

      if (chartView === 'tokens') {
        groupedByDate[date][entry.provider] += entry.totalTokens;
      } else {
        groupedByDate[date][`${entry.provider}Ops`] += 1;
      }
    });

    // Convert to array and sort by date
    const dataArray = Object.values(groupedByDate);

    // Sort chronologically
    dataArray.sort((a, b) => {
      const dateA = new Date(a.date + ', ' + new Date().getFullYear());
      const dateB = new Date(b.date + ', ' + new Date().getFullYear());
      return dateA.getTime() - dateB.getTime();
    });

    return dataArray;
  }, [usage, timeRange, chartView]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">
                {entry.name}:
              </span>
              <span className="font-medium text-foreground">
                {chartView === 'tokens'
                  ? `${formatNumber(entry.value)} tokens`
                  : `${entry.value} ops`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Usage Trends</h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Chart View Toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setChartView('tokens')}
              className={cn(
                'px-3 py-1.5 text-sm transition-colors',
                chartView === 'tokens'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-accent'
              )}
            >
              Tokens
            </button>
            <button
              onClick={() => setChartView('operations')}
              className={cn(
                'px-3 py-1.5 text-sm transition-colors',
                chartView === 'operations'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-accent'
              )}
            >
              Operations
            </button>
          </div>

          {/* Time Range Selector */}
          <CustomSelect
            options={[
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
              { value: '90d', label: 'Last 90 Days' },
              { value: 'all', label: 'All Time' },
            ]}
            value={timeRange}
            onChange={(value) => setTimeRange(value as TimeRange)}
            className="w-40"
          />
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="border border-border rounded-lg p-4 bg-card">
          <ResponsiveContainer width="100%" height={300}>
            {chartView === 'tokens' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                  tickFormatter={formatNumber}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="openai"
                  stroke={providerColors.openai}
                  strokeWidth={2}
                  name="OpenAI"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="gemini"
                  stroke={providerColors.gemini}
                  strokeWidth={2}
                  name="Google Gemini"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="anthropic"
                  stroke={providerColors.anthropic}
                  strokeWidth={2}
                  name="Anthropic Claude"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="circle"
                />
                <Bar dataKey="openaiOps" fill={providerColors.openai} name="OpenAI" />
                <Bar dataKey="geminiOps" fill={providerColors.gemini} name="Google Gemini" />
                <Bar dataKey="anthropicOps" fill={providerColors.anthropic} name="Anthropic Claude" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="p-8 text-center border border-dashed border-border rounded-lg">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No data available for the selected time range</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try selecting a different time range or use AI features to generate data
          </p>
        </div>
      )}
    </div>
  );
};
