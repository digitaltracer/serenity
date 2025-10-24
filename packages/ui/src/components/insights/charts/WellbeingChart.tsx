/**
 * Well-being Chart Component
 * Area chart showing mood trends over time with journal entry markers
 */

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from 'recharts';
import { chartColors, getChartTheme } from '../../charts/chartConfig';

export interface WellbeingDataPoint {
  date: string;
  mood: number;
  entryId?: string;
  hasEntry?: boolean;
}

export interface WellbeingChartProps {
  data: WellbeingDataPoint[];
  isDarkMode?: boolean;
  height?: number;
  onEntryClick?: (entryId: string) => void;
}

export const WellbeingChart: React.FC<WellbeingChartProps> = ({
  data,
  isDarkMode = false,
  height = 400,
  onEntryClick,
}) => {
  const theme = getChartTheme(isDarkMode);

  // Calculate average mood
  const avgMood = data.length > 0
    ? data.reduce((sum, point) => sum + point.mood, 0) / data.length
    : 5;

  // Get mood color based on value
  const getMoodColor = (mood: number): string => {
    if (mood >= 8) return chartColors.success;
    if (mood >= 6) return chartColors.info;
    if (mood >= 4) return chartColors.warning;
    return chartColors.danger;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const mood = payload[0].value;
      const moodColor = getMoodColor(mood);
      const hasEntry = payload[0].payload.hasEntry;

      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {label}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: moodColor }}
            />
            <span className="text-gray-700 dark:text-gray-300">
              Mood: <strong>{mood} / 10</strong>
            </span>
          </div>
          {hasEntry && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              📝 Click to view journal entry
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom dot for journal entries
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.hasEntry) {
      return (
        <g
          onClick={() => payload.entryId && onEntryClick?.(payload.entryId)}
          style={{ cursor: payload.entryId ? 'pointer' : 'default' }}
        >
          <circle
            cx={cx}
            cy={cy}
            r={6}
            fill={getMoodColor(payload.mood)}
            stroke="#fff"
            strokeWidth={2}
          />
          <circle
            cx={cx}
            cy={cy}
            r={3}
            fill="#fff"
          />
        </g>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-sm">No mood data available</p>
          <p className="text-xs mt-1">Track your mood in journal entries to see trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mood Legend */}
      <div className="flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.danger }} />
          <span className="text-gray-600 dark:text-gray-400">Low (1-3)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.warning }} />
          <span className="text-gray-600 dark:text-gray-400">Fair (4-5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.info }} />
          <span className="text-gray-600 dark:text-gray-400">Good (6-7)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.success }} />
          <span className="text-gray-600 dark:text-gray-400">Great (8-10)</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.wellbeing} stopOpacity={0.8} />
              <stop offset="95%" stopColor={chartColors.wellbeing} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
          <XAxis
            dataKey="date"
            stroke={theme.axisColor}
            style={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
          />
          <YAxis
            stroke={theme.axisColor}
            style={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            label={{ value: 'Mood (0-10)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={avgMood}
            stroke={theme.axisColor}
            strokeDasharray="3 3"
            label={{
              value: `Avg: ${avgMood.toFixed(1)}`,
              position: 'right',
              fill: theme.axisColor,
              fontSize: theme.fontSize,
            }}
          />
          <Area
            type="monotone"
            dataKey="mood"
            stroke={chartColors.wellbeing}
            strokeWidth={3}
            fill="url(#moodGradient)"
            dot={<CustomDot />}
            activeDot={{ r: 8 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Info */}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        Dots indicate journal entries • Click a dot to view the entry
      </p>
    </div>
  );
};
