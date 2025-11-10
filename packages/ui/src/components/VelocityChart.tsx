/**
 * Velocity Chart Component
 * Shows task completion velocity over time with trend analysis and predictions
 */

import React, { useMemo } from 'react';
import { InteractiveChart, ChartDataPoint } from './InteractiveChart';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  priority?: 'low' | 'medium' | 'high';
  projectId?: string;
}

interface VelocityChartProps {
  tasks: Task[];
  timeRange?: number; // days
  groupBy?: 'day' | 'week' | 'month';
  className?: string;
  height?: number;
  width?: number;
  showTrendLine?: boolean;
  showPrediction?: boolean;
  filterBy?: {
    priority?: 'low' | 'medium' | 'high';
    projectId?: string;
  };
  onPeriodClick?: (data: { 
    period: string; 
    date: Date; 
    velocity: number; 
    tasks: Task[] 
  }) => void;
}

export const VelocityChart: React.FC<VelocityChartProps> = ({
  tasks,
  timeRange = 30,
  groupBy = 'day',
  className = '',
  height = 300,
  width = 500,
  showTrendLine = true,
  showPrediction = true,
  filterBy,
  onPeriodClick,
}) => {
  const chartData = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    
    // Set start date based on time range
    if (groupBy === 'month') {
      startDate.setMonth(startDate.getMonth() - timeRange);
    } else if (groupBy === 'week') {
      startDate.setDate(startDate.getDate() - (timeRange * 7));
    } else {
      startDate.setDate(startDate.getDate() - timeRange);
    }

    // Filter tasks
    let filteredTasks = tasks.filter(task => {
      if (!task.completed || !(task.completedAt || task.updatedAt)) return false;

      const completedDate = new Date(task.completedAt || task.updatedAt!);
      if (completedDate < startDate || completedDate > endDate) return false;
      
      if (filterBy?.priority && task.priority !== filterBy.priority) return false;
      if (filterBy?.projectId && task.projectId !== filterBy.projectId) return false;
      
      return true;
    });

    const velocityData: ChartDataPoint[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      let periodStart: Date;
      let periodEnd: Date;
      let label: string;

      if (groupBy === 'month') {
        periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        label = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (groupBy === 'week') {
        const dayOfWeek = currentDate.getDay();
        periodStart = new Date(currentDate);
        periodStart.setDate(currentDate.getDate() - dayOfWeek);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 6);
        label = `Week of ${periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        periodStart = new Date(currentDate);
        periodEnd = new Date(currentDate);
        periodEnd.setHours(23, 59, 59, 999);
        label = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Count tasks completed in this period
      const periodTasks = filteredTasks.filter(task => {
        const completedDate = new Date(task.completedAt || task.updatedAt!);
        return completedDate >= periodStart && completedDate <= periodEnd;
      });

      // Calculate velocity (tasks per period)
      const velocity = periodTasks.length;

      velocityData.push({
        id: `velocity-${periodStart.getTime()}`,
        label,
        value: velocity,
        date: new Date(periodStart),
        color: getVelocityColor(velocity),
        metadata: {
          period: label,
          date: periodStart,
          velocity,
          tasks: periodTasks,
          periodStart,
          periodEnd,
        },
      });
    }

    return velocityData;
  }, [tasks, timeRange, groupBy, filterBy]);

  // Calculate trend and statistics
  const analytics = useMemo(() => {
    if (chartData.length < 2) {
      return {
        trend: 'stable' as const,
        trendValue: 0,
        average: 0,
        median: 0,
        max: 0,
        min: 0,
        prediction: 0,
      };
    }

    const values = chartData.map(d => d.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0 
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)];

    const max = Math.max(...values);
    const min = Math.min(...values);

    // Simple linear trend calculation
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const trendValue = Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
    const trend = trendValue > 5 ? 'up' : trendValue < -5 ? 'down' : 'stable';

    // Simple prediction based on recent trend
    const recentValues = values.slice(-5); // Last 5 periods
    const recentAvg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    const prediction = Math.max(0, Math.round(recentAvg + (trendValue / 100) * recentAvg));

    return {
      trend,
      trendValue,
      average: Math.round(average * 10) / 10,
      median,
      max,
      min,
      prediction,
    };
  }, [chartData]);

  // Get color based on velocity level
  function getVelocityColor(velocity: number): string {
    if (velocity >= analytics.average * 1.2) return '#10B981'; // Green - above average
    if (velocity >= analytics.average * 0.8) return '#3B82F6'; // Blue - average
    if (velocity >= analytics.average * 0.5) return '#F59E0B'; // Orange - below average
    return '#EF4444'; // Red - significantly below
  }

  const formatTooltip = (dataPoint: ChartDataPoint) => {
    const metadata = dataPoint.metadata;
    return {
      title: metadata?.period || dataPoint.label,
      content: `${dataPoint.value} task${dataPoint.value !== 1 ? 's' : ''} completed`,
    };
  };

  const handleDataPointClick = (dataPoint: ChartDataPoint) => {
    if (onPeriodClick && dataPoint.metadata) {
      onPeriodClick({
        period: dataPoint.metadata.period,
        date: dataPoint.metadata.date,
        velocity: dataPoint.value,
        tasks: dataPoint.metadata.tasks,
      });
    }
  };

  // Custom renderer with trend line and prediction
  const customRenderer = ({ data, width, height, hoveredPoint }: any) => {
    const margins = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - margins.left - margins.right;
    const chartHeight = height - margins.top - margins.bottom;

    if (chartData.length === 0) return null;

    const maxValue = Math.max(...chartData.map(d => d.value), analytics.prediction || 0);
    const minValue = 0;
    const valueRange = maxValue - minValue || 1;

    const processedData = chartData.map((point, index) => ({
      ...point,
      x: (index / Math.max(chartData.length - 1, 1)) * chartWidth,
      y: chartHeight - ((point.value - minValue) / valueRange) * chartHeight,
    }));

    // Calculate trend line
    const trendLine = showTrendLine && processedData.length >= 2 ? (() => {
      const firstPoint = processedData[0];
      const lastPoint = processedData[processedData.length - 1];
      return `M ${firstPoint.x} ${firstPoint.y + (lastPoint.y - firstPoint.y) * 0.2} L ${lastPoint.x} ${lastPoint.y - (lastPoint.y - firstPoint.y) * 0.2}`;
    })() : null;

    // Prediction point
    const predictionPoint = showPrediction && analytics.prediction > 0 ? {
      x: chartWidth + 20,
      y: chartHeight - ((analytics.prediction - minValue) / valueRange) * chartHeight,
      value: analytics.prediction,
    } : null;

    return (
      <g>
        {/* Grid and axis */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = chartHeight * (1 - ratio);
          const value = Math.round(minValue + (ratio * valueRange));
          return (
            <g key={index}>
              <line
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-gray-200 dark:text-gray-700"
                opacity="0.5"
              />
              <text
                x={-8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-xs fill-gray-500 dark:fill-gray-400"
              >
                {value}
              </text>
            </g>
          );
        })}

        {/* Bar chart */}
        {processedData.map((point, index) => {
          const barWidth = Math.max(8, (chartWidth / processedData.length) * 0.7);
          const barHeight = (point.value / Math.max(valueRange, 1)) * chartHeight;
          const x = point.x - barWidth / 2;
          const y = chartHeight - barHeight;

          return (
            <rect
              key={point.id}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={point.color}
              className="cursor-pointer transition-all duration-200 hover:opacity-80"
              opacity={hoveredPoint?.id === point.id ? 0.8 : 1}
            />
          );
        })}

        {/* Average line */}
        <line
          x1={0}
          y1={chartHeight - ((analytics.average - minValue) / valueRange) * chartHeight}
          x2={chartWidth}
          y2={chartHeight - ((analytics.average - minValue) / valueRange) * chartHeight}
          stroke="#F59E0B"
          strokeWidth="2"
          strokeDasharray="4,4"
          opacity="0.7"
        />

        {/* Trend line */}
        {trendLine && (
          <path
            d={trendLine}
            fill="none"
            stroke="#6B7280"
            strokeWidth="2"
            strokeDasharray="2,2"
            opacity="0.6"
          />
        )}

        {/* Prediction point */}
        {predictionPoint && (
          <g>
            <line
              x1={chartWidth}
              y1={0}
              x2={chartWidth}
              y2={chartHeight}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="3,3"
              className="text-gray-300 dark:text-gray-600"
              opacity="0.5"
            />
            <circle
              cx={predictionPoint.x}
              cy={predictionPoint.y}
              r={5}
              fill="#8B5CF6"
              stroke="white"
              strokeWidth="2"
              opacity="0.8"
            />
            <text
              x={predictionPoint.x}
              y={predictionPoint.y - 12}
              textAnchor="middle"
              className="text-xs fill-purple-600 dark:fill-purple-400 font-medium"
            >
              {predictionPoint.value}
            </text>
          </g>
        )}
      </g>
    );
  };

  if (chartData.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-sm">No velocity data</div>
          <div className="text-xs mt-1">Complete some tasks to see your velocity trends</div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with trend indicator */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-gray-900 dark:text-white">Task Velocity</h3>
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
            analytics.trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
            analytics.trend === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}>
            {analytics.trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
             analytics.trend === 'down' ? <TrendingDown className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            <span>
              {analytics.trend === 'up' ? `+${analytics.trendValue}%` :
               analytics.trend === 'down' ? `${analytics.trendValue}%` :
               'Stable'}
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Avg: <span className="font-medium text-gray-700 dark:text-gray-300">{analytics.average}</span>
        </div>
      </div>

      <InteractiveChart
        data={chartData}
        type="bar"
        width={width}
        height={height}
        showGrid={true}
        showAxis={true}
        showTooltip={true}
        colors={chartData.map(d => d.color || '#3B82F6')}
        formatTooltip={formatTooltip}
        onDataPointClick={handleDataPointClick}
        customRenderer={customRenderer}
      />

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center space-x-4 mt-3 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-gray-600 dark:text-gray-400">Above Average</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-gray-600 dark:text-gray-400">Average</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-500 rounded" />
          <span className="text-gray-600 dark:text-gray-400">Below Average</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-yellow-500" />
          <span className="text-gray-600 dark:text-gray-400">Average Line</span>
        </div>
        {showPrediction && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full" />
            <span className="text-gray-600 dark:text-gray-400">Prediction</span>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-xs">
        <div className="text-center">
          <div className="font-medium text-gray-900 dark:text-white">{analytics.max}</div>
          <div className="text-gray-500 dark:text-gray-400">Peak</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-gray-900 dark:text-white">{analytics.min}</div>
          <div className="text-gray-500 dark:text-gray-400">Lowest</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-gray-900 dark:text-white">{analytics.median}</div>
          <div className="text-gray-500 dark:text-gray-400">Median</div>
        </div>
        {showPrediction && (
          <div className="text-center">
            <div className="font-medium text-purple-600 dark:text-purple-400">{analytics.prediction}</div>
            <div className="text-gray-500 dark:text-gray-400">Next Period</div>
          </div>
        )}
      </div>
    </div>
  );
};