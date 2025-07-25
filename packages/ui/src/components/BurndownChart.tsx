/**
 * Burndown Chart Component
 * Shows project progress over time with ideal vs actual completion rates
 */

import React, { useMemo } from 'react';
import { InteractiveChart, ChartDataPoint, createChartData } from './InteractiveChart';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt?: Date;
  projectId?: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
  startDate?: Date;
  targetDate?: Date;
}

interface BurndownChartProps {
  tasks: Task[];
  project?: Project;
  timeRange?: number; // days
  className?: string;
  height?: number;
  width?: number;
  showIdealLine?: boolean;
  onPointClick?: (data: { date: Date; remaining: number; completed: number }) => void;
}

export const BurndownChart: React.FC<BurndownChartProps> = ({
  tasks,
  project,
  timeRange = 30,
  className = '',
  height = 300,
  width = 500,
  showIdealLine = true,
  onPointClick,
}) => {
  const chartData = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    // Filter tasks for this project if specified
    const projectTasks = project 
      ? tasks.filter(task => task.projectId === project.id)
      : tasks;

    if (projectTasks.length === 0) {
      return { actualData: [], idealData: [], totalTasks: 0 };
    }

    const totalTasks = projectTasks.length;
    const actualData: ChartDataPoint[] = [];
    const idealData: ChartDataPoint[] = [];

    // Generate data points for each day
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const currentDate = new Date(d);
      const dayKey = currentDate.toISOString().split('T')[0];

      // Calculate tasks completed by this date
      const completedByDate = projectTasks.filter(task => {
        if (!task.completed || !task.updatedAt) return false;
        const completedDate = new Date(task.updatedAt);
        return completedDate <= currentDate;
      }).length;

      const remainingTasks = totalTasks - completedByDate;

      // Add actual data point
      actualData.push({
        id: `actual-${dayKey}`,
        label: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: remainingTasks,
        date: new Date(currentDate),
        color: project?.color || '#3B82F6',
        metadata: {
          date: currentDate,
          remaining: remainingTasks,
          completed: completedByDate,
          total: totalTasks,
        },
      });

      // Calculate ideal progress (linear decrease)
      const daysFromStart = Math.max(0, (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const idealRemaining = Math.max(0, totalTasks - (totalTasks * (daysFromStart / totalDays)));

      if (showIdealLine) {
        idealData.push({
          id: `ideal-${dayKey}`,
          label: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: idealRemaining,
          date: new Date(currentDate),
          color: '#9CA3AF',
          metadata: {
            date: currentDate,
            ideal: true,
            remaining: idealRemaining,
          },
        });
      }
    }

    return { actualData, idealData, totalTasks };
  }, [tasks, project, timeRange, showIdealLine]);

  const formatTooltip = (dataPoint: ChartDataPoint) => {
    const metadata = dataPoint.metadata;
    if (metadata?.ideal) {
      return {
        title: 'Ideal Progress',
        content: `${Math.round(dataPoint.value)} tasks remaining`,
      };
    }

    return {
      title: dataPoint.label,
      content: `${dataPoint.value} remaining • ${metadata?.completed || 0} completed`,
    };
  };

  const handleDataPointClick = (dataPoint: ChartDataPoint) => {
    if (onPointClick && !dataPoint.metadata?.ideal) {
      onPointClick({
        date: dataPoint.date!,
        remaining: dataPoint.value,
        completed: dataPoint.metadata?.completed || 0,
      });
    }
  };

  // Custom renderer that shows both actual and ideal lines
  const customRenderer = ({ data, width, height, hoveredPoint }: any) => {
    const margins = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - margins.left - margins.right;
    const chartHeight = height - margins.top - margins.bottom;

    if (chartData.actualData.length === 0) return null;

    const maxValue = Math.max(
      ...chartData.actualData.map(d => d.value),
      ...(showIdealLine ? chartData.idealData.map(d => d.value) : [])
    );
    const minValue = 0;
    const valueRange = maxValue - minValue || 1;

    const processData = (points: ChartDataPoint[]) => 
      points.map((point, index) => ({
        ...point,
        x: (index / Math.max(points.length - 1, 1)) * chartWidth,
        y: chartHeight - ((point.value - minValue) / valueRange) * chartHeight,
        normalizedValue: (point.value - minValue) / valueRange,
      }));

    const actualProcessed = processData(chartData.actualData);
    const idealProcessed = showIdealLine ? processData(chartData.idealData) : [];

    const createPath = (points: any[]) => 
      points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

    return (
      <g>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = chartHeight * (1 - ratio);
          const value = Math.round(minValue + ratio * valueRange);
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

        {/* Ideal line (if enabled) */}
        {showIdealLine && idealProcessed.length > 1 && (
          <g>
            <path
              d={createPath(idealProcessed)}
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.6"
            />
            {idealProcessed.map((point, index) => (
              index % 3 === 0 && (
                <circle
                  key={`ideal-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={2}
                  fill="#9CA3AF"
                  opacity="0.6"
                />
              )
            ))}
          </g>
        )}

        {/* Actual progress area */}
        {actualProcessed.length > 1 && (
          <g>
            <defs>
              <linearGradient id="burndownGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={project?.color || '#3B82F6'} stopOpacity="0.3" />
                <stop offset="100%" stopColor={project?.color || '#3B82F6'} stopOpacity="0.1" />
              </linearGradient>
            </defs>
            
            {/* Area under curve */}
            <path
              d={`${createPath(actualProcessed)} L ${actualProcessed[actualProcessed.length - 1].x} ${chartHeight} L ${actualProcessed[0].x} ${chartHeight} Z`}
              fill="url(#burndownGradient)"
            />
            
            {/* Main line */}
            <path
              d={createPath(actualProcessed)}
              fill="none"
              stroke={project?.color || '#3B82F6'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {actualProcessed.map((point, index) => (
              <circle
                key={point.id}
                cx={point.x}
                cy={point.y}
                r={hoveredPoint?.id === point.id ? 6 : 4}
                fill="white"
                stroke={project?.color || '#3B82F6'}
                strokeWidth="3"
                className="cursor-pointer transition-all duration-200"
              />
            ))}
          </g>
        )}
      </g>
    );
  };

  if (chartData.totalTasks === 0) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-sm">No tasks found</div>
          <div className="text-xs mt-1">
            {project ? `No tasks in "${project.name}"` : 'Add tasks to see burndown chart'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <InteractiveChart
        data={chartData.actualData}
        type="area"
        width={width}
        height={height}
        showGrid={true}
        showAxis={true}
        showTooltip={true}
        colors={[project?.color || '#3B82F6']}
        formatTooltip={formatTooltip}
        onDataPointClick={handleDataPointClick}
        customRenderer={customRenderer}
      />
      
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-2">
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: project?.color || '#3B82F6' }}
          />
          <span className="text-xs text-gray-600 dark:text-gray-400">Actual Progress</span>
        </div>
        {showIdealLine && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-gray-400" style={{ borderTop: '2px dashed #9CA3AF' }} />
            <span className="text-xs text-gray-600 dark:text-gray-400">Ideal Progress</span>
          </div>
        )}
      </div>
      
      {/* Summary stats */}
      <div className="flex justify-between items-center mt-3 text-xs text-gray-500 dark:text-gray-400">
        <div>
          Total Tasks: <span className="font-medium text-gray-700 dark:text-gray-300">{chartData.totalTasks}</span>
        </div>
        <div>
          Remaining: <span className="font-medium text-gray-700 dark:text-gray-300">
            {chartData.actualData[chartData.actualData.length - 1]?.value || 0}
          </span>
        </div>
        <div>
          Progress: <span className="font-medium text-green-600 dark:text-green-400">
            {Math.round(((chartData.totalTasks - (chartData.actualData[chartData.actualData.length - 1]?.value || 0)) / chartData.totalTasks) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};