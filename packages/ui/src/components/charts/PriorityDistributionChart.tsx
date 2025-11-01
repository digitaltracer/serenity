/**
 * PriorityDistributionChart Component
 * Displays task priority distribution as a pie chart
 */

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
} from 'recharts';
import { chartMargins, getChartTheme } from './chartConfig';

export interface PriorityDistributionData {
  high: { count: number; percentage: number };
  medium: { count: number; percentage: number };
  low: { count: number; percentage: number };
}

export interface PriorityDistributionChartProps {
  data: PriorityDistributionData;
  height?: number;
  showLabels?: boolean;
  isDark?: boolean;
}

interface ChartDataPoint {
  name: string;
  count: number;
  percentage: number;
  color: string;
  [key: string]: any; // Allow additional properties for Recharts
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartDataPoint }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-gray-900 dark:bg-white border border-gray-700 dark:border-gray-300 rounded-lg shadow-lg px-3 py-2">
      <p className="text-sm font-semibold text-white dark:text-gray-900 mb-1">
        {data.name} Priority
      </p>
      <p className="text-xs text-gray-300 dark:text-gray-600">
        {data.count} task{data.count !== 1 ? 's' : ''} ({data.percentage.toFixed(1)}%)
      </p>
    </div>
  );
};

const EmptyState: React.FC<{ height: number }> = ({ height }) => (
  <div
    className="w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg"
    style={{ height }}
  >
    <div className="text-center">
      <svg
        className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <p className="text-sm text-gray-500 dark:text-gray-400">No tasks to analyze</p>
    </div>
  </div>
);

export const PriorityDistributionChart: React.FC<PriorityDistributionChartProps> = ({
  data,
  height = 200,
  showLabels = true,
  isDark = false,
}) => {
  const theme = getChartTheme(isDark);

  // Transform data for chart
  const chartData: ChartDataPoint[] = [
    {
      name: 'High',
      count: data.high.count,
      percentage: data.high.percentage,
      color: '#ef4444', // red-500
    },
    {
      name: 'Medium',
      count: data.medium.count,
      percentage: data.medium.percentage,
      color: '#f59e0b', // amber-500
    },
    {
      name: 'Low',
      count: data.low.count,
      percentage: data.low.percentage,
      color: '#3b82f6', // blue-500
    },
  ];

  const totalTasks = data.high.count + data.medium.count + data.low.count;

  if (totalTasks === 0) {
    return <EmptyState height={height} />;
  }

  // Custom label renderer for pie chart
  const renderCustomLabel = (entry: any) => {
    if (!showLabels || entry.percentage < 5) return null; // Don't show label if slice is too small
    return `${entry.percentage.toFixed(0)}%`;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showLabels ? renderCustomLabel : false}
            outerRadius={height * 0.35}
            innerRadius={height * 0.2}
            fill="#8884d8"
            dataKey="count"
            animationDuration={500}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
