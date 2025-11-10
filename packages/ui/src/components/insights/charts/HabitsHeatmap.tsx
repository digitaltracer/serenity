/**
 * Habits Heatmap Component
 * Calendar heatmap showing recurring task completion rates (GitHub-style)
 */

import React, { useState } from 'react';
import { chartColors } from '../../charts/chartConfig';

export interface HabitsDataPoint {
  date: string;
  completionRate: number; // 0-1
  count: number;
  completedTasks?: string[];
}

export interface HabitsHeatmapProps {
  data: HabitsDataPoint[];
  isDarkMode?: boolean;
  startDate?: Date;
  endDate?: Date;
  onDayClick?: (date: string, data: HabitsDataPoint) => void;
}

export const HabitsHeatmap: React.FC<HabitsHeatmapProps> = ({
  data,
  isDarkMode = false,
  startDate,
  endDate,
  onDayClick,
}) => {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Create a map for quick lookup
  const dataMap = new Map(data.map(d => [d.date, d]));

  // Generate calendar grid (last 12 weeks)
  const generateCalendarData = () => {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 84 * 24 * 60 * 60 * 1000); // 12 weeks

    const weeks: Array<Array<{ date: string; data?: HabitsDataPoint }>> = [];
    let currentWeek: Array<{ date: string; data?: HabitsDataPoint }> = [];

    // Start from the beginning of the week
    const current = new Date(start);
    const dayOfWeek = current.getDay();
    current.setDate(current.getDate() - dayOfWeek);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayData = dataMap.get(dateStr);

      currentWeek.push({
        date: dateStr,
        data: dayData,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const weeks = generateCalendarData();

  // Get color based on completion rate
  const getColor = (rate: number | undefined): string => {
    if (rate === undefined || rate === 0) {
      return isDarkMode ? '#1f2937' : '#f3f4f6';
    }
    if (rate < 0.25) return isDarkMode ? '#312e81' : '#ddd6fe';
    if (rate < 0.5) return isDarkMode ? '#4c1d95' : '#c4b5fd';
    if (rate < 0.75) return isDarkMode ? '#6d28d9' : '#a78bfa';
    return isDarkMode ? '#7c3aed' : '#8b5cf6';
  };

  // Handle mouse enter
  const handleMouseEnter = (date: string, data: HabitsDataPoint | undefined, e: React.MouseEvent) => {
    if (data) {
      setHoveredDay(date);
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  // Handle click
  const handleClick = (date: string, data: HabitsDataPoint | undefined) => {
    if (data && onDayClick) {
      onDayClick(date, data);
    }
  };

  const hoveredData = hoveredDay ? dataMap.get(hoveredDay) : null;

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">
          {weeks.length} weeks of habit completion
        </span>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400">Less</span>
          <div className="flex gap-1">
            {[0, 0.25, 0.5, 0.75, 1].map((rate, idx) => (
              <div
                key={idx}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: getColor(rate) }}
              />
            ))}
          </div>
          <span className="text-gray-600 dark:text-gray-400">More</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 pr-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="h-3" />
            <div className="h-3 flex items-center">Mon</div>
            <div className="h-3" />
            <div className="h-3 flex items-center">Wed</div>
            <div className="h-3" />
            <div className="h-3 flex items-center">Fri</div>
            <div className="h-3" />
          </div>

          {/* Calendar grid */}
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {week.map((day, dayIdx) => {
                const isToday = day.date === new Date().toISOString().split('T')[0];
                const isHovered = hoveredDay === day.date;

                return (
                  <div
                    key={dayIdx}
                    className={`w-3 h-3 rounded-sm transition-all ${
                      day.data ? 'cursor-pointer hover:ring-2 hover:ring-blue-500' : ''
                    } ${isToday ? 'ring-2 ring-blue-600' : ''} ${
                      isHovered ? 'scale-125' : ''
                    }`}
                    style={{ backgroundColor: getColor(day.data?.completionRate) }}
                    onMouseEnter={(e) => handleMouseEnter(day.date, day.data, e)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleClick(day.date, day.data)}
                    title={day.date}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && hoveredData && (
        <div
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg z-50 pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y + 10,
          }}
        >
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {new Date(hoveredDay).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </p>
          <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
            <div>
              Completion Rate: <strong>{(hoveredData.completionRate * 100).toFixed(0)}%</strong>
            </div>
            <div>
              Tasks: <strong>{hoveredData.count}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Active Days</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.reduce((sum, d) => sum + d.count, 0)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total Tasks</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.length > 0
              ? ((data.reduce((sum, d) => sum + d.completionRate, 0) / data.length) * 100).toFixed(0)
              : 0}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Avg Completion</div>
        </div>
      </div>

      {/* Info */}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        Each square represents a day • Darker colors indicate higher completion rates
      </p>
    </div>
  );
};
