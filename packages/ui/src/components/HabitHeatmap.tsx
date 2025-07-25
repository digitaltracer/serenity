/**
 * Habit Heatmap Component
 * Calendar-style heatmap showing daily activity patterns and streaks
 */

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Flame } from 'lucide-react';

interface Activity {
  date: Date;
  count: number;
  tasks?: any[];
  entries?: any[];
}

interface HabitHeatmapProps {
  tasks?: any[];
  journalEntries?: any[];
  startDate?: Date;
  months?: number;
  className?: string;
  cellSize?: number;
  showLegend?: boolean;
  showNavigation?: boolean;
  activityType?: 'tasks' | 'journal' | 'both';
  onDateClick?: (date: Date, activity: Activity) => void;
  onDateHover?: (date: Date, activity: Activity | null) => void;
}

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({
  tasks = [],
  journalEntries = [],
  startDate,
  months = 12,
  className = '',
  cellSize = 12,
  showLegend = true,
  showNavigation = true,
  activityType = 'both',
  onDateClick,
  onDateHover,
}) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(startDate || new Date(today.getFullYear(), today.getMonth() - months + 1, 1));
  const [hoveredActivity, setHoveredActivity] = useState<Activity | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Generate activity data for the heatmap
  const activityData = useMemo(() => {
    const endDate = new Date(viewDate);
    endDate.setMonth(endDate.getMonth() + months);
    
    const activities = new Map<string, Activity>();
    const currentDate = new Date(viewDate);

    // Initialize all dates with zero activity
    while (currentDate < endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      activities.set(dateKey, {
        date: new Date(currentDate),
        count: 0,
        tasks: [],
        entries: [],
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count task completions
    if (activityType === 'tasks' || activityType === 'both') {
      tasks.forEach(task => {
        if (!task.completed || !task.updatedAt) return;
        
        const completedDate = new Date(task.updatedAt);
        const dateKey = completedDate.toISOString().split('T')[0];
        const activity = activities.get(dateKey);
        
        if (activity) {
          activity.count += 1;
          activity.tasks!.push(task);
        }
      });
    }

    // Count journal entries
    if (activityType === 'journal' || activityType === 'both') {
      journalEntries.forEach(entry => {
        if (!entry.date) return;
        
        const entryDate = new Date(entry.date);
        const dateKey = entryDate.toISOString().split('T')[0];
        const activity = activities.get(dateKey);
        
        if (activity) {
          if (activityType === 'journal') {
            activity.count += 1;
          } else {
            // For 'both', weight journal entries less than tasks
            activity.count += 0.5;
          }
          activity.entries!.push(entry);
        }
      });
    }

    return Array.from(activities.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [tasks, journalEntries, viewDate, months, activityType]);

  // Calculate intensity levels and stats
  const stats = useMemo(() => {
    const counts = activityData.map(a => a.count);
    const maxCount = Math.max(...counts, 1);
    const totalActivity = counts.reduce((sum, count) => sum + count, 0);
    const activeDays = counts.filter(count => count > 0).length;
    
    // Calculate current streak
    let currentStreak = 0;
    const todayStr = today.toISOString().split('T')[0];
    
    for (let i = activityData.length - 1; i >= 0; i--) {
      const activity = activityData[i];
      const dateStr = activity.date.toISOString().split('T')[0];
      
      if (dateStr > todayStr) continue; // Skip future dates
      
      if (activity.count > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate best streak
    let bestStreak = 0;
    let tempStreak = 0;
    
    activityData.forEach(activity => {
      if (activity.count > 0) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    });

    return {
      maxCount,
      totalActivity: Math.round(totalActivity),
      activeDays,
      currentStreak,
      bestStreak,
      averagePerDay: Math.round((totalActivity / activityData.length) * 10) / 10,
    };
  }, [activityData, today]);

  // Get intensity level (0-4) for a given count
  const getIntensityLevel = (count: number): number => {
    if (count === 0) return 0;
    if (count <= stats.maxCount * 0.25) return 1;
    if (count <= stats.maxCount * 0.5) return 2;
    if (count <= stats.maxCount * 0.75) return 3;
    return 4;
  };

  // Get color class for intensity level
  const getColorClass = (level: number): string => {
    switch (level) {
      case 0: return 'fill-gray-100 dark:fill-gray-800';
      case 1: return 'fill-green-200 dark:fill-green-900/40';
      case 2: return 'fill-green-300 dark:fill-green-800/60';
      case 3: return 'fill-green-400 dark:fill-green-700/80';
      case 4: return 'fill-green-500 dark:fill-green-600';
      default: return 'fill-gray-100 dark:fill-gray-800';
    }
  };

  // Generate weeks data for rendering
  const weeksData = useMemo(() => {
    const weeks: Activity[][] = [];
    let currentWeek: Activity[] = [];
    
    // Start from Sunday of the first week
    const startOfCalendar = new Date(activityData[0]?.date || viewDate);
    const dayOfWeek = startOfCalendar.getDay();
    startOfCalendar.setDate(startOfCalendar.getDate() - dayOfWeek);
    
    const activityMap = new Map(
      activityData.map(activity => [
        activity.date.toISOString().split('T')[0],
        activity
      ])
    );

    const endDate = new Date(viewDate);
    endDate.setMonth(endDate.getMonth() + months);
    
    const currentDate = new Date(startOfCalendar);
    
    while (currentDate < endDate || currentWeek.length > 0) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const activity = activityMap.get(dateKey) || {
        date: new Date(currentDate),
        count: 0,
        tasks: [],
        entries: [],
      };
      
      currentWeek.push(activity);
      
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return weeks;
  }, [activityData, viewDate, months]);

  const handleDateMouseEnter = (event: React.MouseEvent, activity: Activity) => {
    setHoveredActivity(activity);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    onDateHover?.(activity.date, activity);
  };

  const handleDateMouseLeave = () => {
    setHoveredActivity(null);
    onDateHover?.(new Date(), null);
  };

  const handleDateClick = (activity: Activity) => {
    onDateClick?.(activity.date, activity);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthLabels = [];
  
  // Generate month labels
  for (let i = 0; i < months; i++) {
    const monthDate = new Date(viewDate);
    monthDate.setMonth(monthDate.getMonth() + i);
    monthLabels.push(
      monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    );
  }

  return (
    <div className={`habit-heatmap ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Activity Heatmap</span>
          </h3>
          {stats.currentStreak > 0 && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-xs">
              <Flame className="w-3 h-3" />
              <span>{stats.currentStreak} day streak</span>
            </div>
          )}
        </div>
        
        {showNavigation && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="relative">
        {/* Month labels */}
        <div className="flex mb-2">
          <div className="w-6" /> {/* Spacer for day labels */}
          <div className="flex-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
            {monthLabels.map((month, index) => (
              <span key={index}>{month}</span>
            ))}
          </div>
        </div>

        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col mr-2">
            {dayLabels.map((day, index) => (
              <div
                key={day}
                className="text-xs text-gray-500 dark:text-gray-400 mb-0.5"
                style={{ height: cellSize, lineHeight: `${cellSize}px` }}
              >
                {index % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex space-x-0.5">
            {weeksData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col space-y-0.5">
                {week.map((activity, dayIndex) => {
                  const intensityLevel = getIntensityLevel(activity.count);
                  const isToday = activity.date.toDateString() === today.toDateString();
                  
                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`cursor-pointer transition-all duration-200 hover:opacity-80 ${
                        isToday ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                      }`}
                      style={{ width: cellSize, height: cellSize }}
                      onMouseEnter={(e) => handleDateMouseEnter(e, activity)}
                      onMouseLeave={handleDateMouseLeave}
                      onClick={() => handleDateClick(activity)}
                    >
                      <svg width={cellSize} height={cellSize}>
                        <rect
                          width={cellSize - 1}
                          height={cellSize - 1}
                          rx="2"
                          className={`${getColorClass(intensityLevel)} transition-colors duration-200`}
                        />
                      </svg>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Less</span>
            <div className="flex space-x-1">
              {[0, 1, 2, 3, 4].map(level => (
                <svg key={level} width={12} height={12}>
                  <rect
                    width={11}
                    height={11}
                    rx="2"
                    className={getColorClass(level)}
                  />
                </svg>
              ))}
            </div>
            <span>More</span>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {stats.totalActivity} {activityType === 'tasks' ? 'tasks' : activityType === 'journal' ? 'entries' : 'activities'} in {stats.activeDays} days
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-center">
        <div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.currentStreak}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Current Streak</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.bestStreak}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Best Streak</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.activeDays}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Active Days</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">{stats.averagePerDay}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Daily Average</div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredActivity && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            transform: 'translateY(-100%)',
          }}
        >
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {hoveredActivity.date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {hoveredActivity.count > 0 ? (
              <>
                {Math.round(hoveredActivity.count)} {activityType === 'tasks' ? 'tasks' : activityType === 'journal' ? 'entries' : 'activities'}
                {hoveredActivity.tasks && hoveredActivity.tasks.length > 0 && (
                  <div className="mt-1 text-green-600 dark:text-green-400">
                    {hoveredActivity.tasks.length} task{hoveredActivity.tasks.length !== 1 ? 's' : ''}
                  </div>
                )}
                {hoveredActivity.entries && hoveredActivity.entries.length > 0 && (
                  <div className="mt-1 text-blue-600 dark:text-blue-400">
                    {hoveredActivity.entries.length} journal entr{hoveredActivity.entries.length !== 1 ? 'ies' : 'y'}
                  </div>
                )}
              </>
            ) : (
              'No activity'
            )}
          </div>
        </div>
      )}
    </div>
  );
};