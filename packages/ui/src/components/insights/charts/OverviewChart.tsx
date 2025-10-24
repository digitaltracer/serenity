/**
 * Overview Chart Component
 * Dual-axis chart showing tasks completed (bars) and mood trends (line)
 */

import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { chartColors, getChartTheme } from '../../charts/chartConfig';

export interface OverviewDataPoint {
  date: string;
  tasksCompleted: number;
  mood?: number;
}

export interface OverviewChartProps {
  data: OverviewDataPoint[];
  isDarkMode?: boolean;
  height?: number;
}

export const OverviewChart: React.FC<OverviewChartProps> = ({
  data,
  isDarkMode = false,
  height = 400,
}) => {
  const theme = getChartTheme(isDarkMode);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 dark:text-gray-300">
                {entry.name}: <strong>{entry.value}</strong>
                {entry.name === 'Mood' && ' / 10'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-sm">No data available for the selected time range</p>
          <p className="text-xs mt-1">Complete some tasks to see trends</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis
          dataKey="date"
          stroke={theme.axisColor}
          style={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
        />
        <YAxis
          yAxisId="left"
          stroke={theme.axisColor}
          style={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
          label={{ value: 'Tasks Completed', angle: -90, position: 'insideLeft' }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke={theme.axisColor}
          style={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
          label={{ value: 'Mood (0-10)', angle: 90, position: 'insideRight' }}
          domain={[0, 10]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
        />
        <Bar
          yAxisId="left"
          dataKey="tasksCompleted"
          fill={chartColors.productivity}
          name="Tasks Completed"
          radius={[4, 4, 0, 0]}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="mood"
          stroke={chartColors.wellbeing}
          strokeWidth={2}
          name="Mood"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
