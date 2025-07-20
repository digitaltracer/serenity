import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAllTasks, selectAllEntries, selectAllProjects } from '@serenity/core';
import { Card, CardHeader, CardTitle, CardContent, ProgressBar, Portal } from '@serenity/ui';
import { BarChart3, TrendingUp, Calendar, Target, Zap, Clock, BookOpen, Info } from 'lucide-react';

// Professional tooltip component with Portal rendering and smart positioning
const InfoTooltip: React.FC<{ tooltip: string }> = ({ tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, placement: 'bottom' as 'top' | 'bottom' | 'left' | 'right' });
  const iconRef = React.useRef<HTMLDivElement>(null);
  
  const handleMouseEnter = () => {
    if (iconRef.current) {
      const iconRect = iconRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      const tooltipWidth = 288;
      const tooltipHeight = 100;
      
      let placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
      let top = 0;
      let left = 0;
      
      // Determine best placement
      const spaceBelow = viewport.height - iconRect.bottom;
      const spaceAbove = iconRect.top;
      const spaceRight = viewport.width - iconRect.right;
      const spaceLeft = iconRect.left;
      
      if (spaceBelow >= tooltipHeight) {
        placement = 'bottom';
        top = iconRect.bottom + window.scrollY + 8;
        left = Math.max(16, Math.min(iconRect.right + window.scrollX - tooltipWidth, viewport.width - tooltipWidth - 16));
      } else if (spaceAbove >= tooltipHeight) {
        placement = 'top';
        top = iconRect.top + window.scrollY - tooltipHeight - 8;
        left = Math.max(16, Math.min(iconRect.right + window.scrollX - tooltipWidth, viewport.width - tooltipWidth - 16));
      } else if (spaceRight >= tooltipWidth) {
        placement = 'right';
        top = iconRect.top + window.scrollY - tooltipHeight / 2 + iconRect.height / 2;
        left = iconRect.right + window.scrollX + 8;
      } else if (spaceLeft >= tooltipWidth) {
        placement = 'left';
        top = iconRect.top + window.scrollY - tooltipHeight / 2 + iconRect.height / 2;
        left = iconRect.left + window.scrollX - tooltipWidth - 8;
      } else {
        // Fallback to bottom with adjusted position
        placement = 'bottom';
        top = iconRect.bottom + window.scrollY + 8;
        left = Math.max(16, viewport.width - tooltipWidth - 16);
      }
      
      setTooltipPosition({ top, left, placement });
      setShowTooltip(true);
    }
  };
  
  const getArrowStyle = () => {
    if (!iconRef.current) return {};
    
    const iconRect = iconRef.current.getBoundingClientRect();
    const { placement } = tooltipPosition;
    
    switch (placement) {
      case 'top':
        return {
          position: 'absolute' as const,
          bottom: '-6px',
          left: `${Math.max(12, Math.min(iconRect.left + window.scrollX - tooltipPosition.left + iconRect.width / 2 - 6, 288 - 24))}px`,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid white',
          borderBottom: 'none'
        };
      case 'bottom':
        return {
          position: 'absolute' as const,
          top: '-6px',
          left: `${Math.max(12, Math.min(iconRect.left + window.scrollX - tooltipPosition.left + iconRect.width / 2 - 6, 288 - 24))}px`,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '6px solid white',
          borderTop: 'none'
        };
      case 'left':
        return {
          position: 'absolute' as const,
          right: '-6px',
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderLeft: '6px solid white',
          borderRight: 'none'
        };
      case 'right':
        return {
          position: 'absolute' as const,
          left: '-6px',
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderRight: '6px solid white',
          borderLeft: 'none'
        };
      default:
        return {};
    }
  };
  
  const getArrowStyleDark = () => {
    const lightStyle = getArrowStyle();
    const darkStyle = { ...lightStyle };
    
    // Update border colors for dark mode
    if (lightStyle.borderTop === '6px solid white') darkStyle.borderTop = '6px solid rgb(31 41 55)'; // gray-800
    if (lightStyle.borderBottom === '6px solid white') darkStyle.borderBottom = '6px solid rgb(31 41 55)';
    if (lightStyle.borderLeft === '6px solid white') darkStyle.borderLeft = '6px solid rgb(31 41 55)';
    if (lightStyle.borderRight === '6px solid white') darkStyle.borderRight = '6px solid rgb(31 41 55)';
    
    return darkStyle;
  };
  
  return (
    <div className="relative" ref={iconRef}>
      <Info 
        className="w-4 h-4 text-gray-400 cursor-help"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      />
      {showTooltip && (
        <Portal>
          <div
            className="fixed z-50 w-72 p-3 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800 dark:to-gray-900 border border-gray-200/60 dark:border-gray-700/40 rounded-xl shadow-xl shadow-gray-300/50 dark:shadow-black/40 backdrop-blur-sm ring-1 ring-gray-100/80 dark:ring-gray-800/60"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {/* Arrow for light mode */}
            <div className="dark:hidden" style={getArrowStyle()}></div>
            {/* Arrow for dark mode */}
            <div className="hidden dark:block" style={getArrowStyleDark()}></div>
            
            <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
              {tooltip}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

const calculateStreak = (completedTasks: any[]) => {
  if (completedTasks.length === 0) return 0;
  
  const today = new Date();
  let streak = 0;
  let currentDate = new Date(today);
  
  while (streak < 30) { // Limit to prevent infinite loop
    const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const hasTasksThisDay = completedTasks.some(task => {
      const taskDate = task.updatedAt ? new Date(task.updatedAt) : new Date();
      return taskDate >= dayStart && taskDate < dayEnd;
    });
    
    if (hasTasksThisDay) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

const calculateWeeklyTrend = (items: any[], type: 'completion' | 'creation' = 'completion') => {
  const now = new Date();
  const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekEnd = new Date(thisWeekStart.getTime() - 1);

  const thisWeekItems = items.filter(item => {
    let itemDate: Date | null = null;
    
    if (type === 'completion') {
      // For tasks - check if completed and get updatedAt
      itemDate = (item.completed && item.updatedAt) ? new Date(item.updatedAt) : null;
    } else {
      // For creation - check createdAt for tasks, date for journal entries
      itemDate = item.createdAt ? new Date(item.createdAt) : 
                 item.date ? new Date(item.date) : null;
    }
    
    return itemDate && itemDate >= thisWeekStart;
  });

  const lastWeekItems = items.filter(item => {
    let itemDate: Date | null = null;
    
    if (type === 'completion') {
      // For tasks - check if completed and get updatedAt
      itemDate = (item.completed && item.updatedAt) ? new Date(item.updatedAt) : null;
    } else {
      // For creation - check createdAt for tasks, date for journal entries
      itemDate = item.createdAt ? new Date(item.createdAt) : 
                 item.date ? new Date(item.date) : null;
    }
    
    return itemDate && itemDate >= lastWeekStart && itemDate <= lastWeekEnd;
  });

  const thisWeekCount = thisWeekItems.length;
  const lastWeekCount = lastWeekItems.length;
  
  if (lastWeekCount === 0) return { change: 0, trend: 'stable' as const };
  
  const percentChange = Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100);
  const trend = percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'stable';
  
  return { change: percentChange, trend };
};

const calculatePersonalRecords = (completedTasks: any[]) => {
  // Calculate best streak
  let bestStreak = 0;
  let currentBestStreak = 0;
  const tasksByDate = new Map<string, number>();

  // Group completed tasks by date
  completedTasks.forEach(task => {
    const taskDate = task.updatedAt ? new Date(task.updatedAt) : new Date();
    const dateKey = taskDate.toISOString().split('T')[0];
    tasksByDate.set(dateKey, (tasksByDate.get(dateKey) || 0) + 1);
  });

  // Calculate longest streak historically
  const dates = Array.from(tasksByDate.keys()).sort();
  if (dates.length > 0) {
    let streakStart = new Date(dates[0]);
    currentBestStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      const prevDate = new Date(dates[i - 1]);
      const daysDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff === 1) {
        currentBestStreak++;
      } else {
        bestStreak = Math.max(bestStreak, currentBestStreak);
        currentBestStreak = 1;
      }
    }
    bestStreak = Math.max(bestStreak, currentBestStreak);
  }

  // Calculate best day (most tasks completed in a single day)
  let bestDay = { count: 0, date: null as string | null };
  tasksByDate.forEach((count, date) => {
    if (count > bestDay.count) {
      bestDay = { count, date };
    }
  });

  return { bestStreak, bestDay };
};

const generateTaskCompletionChartData = (completedTasks: any[]) => {
  const days = [];
  const today = new Date();
  
  // Generate last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    const tasksCompleted = completedTasks.filter(task => {
      const taskDate = task.updatedAt ? new Date(task.updatedAt) : new Date();
      return taskDate.toISOString().split('T')[0] === dateKey;
    }).length;
    
    days.push({
      date: dateKey,
      day: dayName,
      count: tasksCompleted,
      isToday: i === 0
    });
  }
  
  return days;
};

const generateProjectDistributionData = (tasks: any[], projects: any[]) => {
  const tasksByProject = tasks.reduce((acc, task) => {
    const projectId = task.projectId || 'no-project';
    acc[projectId] = (acc[projectId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const projectData = Object.entries(tasksByProject).map(([projectId, count]) => {
    const project = projects.find(p => p.id === projectId);
    return {
      id: projectId,
      name: project?.name || 'No Project',
      color: project?.color || '#6B7280',
      count,
      percentage: Math.round((count / tasks.length) * 100)
    };
  }).sort((a, b) => b.count - a.count);

  return projectData;
};

const generateTimeAnalysisData = (completedTasks: any[]) => {
  const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const tasksByDayOfWeek = dayOfWeek.map(day => ({ day, count: 0 }));

  completedTasks.forEach(task => {
    const taskDate = task.updatedAt ? new Date(task.updatedAt) : new Date();
    const dayIndex = taskDate.getDay();
    tasksByDayOfWeek[dayIndex].count++;
  });

  const maxCount = Math.max(...tasksByDayOfWeek.map(d => d.count), 1);
  
  return tasksByDayOfWeek.map(day => ({
    ...day,
    percentage: Math.round((day.count / maxCount) * 100)
  }));
};

const getImprovementSuggestion = (allTasks: any[], completedTasks: any[]) => {
  const pendingTasks = allTasks.filter(task => !task.completed);
  const overdueTasks = pendingTasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate < new Date();
  });
  
  if (overdueTasks.length > 0) {
    return `You have ${overdueTasks.length} overdue tasks - consider prioritizing them`;
  }
  
  const largeTasksWithoutSubtasks = allTasks.filter(task => 
    !task.completed && 
    task.description && 
    task.description.length > 100 && 
    (!task.subtasks || task.subtasks.length === 0)
  );
  
  if (largeTasksWithoutSubtasks.length > 0) {
    return `Consider breaking down ${largeTasksWithoutSubtasks.length} large tasks into subtasks`;
  }
  
  if (completedTasks.length > 0) {
    return 'Great job! Keep up the momentum';
  }
  
  return 'Start by creating your first task';
};

export const AnalyticsPage: React.FC = () => {
  const tasks = useSelector(selectAllTasks);
  const journalEntries = useSelector(selectAllEntries);
  const projects = useSelector(selectAllProjects);

  const analyticsData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Task analytics
    const completedTasks = tasks.filter(task => task.completed);
    const tasksCompletedToday = completedTasks.filter(task => {
      const taskDate = task.updatedAt ? new Date(task.updatedAt) : new Date();
      return taskDate >= today;
    }).length;
    const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

    // Calculate trends
    const taskCompletionTrend = calculateWeeklyTrend(tasks, 'completion');
    const journalCreationTrend = calculateWeeklyTrend(journalEntries, 'creation');

    // Calculate streak and personal records
    const activeStreak = calculateStreak(completedTasks);
    const personalRecords = calculatePersonalRecords(completedTasks);
    const streakToRecord = personalRecords.bestStreak > activeStreak ? 
      personalRecords.bestStreak - activeStreak : 0;

    // Journal analytics
    const journalEntriesThisMonth = journalEntries.filter(entry => {
      const entryDate = entry.date ? new Date(entry.date) : new Date();
      return entryDate >= thisMonth;
    }).length;
    const avgWordsPerEntry = journalEntries.length > 0 
      ? Math.round(journalEntries.reduce((sum, entry) => sum + entry.content.split(' ').length, 0) / journalEntries.length)
      : 0;

    // Weekly insights with real data
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const tasksByDay = completedTasks.reduce((acc, task) => {
      const taskDate = task.updatedAt ? new Date(task.updatedAt) : new Date();
      const day = dayOfWeek[taskDate.getDay()];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostProductiveDayData = Object.entries(tasksByDay).sort(([,a], [,b]) => b - a)[0];
    const mostProductiveDay = mostProductiveDayData?.[0] || 'No data';
    const mostProductiveDayCount = mostProductiveDayData?.[1] || 0;

    // Project analysis with real counts
    const tasksByProject = tasks.reduce((acc, task) => {
      const projectId = task.projectId || 'no-project';
      acc[projectId] = (acc[projectId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topProjectData = Object.entries(tasksByProject).sort(([,a], [,b]) => b - a)[0];
    const topProjectId = topProjectData?.[0];
    const topProjectCount = topProjectData?.[1] || 0;
    
    // Get the actual project name
    let topProject = 'No data';
    if (topProjectId) {
      if (topProjectId === 'no-project') {
        topProject = 'No Project';
      } else {
        const project = projects.find(p => p.id === topProjectId);
        topProject = project?.name || 'Unknown Project';
      }
    }

    const improvementArea = getImprovementSuggestion(tasks, completedTasks);

    // Chart data
    const taskCompletionChartData = generateTaskCompletionChartData(completedTasks);
    const projectDistributionData = generateProjectDistributionData(tasks, projects);
    const timeAnalysisData = generateTimeAnalysisData(completedTasks);

    return {
      tasksCompleted: completedTasks.length,
      tasksCompletedToday,
      completionRate,
      activeStreak,
      journalEntries: journalEntries.length,
      journalEntriesThisMonth,
      avgWordsPerEntry,
      mostProductiveDay,
      mostProductiveDayCount,
      topProject,
      topProjectCount,
      improvementArea,
      taskCompletionTrend,
      journalCreationTrend,
      streakToRecord,
      personalRecords,
      taskCompletionChartData,
      projectDistributionData,
      timeAnalysisData
    };
  }, [tasks, journalEntries, projects]);

  return (
    <div className="flex-1 h-full bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your productivity and progress over time
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Tasks Completed
              </div>
              <InfoTooltip tooltip="Total number of tasks you've completed. The percentage shows the change compared to last week." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {analyticsData.tasksCompleted}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {analyticsData.taskCompletionTrend.change > 0 ? '+' : ''}{analyticsData.taskCompletionTrend.change}% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Journal Entries
              </div>
              <InfoTooltip tooltip="Total journal entries you've written. The percentage shows how your journaling activity compares to last week." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {analyticsData.journalEntries}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {analyticsData.journalCreationTrend.change > 0 ? '+' : ''}{analyticsData.journalCreationTrend.change}% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Completion Rate
              </div>
              <InfoTooltip tooltip="Percentage of all your tasks that have been completed. This gives you an overall view of your productivity." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${analyticsData.completionRate * 2.51} 251`}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {analyticsData.completionRate}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Active Streak
              </div>
              <InfoTooltip tooltip="Number of consecutive days you've completed at least one task. Streaks help build productive habits!" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {analyticsData.activeStreak} days
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {analyticsData.streakToRecord > 0 
                ? `${analyticsData.streakToRecord} days to best record`
                : 'Personal best! 🎉'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Task Completion Trends
              <InfoTooltip tooltip="Line graph showing your daily task completion over the last 7 days. Today's data point is highlighted with a larger circle." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 p-2">
              {analyticsData.taskCompletionChartData.length > 0 ? (
                <div className="h-full flex flex-col">
                  {/* Chart container */}
                  <div className="relative flex-1 mb-3">
                    <svg viewBox="0 0 400 220" className="w-full h-full">
                      {/* Grid lines */}
                      <defs>
                        <pattern id="grid" width="30" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 30 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-gray-700" opacity="0.3"/>
                        </pattern>
                      </defs>
                      <rect width="400" height="220" fill="url(#grid)" />
                      
                      {/* Chart content */}
                      {(() => {
                        const maxCount = Math.max(...analyticsData.taskCompletionChartData.map(d => d.count), 1);
                        const chartWidth = 320;
                        const chartHeight = 160;
                        const leftMargin = 50;
                        const bottomMargin = 40;
                        const topMargin = 20;
                        
                        // Y-axis scale with more detail
                        const yScale = Math.max(maxCount + 2, 5); // Always show at least 5, add buffer above max
                        const yTicks = [];
                        // Show every integer from 0 to yScale for detailed Y-axis
                        for (let i = 0; i <= yScale; i++) {
                          yTicks.push(i);
                        }
                        
                        const points = analyticsData.taskCompletionChartData.map((day, index) => {
                          const x = leftMargin + (index / (analyticsData.taskCompletionChartData.length - 1)) * chartWidth;
                          const y = topMargin + chartHeight - (day.count / Math.max(yScale, 1)) * chartHeight;
                          return `${x},${y}`;
                        }).join(' ');
                        
                        return (
                          <>
                            {/* Y-axis labels */}
                            {yTicks.map(tick => {
                              const y = topMargin + chartHeight - (tick / Math.max(yScale, 1)) * chartHeight;
                              return (
                                <g key={tick}>
                                  <line 
                                    x1={leftMargin - 5} 
                                    y1={y} 
                                    x2={leftMargin} 
                                    y2={y} 
                                    stroke="currentColor" 
                                    className="text-gray-300 dark:text-gray-600" 
                                    strokeWidth="1"
                                  />
                                  <text 
                                    x={leftMargin - 8} 
                                    y={y} 
                                    textAnchor="end" 
                                    dominantBaseline="middle" 
                                    className="text-xs fill-gray-500 dark:fill-gray-400"
                                  >
                                    {tick}
                                  </text>
                                  {tick > 0 && (
                                    <line 
                                      x1={leftMargin} 
                                      y1={y} 
                                      x2={leftMargin + chartWidth} 
                                      y2={y} 
                                      stroke="currentColor" 
                                      className="text-gray-200 dark:text-gray-700" 
                                      strokeWidth="0.5"
                                      opacity="0.5"
                                    />
                                  )}
                                </g>
                              );
                            })}
                            
                            {/* Chart border */}
                            <rect 
                              x={leftMargin} 
                              y={topMargin} 
                              width={chartWidth} 
                              height={chartHeight} 
                              fill="none" 
                              stroke="currentColor" 
                              className="text-gray-300 dark:text-gray-600" 
                              strokeWidth="1"
                            />
                            
                            {/* Area under the line */}
                            <defs>
                              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" className="text-blue-500 dark:text-blue-400"/>
                                <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" className="text-blue-500 dark:text-blue-400"/>
                              </linearGradient>
                            </defs>
                            <polygon
                              fill="url(#areaGradient)"
                              points={`${leftMargin},${topMargin + chartHeight} ${points} ${leftMargin + chartWidth},${topMargin + chartHeight}`}
                            />
                            
                            {/* Line */}
                            <polyline
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              points={points}
                              className="text-blue-500 dark:text-blue-400"
                            />
                            
                            {/* Data points */}
                            {analyticsData.taskCompletionChartData.map((day, index) => {
                              const x = leftMargin + (index / (analyticsData.taskCompletionChartData.length - 1)) * chartWidth;
                              const y = topMargin + chartHeight - (day.count / Math.max(yScale, 1)) * chartHeight;
                              
                              return (
                                <g key={day.date}>
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r={day.isToday ? "6" : "4"}
                                    fill="white"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    className={`${
                                      day.isToday 
                                        ? 'stroke-blue-600 dark:stroke-blue-300' 
                                        : 'stroke-blue-500 dark:stroke-blue-400'
                                    } hover:stroke-blue-700 dark:hover:stroke-blue-200 transition-colors`}
                                  >
                                    <title>{`${day.day}: ${day.count} task${day.count !== 1 ? 's' : ''} completed`}</title>
                                  </circle>
                                  {day.isToday && (
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r="9"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      className="stroke-blue-500 dark:stroke-blue-400 opacity-50"
                                    />
                                  )}
                                  {/* Task count labels on hover */}
                                  {day.count > 0 && (
                                    <text 
                                      x={x} 
                                      y={y - 12} 
                                      textAnchor="middle" 
                                      className="text-xs fill-gray-600 dark:fill-gray-400 opacity-75"
                                    >
                                      {day.count}
                                    </text>
                                  )}
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  
                  {/* X-axis labels */}
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-3 px-12">
                    {analyticsData.taskCompletionChartData.map((day) => (
                      <span key={day.date} className={`text-center ${day.isToday ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}>
                        {day.day}
                      </span>
                    ))}
                  </div>
                  
                  {/* Subtitle */}
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Daily task completion trend over the last 7 days
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                  <div>
                    <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">No completion data yet</p>
                    <p className="text-xs">Complete some tasks to see your productivity trends</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Project Distribution
                <InfoTooltip tooltip="Shows how your tasks are distributed across different projects. Each project is shown with its color, percentage, and total task count." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-28 p-3">
                {analyticsData.projectDistributionData.length > 0 ? (
                  <div className="space-y-2">
                    {analyticsData.projectDistributionData.slice(0, 3).map((project, index) => (
                      <div key={project.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {project.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {project.percentage}%
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {project.count}
                          </div>
                        </div>
                      </div>
                    ))}
                    {analyticsData.projectDistributionData.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
                        +{analyticsData.projectDistributionData.length - 3} more projects
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                    <div>
                      <div className="text-sm">No tasks yet</div>
                      <div className="text-xs">Create tasks to see distribution</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Weekly Productivity Pattern
                <InfoTooltip tooltip="Shows which days of the week you complete the most tasks. This helps you identify your most productive days and plan accordingly." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-28 p-3">
                {analyticsData.timeAnalysisData.some(d => d.count > 0) ? (
                  <div className="flex items-end justify-between h-20 gap-1">
                    {analyticsData.timeAnalysisData.map((day, index) => (
                      <div key={day.day} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-full bg-gradient-to-t from-green-500 to-green-400 dark:from-green-400 dark:to-green-300 rounded-t-sm transition-all duration-200 hover:from-green-600 hover:to-green-500 dark:hover:from-green-500 dark:hover:to-green-400"
                          style={{ 
                            height: `${day.percentage}%`, 
                            minHeight: day.count > 0 ? '4px' : '0px' 
                          }}
                          title={`${day.day}: ${day.count} task${day.count !== 1 ? 's' : ''} completed`}
                        />
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {day.day}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                    <div>
                      <Clock className="w-8 h-8 mx-auto mb-1" />
                      <div className="text-sm">No patterns yet</div>
                      <div className="text-xs">Complete tasks to see weekly patterns</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Weekly Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Weekly Insights
            <InfoTooltip tooltip="Key insights about your productivity patterns, top performing projects, and personalized suggestions for improvement." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Most Productive Day
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {analyticsData.mostProductiveDay} - {analyticsData.mostProductiveDayCount > 0 
                  ? `You completed ${analyticsData.mostProductiveDayCount} task${analyticsData.mostProductiveDayCount !== 1 ? 's' : ''}`
                  : 'No completed tasks yet'
                }
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Top Project
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {analyticsData.topProject} - {analyticsData.topProjectCount > 0 
                  ? `${analyticsData.topProjectCount} task${analyticsData.topProjectCount !== 1 ? 's' : ''} total`
                  : 'No tasks yet'
                }
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Improvement Area
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {analyticsData.improvementArea}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
};