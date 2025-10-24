/**
 * Productivity Chart Component
 * Line chart showing task completion trends and velocity
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { chartColors, getChartTheme } from '../../charts/chartConfig';

export interface ProductivityDataPoint {
  date: string;
  completed: number;
  created: number;
  velocity?: number;
}

export interface ProductivityChartProps {
  data: ProductivityDataPoint[];
  isDarkMode?: boolean;
  height?: number;
  showVelocity?: boolean;
}

export const ProductivityChart: React.FC<ProductivityChartProps> = ({
  data,
  isDarkMode = false,
  height = 400,
  showVelocity = true,
}) => {
  const theme = getChartTheme(isDarkMode);

  // Calculate velocity if not provided (7-day moving average)
  const dataWithVelocity = data.map((point, index) => {
    if (point.velocity !== undefined) return point;

    const windowSize = Math.min(7, index + 1);
    const window = data.slice(Math.max(0, index - windowSize + 1), index + 1);
    const avgCompleted = window.reduce((sum, p) => sum + p.completed, 0) / windowSize;

    return {
      ...point,
      velocity: Math.round(avgCompleted * 10) / 10,
    };
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 dark:text-gray-300">
                {entry.name}: <strong>{entry.value}</strong>
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
          <p className="text-sm">No productivity data available</p>
          <p className="text-xs mt-1">Complete some tasks to see your productivity trends</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={dataWithVelocity}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <defs>
          <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColors.productivity} stopOpacity={0.8} />
            <stop offset="95%" stopColor={chartColors.productivity} stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColors.secondary} stopOpacity={0.6} />
            <stop offset="95%" stopColor={chartColors.secondary} stopOpacity={0.05} />
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
          label={{ value: 'Number of Tasks', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
        />
        <Area
          type="monotone"
          dataKey="created"
          fill="url(#createdGradient)"
          stroke={chartColors.secondary}
          strokeWidth={2}
          name="Tasks Created"
        />
        <Area
          type="monotone"
          dataKey="completed"
          fill="url(#completedGradient)"
          stroke={chartColors.productivity}
          strokeWidth={2}
          name="Tasks Completed"
        />
        {showVelocity && (
          <Line
            type="monotone"
            dataKey="velocity"
            stroke={chartColors.success}
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Velocity (7-day avg)"
            dot={false}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
};
