/**
 * SparklineChart Component
 * Minimal line chart for displaying trends in compact spaces (e.g., KPI cards)
 */

import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { chartColors } from './chartConfig';

export interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number | `${number}%`;
  strokeWidth?: number;
  showDots?: boolean;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  color = chartColors.primary,
  height = 40,
  width = '100%',
  strokeWidth = 2,
  showDots = false,
}) => {
  // Transform number array to chart data format
  const chartData = data.map((value, index) => ({
    index,
    value,
  }));

  if (data.length === 0) {
    return (
      <div
        className="bg-gray-100 dark:bg-gray-800 rounded"
        style={{ height, width }}
      />
    );
  }

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart
        data={chartData}
        margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
      >
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={strokeWidth}
          dot={showDots ? { fill: color, r: 2 } : false}
          animationDuration={300}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
