/**
 * TrendChart Component
 * Reusable trend visualization component using Recharts
 * Supports line, bar, and area chart types
 */

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { chartColors, chartMargins, getChartTheme } from './chartConfig';
import { formatChartDate, formatChartNumber } from './chartUtils';

export interface TrendChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
  metadata?: any;
}

export interface TrendChartProps {
  data: TrendChartDataPoint[];
  type?: 'line' | 'bar' | 'area';
  title?: string;
  color?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
  formatDate?: (date: string) => string;
  onDataPointClick?: (data: TrendChartDataPoint) => void;
  isDark?: boolean;
  loading?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: TrendChartDataPoint }>;
  label?: string;
  formatValue?: (value: number) => string;
  formatDate?: (date: string) => string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, formatValue, formatDate }) => {
  if (!active || !payload || payload.length === 0 || !label) {
    return null;
  }

  const value = payload[0].value;
  const formattedDate = formatDate ? formatDate(label) : formatChartDate(label);
  const formattedValue = formatValue ? formatValue(value) : formatChartNumber(value);

  return (
    <div className="bg-gray-900 dark:bg-white border border-gray-700 dark:border-gray-300 rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-gray-300 dark:text-gray-600 mb-1">{formattedDate}</p>
      <p className="text-sm font-semibold text-white dark:text-gray-900">{formattedValue}</p>
    </div>
  );
};

const LoadingSkeleton: React.FC<{ height: number }> = ({ height }) => (
  <div
    className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
    style={{ height }}
  />
);

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
      <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
    </div>
  </div>
);

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  type = 'line',
  title,
  color = chartColors.primary,
  height = 300,
  showLegend = false,
  showGrid = true,
  formatValue,
  formatDate,
  onDataPointClick,
  isDark = false,
  loading = false,
  yAxisLabel,
  xAxisLabel,
}) => {
  const theme = getChartTheme(isDark);

  // Transform data to include formatted timestamp
  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      displayTimestamp: formatDate ? formatDate(point.timestamp) : formatChartDate(point.timestamp, 'short'),
    }));
  }, [data, formatDate]);

  if (loading) {
    return <LoadingSkeleton height={height} />;
  }

  if (data.length === 0) {
    return <EmptyState height={height} />;
  }

  const handleClick = (data: any) => {
    if (onDataPointClick && data && data.activePayload) {
      onDataPointClick(data.activePayload[0].payload);
    }
  };

  const commonProps = {
    data: chartData,
    margin: chartMargins.withAxis,
    onClick: handleClick,
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.gridColor}
                opacity={0.5}
              />
            )}
            <XAxis
              dataKey="displayTimestamp"
              stroke={theme.axisColor}
              style={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
              tick={{ fill: theme.axisColor }}
              label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
            />
            <YAxis
              stroke={theme.axisColor}
              style={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
              tick={{ fill: theme.axisColor }}
              tickFormatter={(value) => formatValue ? formatValue(value) : formatChartNumber(value)}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            />
            <Tooltip
              content={<CustomTooltip formatValue={formatValue} formatDate={formatDate} />}
              cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
            />
            {showLegend && <Legend />}
            <Bar
              dataKey="value"
              fill={color}
              radius={[4, 4, 0, 0]}
              animationDuration={500}
            />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.gridColor}
                opacity={0.5}
              />
            )}
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="displayTimestamp"
              stroke={theme.axisColor}
              style={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
              tick={{ fill: theme.axisColor }}
              label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
            />
            <YAxis
              stroke={theme.axisColor}
              style={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
              tick={{ fill: theme.axisColor }}
              tickFormatter={(value) => formatValue ? formatValue(value) : formatChartNumber(value)}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            />
            <Tooltip
              content={<CustomTooltip formatValue={formatValue} formatDate={formatDate} />}
            />
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#colorValue)"
              animationDuration={500}
            />
          </AreaChart>
        );

      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.gridColor}
                opacity={0.5}
              />
            )}
            <XAxis
              dataKey="displayTimestamp"
              stroke={theme.axisColor}
              style={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
              tick={{ fill: theme.axisColor }}
              label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
            />
            <YAxis
              stroke={theme.axisColor}
              style={{ fontSize: theme.fontSize, fontFamily: theme.fontFamily }}
              tick={{ fill: theme.axisColor }}
              tickFormatter={(value) => formatValue ? formatValue(value) : formatChartNumber(value)}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
            />
            <Tooltip
              content={<CustomTooltip formatValue={formatValue} formatDate={formatDate} />}
            />
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={500}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};
