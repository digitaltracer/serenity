/**
 * Advanced Analytics Component
 * Full-featured analytics with charts, insights, and heatmaps
 */

import React, { useMemo, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
// Safe InteractiveChart implementation to avoid circular dependencies
interface ChartDataPoint {
  id: string;
  label: string;
  value: number;
  color?: string;
  date?: Date;
  metadata?: any;
}

// Safe chart component implementation
const SafeInteractiveChart: React.FC<{
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'area';
  width?: number;
  height?: number;
  colors?: string[];
  formatTooltip?: (point: ChartDataPoint) => { title: string; content: string };
}> = ({ data, type, width = 600, height = 300, colors = ['#3B82F6'], formatTooltip }) => {
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  const chartRef = useRef<HTMLDivElement>(null);
  
  const processedData = useMemo(() => {
    if (data.length === 0) return [];
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value), 0);
    const valueRange = maxValue - minValue || 1;
    
    return data.map((point, index) => ({
      ...point,
      color: point.color || colors[index % colors.length],
      normalizedValue: (point.value - minValue) / valueRange,
      x: (index / Math.max(data.length - 1, 1)) * (width - 80),
      y: height - 60 - ((point.value - minValue) / valueRange) * (height - 120)
    }));
  }, [data, width, height, colors]);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - 40;
    const mouseY = e.clientY - rect.top - 40;
    
    // Find closest point
    let closest: ChartDataPoint | null = null;
    let minDist = Infinity;
    
    processedData.forEach(point => {
      const dist = Math.sqrt(Math.pow(mouseX - (point.x || 0), 2) + Math.pow(mouseY - (point.y || 0), 2));
      if (dist < minDist && dist < 30) {
        minDist = dist;
        closest = point;
      }
    });
    
    setHoveredPoint(closest);
    if (closest) {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }
  };
  
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <div 
        ref={chartRef}
        className="cursor-crosshair"
        style={{ width, height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <svg width={width} height={height} className="overflow-visible">
          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = 40 + (height - 80) * (1 - ratio);
            return (
              <g key={i}>
                <line x1={40} y1={y} x2={width - 40} y2={y} stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-gray-700" opacity="0.5" />
                <text x={30} y={y} textAnchor="end" dominantBaseline="middle" className="text-xs fill-gray-500 dark:fill-gray-400">
                  {Math.round(Math.max(...data.map(d => d.value)) * ratio)}
                </text>
              </g>
            );
          })}
          
          {/* Chart based on type */}
          {type === 'bar' ? (
            <g>
              {processedData.map((point, i) => {
                const barWidth = Math.max(8, (width - 80) / processedData.length * 0.8);
                const barHeight = (point.normalizedValue || 0) * (height - 120);
                const x = (point.x || 0) - barWidth / 2 + 40;
                const y = height - 60 - barHeight;
                return (
                  <rect
                    key={point.id}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={point.color}
                    className="transition-all duration-200 hover:opacity-80"
                    opacity={hoveredPoint?.id === point.id ? 0.8 : 1}
                  />
                );
              })}
            </g>
          ) : (
            <g>
              {/* Area fill for area chart */}
              {type === 'area' && processedData.length > 1 && (
                <path
                  d={`M ${40 + (processedData[0].x || 0)} ${processedData[0].y || 0} ${processedData.map(p => `L ${40 + (p.x || 0)} ${p.y || 0}`).join(' ')} L ${40 + (processedData[processedData.length - 1].x || 0)} ${height - 60} L ${40 + (processedData[0].x || 0)} ${height - 60} Z`}
                  fill={colors[0]}
                  opacity="0.3"
                />
              )}
              
              {/* Line */}
              {processedData.length > 1 && (
                <path
                  d={`M ${40 + (processedData[0].x || 0)} ${processedData[0].y || 0} ${processedData.slice(1).map(p => `L ${40 + (p.x || 0)} ${p.y || 0}`).join(' ')}`}
                  fill="none"
                  stroke={colors[0]}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}
              
              {/* Points */}
              {processedData.map(point => (
                <circle
                  key={point.id}
                  cx={40 + (point.x || 0)}
                  cy={point.y || 0}
                  r={hoveredPoint?.id === point.id ? 6 : 4}
                  fill="white"
                  stroke={point.color}
                  strokeWidth="3"
                  className="cursor-pointer transition-all duration-200"
                />
              ))}
            </g>
          )}
          
          {/* X-axis labels */}
          {processedData.map((point, i) => {
            if (i % Math.ceil(processedData.length / 8) === 0 || i === processedData.length - 1) {
              return (
                <text
                  key={`label-${i}`}
                  x={40 + (point.x || 0)}
                  y={height - 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-500 dark:fill-gray-400"
                >
                  {point.label.split(' ').slice(0, 2).join(' ')}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </div>
      
      {/* Tooltip */}
      {hoveredPoint && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: tooltipPos.x + 10,
            top: tooltipPos.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          {formatTooltip ? (() => {
            const tooltip = formatTooltip(hoveredPoint);
            return (
              <>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{tooltip.title}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">{tooltip.content}</div>
              </>
            );
          })() : (
            <>
              <div className="text-sm font-medium text-gray-900 dark:text-white">{hoveredPoint.label}</div>
              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">Value: {hoveredPoint.value}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
import { BarChart3, TrendingUp, Calendar, Target, Zap, Clock, BookOpen, Activity, Brain, AlertTriangle, Star, Lightbulb, CheckCircle, ChevronRight, Flame, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';

// Import interfaces from analyticsUtils to ensure consistency
import { Task, JournalEntry, Project } from '../utils/analyticsUtils';

// AI insights are now passed as props from the Analytics page

interface AdvancedAnalyticsProps {
  tasks: Task[];
  journalEntries: JournalEntry[];
  projects: Project[];
  aiInsights?: any[];
}

// Simple analytics calculations without external dependencies
const calculateBasicAnalytics = (tasks: Task[], journalEntries: JournalEntry[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const completedTasks = tasks.filter(task => task.completed);
  const tasksThisWeek = completedTasks.filter(task => {
    const completedDate = task.completedAt ? new Date(task.completedAt) : 
                         task.updatedAt ? new Date(task.updatedAt) : 
                         new Date(task.createdAt);
    return completedDate >= thisWeek;
  });

  // Calculate tasks created this week
  const tasksCreatedThisWeek = tasks.filter(task => {
    const createdDate = new Date(task.createdAt);
    return createdDate >= thisWeek;
  });

  const journalThisWeek = journalEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= thisWeek;
  });

  // Calculate completion rate
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Calculate streak (simplified)
  let streak = 0;
  const dateMap = new Map<string, number>();
  
  completedTasks.forEach(task => {
    const date = task.completedAt ? new Date(task.completedAt) : 
                 task.updatedAt ? new Date(task.updatedAt) : 
                 new Date(task.createdAt);
    const dateKey = date.toISOString().split('T')[0];
    dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
  });

  // Simple streak calculation
  const sortedDates = Array.from(dateMap.keys()).sort().reverse();
  for (const dateKey of sortedDates) {
    const date = new Date(dateKey);
    const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= streak + 1 && dateMap.get(dateKey)! > 0) {
      streak++;
    } else {
      break;
    }
  }

  return {
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    createdTasks: tasks.length, // Total tasks created
    completionRate,
    tasksThisWeek: tasksThisWeek.length,
    tasksCreatedThisWeek: tasksCreatedThisWeek.length,
    journalThisWeek: journalThisWeek.length,
    streak,
    avgTasksPerDay: tasksThisWeek.length / 7,
  };
};

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  tasks,
  journalEntries,
  projects,
  aiInsights = [],
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'insights' | 'heatmap'>('overview');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  
  // Use AI insights passed as prop
  const storedAIInsights = aiInsights || [];
  
  // Simulate loading when switching to heatmap tab or when data changes
  React.useEffect(() => {
    if (activeTab === 'heatmap') {
      setHeatmapLoading(true);
      const timer = setTimeout(() => {
        setHeatmapLoading(false);
      }, 800); // Simulate data processing time
      return () => clearTimeout(timer);
    }
  }, [activeTab, tasks.length, journalEntries.length]);
  
  const analytics = useMemo(() => 
    calculateBasicAnalytics(tasks, journalEntries), 
    [tasks, journalEntries]
  );

  // Generate comprehensive chart data
  const chartData = useMemo(() => {
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      const dayTasks = tasks.filter(task => {
        if (!task.completed) return false;
        const taskDate = task.completedAt ? new Date(task.completedAt) : 
                         task.updatedAt ? new Date(task.updatedAt) : 
                         new Date(task.createdAt);
        return taskDate.toISOString().split('T')[0] === dateKey;
      }).length;
      
      last30Days.push({
        id: `day-${i}`,
        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        value: dayTasks,
        date: new Date(date),
        metadata: { dateKey, dayTasks }
      });
    }
    
    return last30Days;
  }, [tasks]);

  // Generate chart data for tasks created
  const createdChartData = useMemo(() => {
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      const dayTasksCreated = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate.toISOString().split('T')[0] === dateKey;
      }).length;
      
      last30Days.push({
        id: `created-day-${i}`,
        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        value: dayTasksCreated,
        date: new Date(date),
        metadata: { dateKey, dayTasksCreated }
      });
    }
    
    return last30Days;
  }, [tasks]);
  
  // Advanced analytics calculations
  const advancedAnalytics = useMemo(() => {
    const completedTasks = tasks.filter(t => t.completed);
    const highPriorityTasks = tasks.filter(t => t.priority === 'high');
    const completedHighPriority = highPriorityTasks.filter(t => t.completed);
    
    // Velocity calculation
    const last7DaysData = chartData.slice(-7);
    const velocityTrend = last7DaysData.length >= 2 ? 
      (last7DaysData[last7DaysData.length - 1].value - last7DaysData[0].value) / Math.max(last7DaysData[0].value, 1) : 0;
    
    // Best day analysis
    const dayOfWeekStats: { [key: string]: number } = {};
    completedTasks.forEach(task => {
      const completedDate = task.completedAt ? new Date(task.completedAt) : 
                           task.updatedAt ? new Date(task.updatedAt) : 
                           new Date(task.createdAt);
      const day = completedDate.toLocaleDateString('en-US', { weekday: 'long' });
      dayOfWeekStats[day] = (dayOfWeekStats[day] || 0) + 1;
    });
    const bestDay = Object.entries(dayOfWeekStats).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Monday';
    
    return {
      velocityTrend,
      bestDay,
      highPriorityRate: highPriorityTasks.length > 0 ? (completedHighPriority.length / highPriorityTasks.length) * 100 : 0,
      overdueTasks: tasks.filter(t => t.dueDate && !t.completed && new Date(t.dueDate) < new Date()).length,
      recentMomentum: last7DaysData.reduce((sum, day) => sum + day.value, 0)
    };
  }, [tasks, chartData]);

  const tabButtons = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'charts', label: 'Charts', icon: TrendingUp },
    { id: 'insights', label: 'Insights', icon: Brain },
    { id: 'heatmap', label: 'Activity', icon: Activity },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {tabButtons.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Enhanced Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {analytics.completionRate}%
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {analytics.completedTasks} of {analytics.totalTasks} tasks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Weekly Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {analytics.tasksThisWeek}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">completed</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {analytics.tasksCreatedThisWeek}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">created</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Current Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {analytics.streak}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  days active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Journal Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {analytics.journalThisWeek}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  entries this week
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Task Activity Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  30-Day Task Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SafeInteractiveChart
                  data={chartData}
                  type="area"
                  width={400}
                  height={250}
                  colors={['#10B981']}
                  formatTooltip={(point) => ({
                    title: point.label,
                    content: `${point.value} tasks completed`
                  })}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  30-Day Task Creation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SafeInteractiveChart
                  data={createdChartData}
                  type="area"
                  width={400}
                  height={250}
                  colors={['#3B82F6']}
                  formatTooltip={(point) => ({
                    title: point.label,
                    content: `${point.value} tasks created`
                  })}
                />
              </CardContent>
            </Card>
          </div>

          {/* Project Distribution */}
          {projects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Project Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projects.slice(0, 5).map(project => {
                    const projectTasks = tasks.filter(task => task.projectId === project.id);
                    const completedProjectTasks = projectTasks.filter(task => task.completed);
                    const percentage = projectTasks.length > 0 
                      ? Math.round((completedProjectTasks.length / projectTasks.length) * 100) 
                      : 0;

                    return (
                      <div key={project.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {project.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: project.color 
                              }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                            {percentage}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          {/* Project Filter */}
          {projects.length > 0 && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Filter by project:</span>
              <select
                value={selectedProject?.id || ''}
                onChange={(e) => {
                  const project = projects.find(p => p.id === e.target.value);
                  setSelectedProject(project || null);
                }}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Enhanced Velocity Chart */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Task Velocity Analysis</CardTitle>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
                  advancedAnalytics.velocityTrend > 0.1 ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                  advancedAnalytics.velocityTrend < -0.1 ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {advancedAnalytics.velocityTrend > 0.1 ? (
                    <>
                      <TrendingUp className="w-3 h-3" />
                      <span>Accelerating</span>
                    </>
                  ) : advancedAnalytics.velocityTrend < -0.1 ? (
                    <>
                      <TrendingUp className="w-3 h-3 rotate-180" />
                      <span>Slowing</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-3 h-3" />
                      <span>Steady</span>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SafeInteractiveChart
                data={chartData.slice(-14)} // Last 14 days
                type="bar"
                width={800}
                height={350}
                colors={['#10B981', '#3B82F6', '#F59E0B', '#EF4444']}
                formatTooltip={(point) => ({
                  title: point.label,
                  content: `${point.value} tasks completed • ${point.value > 0 ? 'Active day' : 'No activity'}`
                })}
              />
              
              {/* Velocity insights */}
              <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{advancedAnalytics.recentMomentum}</div>
                  <div className="text-gray-500 dark:text-gray-400">Weekly Total</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{(advancedAnalytics.recentMomentum / 7).toFixed(1)}</div>
                  <div className="text-gray-500 dark:text-gray-400">Daily Average</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{advancedAnalytics.bestDay}</div>
                  <div className="text-gray-500 dark:text-gray-400">Most Productive</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Progress Chart */}
          {selectedProject && (
            <Card>
              <CardHeader>
                <CardTitle>Project Progress - {selectedProject.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const projectTasks = tasks.filter(t => t.projectId === selectedProject.id);
                    const completedTasks = projectTasks.filter(t => t.completed);
                    const pendingTasks = projectTasks.filter(t => !t.completed);
                    const completionRate = projectTasks.length > 0 ? (completedTasks.length / projectTasks.length) * 100 : 0;
                    
                    return (
                      <>
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Progress</span>
                            <span className="font-medium">{Math.round(completionRate)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div 
                              className="h-3 rounded-full transition-all duration-500"
                              style={{ 
                                width: `${completionRate}%`,
                                backgroundColor: selectedProject.color 
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {projectTasks.length}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Total Tasks</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {completedTasks.length}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                              {pendingTasks.length}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Remaining</div>
                          </div>
                        </div>
                      </>
                    );
                  })()
                  }
                </div>
              </CardContent>
            </Card>
          )}

          {/* 30-Day Completion Trend - Enhanced */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                30-Day Completion Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SafeInteractiveChart
                data={chartData}
                type="line"
                width={800}
                height={350}
                colors={['#3B82F6', '#10B981', '#F59E0B']}
                formatTooltip={(point) => ({
                  title: point.label,
                  content: `${point.value} tasks completed • ${point.value === 0 ? 'No activity' : point.value === 1 ? '1 task' : `${point.value} tasks`}`
                })}
              />
              <div className="mt-4 flex justify-between items-center text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-gray-600 dark:text-gray-400">Daily Completions</span>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Total: <span className="font-medium text-gray-700 dark:text-gray-300">{chartData.reduce((sum, d) => sum + d.value, 0)} tasks</span>
                  </div>
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  Average: <span className="font-medium text-gray-700 dark:text-gray-300">{(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length).toFixed(1)} tasks/day</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* AI-Powered Insights Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Smart Insights</h3>
              <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                AI-Powered
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {Array.isArray(storedAIInsights) && storedAIInsights.length > 0 ? `${storedAIInsights.length} stored insights` : 'No stored insights'}
            </div>
          </div>

          {/* Merged Insights Grid - Stored AI insights first, then computed insights */}
          <div className="grid gap-4">
            {/* Display stored AI insights from the database */}
            {Array.isArray(storedAIInsights) && storedAIInsights.map((insight: any) => {
              const getInsightIcon = (type: string) => {
                switch (type) {
                  case 'productivity': return <TrendingUp className="w-5 h-5 text-green-500" />;
                  case 'behavior': return <Brain className="w-5 h-5 text-blue-500" />;
                  case 'recommendation': return <Lightbulb className="w-5 h-5 text-blue-500" />;
                  case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
                  default: return <Star className="w-5 h-5 text-purple-500" />;
                }
              };
              
              const getInsightColors = (type: string) => {
                switch (type) {
                  case 'productivity':
                    return {
                      card: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
                      badge: 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200',
                      confidence: 'text-green-600 dark:text-green-400',
                      bar: 'bg-green-500'
                    };
                  case 'warning':
                    return {
                      card: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20',
                      badge: 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200',
                      confidence: 'text-orange-600 dark:text-orange-400',
                      bar: 'bg-orange-500'
                    };
                  case 'recommendation':
                    return {
                      card: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
                      badge: 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200',
                      confidence: 'text-blue-600 dark:text-blue-400',
                      bar: 'bg-blue-500'
                    };
                  default:
                    return {
                      card: 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20',
                      badge: 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200',
                      confidence: 'text-purple-600 dark:text-purple-400',
                      bar: 'bg-purple-500'
                    };
                }
              };
              
              const colors = getInsightColors(insight.type);
              const confidencePercent = Math.round((insight.confidence || 0.8) * 100);
              
              return (
                <Card key={insight.id} className={colors.card}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{insight.title}</h4>
                          <div className={`px-2 py-0.5 rounded text-xs ${colors.badge}`}>
                            {insight.type === 'productivity' ? 'AI Analysis' : 
                             insight.type === 'warning' ? 'Warning' :
                             insight.type === 'recommendation' ? 'AI Recommendation' : 'AI Insight'}
                          </div>
                          <div className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                            {insight.source?.toUpperCase() || 'AI'}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {insight.description}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className={`flex items-center space-x-1 text-xs ${colors.confidence}`}>
                            <div className={`w-8 h-1 rounded-full ${colors.bar}`} style={{ width: `${Math.max(confidencePercent / 10, 2)}px` }} />
                            <span>{confidencePercent}% confidence</span>
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(insight.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {/* Separator if both stored and computed insights exist */}
            {Array.isArray(storedAIInsights) && storedAIInsights.length > 0 && (
              <div className="flex items-center space-x-4 my-6">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Computed Insights</div>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>
            )}

            {/* Enhanced Computed Insights Grid (existing logic) */}
            {/* Achievement Insights */}
            {analytics.completionRate >= 80 && (
              <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Star className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">Outstanding Performance</h4>
                        <div className="px-2 py-0.5 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded text-xs">Achievement</div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Your {analytics.completionRate}% completion rate is exceptional! You're consistently achieving your goals and building strong productivity habits.
                      </p>
                      <div className="mt-2 flex items-center space-x-1 text-xs text-yellow-600 dark:text-yellow-400">
                        <div className="w-8 h-1 bg-yellow-500 rounded-full" />
                        <span>95% confidence</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Velocity Insights */}
            {advancedAnalytics.velocityTrend > 0.1 ? (
              <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">Accelerating Velocity</h4>
                        <div className="px-2 py-0.5 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">Pattern</div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Your task completion rate is increasing! This suggests improved efficiency and focus. Keep up the excellent momentum.
                      </p>
                      <div className="mt-2 flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
                        <div className="w-7 h-1 bg-green-500 rounded-full" />
                        <span>85% confidence</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : advancedAnalytics.velocityTrend < -0.1 ? (
              <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">Velocity Declining</h4>
                        <div className="px-2 py-0.5 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded text-xs">Warning</div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Task completion is slowing down. Consider reviewing your workload, breaking tasks into smaller pieces, or taking a strategic break.
                      </p>
                      <div className="mt-2 flex items-center space-x-1 text-xs text-orange-600 dark:text-orange-400">
                        <div className="w-6 h-1 bg-orange-500 rounded-full" />
                        <span>78% confidence</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Streak Insights */}
            {analytics.streak >= 7 && (
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">Amazing Consistency Streak</h4>
                        <div className="px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">Achievement</div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {analytics.streak} consecutive days of activity! This consistency is building powerful productivity habits and momentum.
                      </p>
                      <div className="mt-2 flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                        <div className="w-9 h-1 bg-blue-500 rounded-full" />
                        <span>92% confidence</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Priority Management Insight */}
            {advancedAnalytics.highPriorityRate > 0 && (
              <Card className={`${advancedAnalytics.highPriorityRate >= 80 ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {advancedAnalytics.highPriorityRate >= 80 ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {advancedAnalytics.highPriorityRate >= 80 ? 'Excellent Prioritization' : 'Priority Management Opportunity'}
                        </h4>
                        <div className={`px-2 py-0.5 rounded text-xs ${
                          advancedAnalytics.highPriorityRate >= 80 
                            ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200' 
                            : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                        }`}>
                          {advancedAnalytics.highPriorityRate >= 80 ? 'Achievement' : 'Recommendation'}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {advancedAnalytics.highPriorityRate >= 80 
                          ? `Outstanding ${Math.round(advancedAnalytics.highPriorityRate)}% completion rate on high-priority tasks. Your focus on important work is paying off!`
                          : `${Math.round(advancedAnalytics.highPriorityRate)}% completion rate on high-priority tasks. Consider focusing on fewer high-priority items to improve completion rates.`
                        }
                      </p>
                      <div className="mt-2 flex items-center space-x-1 text-xs">
                        <div className={`w-8 h-1 rounded-full ${advancedAnalytics.highPriorityRate >= 80 ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={advancedAnalytics.highPriorityRate >= 80 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          88% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Overdue Tasks Warning */}
            {advancedAnalytics.overdueTasks > 0 && (
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">Overdue Tasks Detected</h4>
                        <div className="px-2 py-0.5 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded text-xs">Warning</div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {advancedAnalytics.overdueTasks} task{advancedAnalytics.overdueTasks > 1 ? 's are' : ' is'} overdue. Consider reviewing deadlines and adjusting priorities to get back on track.
                      </p>
                      <div className="mt-2 flex items-center space-x-1 text-xs text-red-600 dark:text-red-400">
                        <div className="w-10 h-1 bg-red-500 rounded-full" />
                        <span>100% confidence</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Best Day Pattern */}
            <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Calendar className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">Weekly Pattern Detected</h4>
                      <div className="px-2 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded text-xs">Pattern</div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You're most productive on {advancedAnalytics.bestDay}s. Consider scheduling your most important or challenging tasks for this day.
                    </p>
                    <div className="mt-2 flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400">
                      <div className="w-6 h-1 bg-purple-500 rounded-full" />
                      <span>72% confidence</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Lightbulb className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">Smart Recommendations</h4>
                      <div className="px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">Computed</div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <p>• Schedule demanding tasks on {advancedAnalytics.bestDay}s for optimal performance</p>
                      <p>• {analytics.completionRate < 70 ? 'Break large tasks into smaller, manageable pieces' : 'Continue your effective task sizing approach'}</p>
                      <p>• {analytics.streak === 0 ? 'Start building a daily productivity habit' : `Maintain your ${analytics.streak}-day streak with consistent daily activity`}</p>
                    </div>
                    <div className="mt-2 flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                      <div className="w-7 h-1 bg-blue-500 rounded-full" />
                      <span>82% confidence</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Show message if no insights are available */}
            {(!Array.isArray(storedAIInsights) || storedAIInsights.length === 0) && analytics.completionRate < 80 && analytics.streak < 7 && advancedAnalytics.overdueTasks === 0 && (
              <Card className="border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50">
                <CardContent className="p-6 text-center">
                  <Brain className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">No AI Insights Available</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    Complete more tasks and create journal entries to unlock AI-powered insights about your productivity patterns and habits.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Activity Heatmap Tab - Enhanced */}
      {activeTab === 'heatmap' && (
        <div className="space-y-6">
          {/* GitHub-style Activity Heatmap */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity Heatmap
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {analytics.streak > 0 && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-xs">
                      <Flame className="w-3 h-3" />
                      <span>{analytics.streak} day streak</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {heatmapLoading ? (
                  /* Loading Skeleton */
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                    <div className="flex items-start">
                      <div className="w-12 flex flex-col space-y-2 mr-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                      <div className="flex space-x-2">
                        {Array.from({ length: 24 }, (_, week) => (
                          <div key={week} className="flex flex-col space-y-2">
                            {Array.from({ length: 7 }, (_, day) => (
                              <div
                                key={`${week}-${day}`}
                                className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse"
                                style={{ animationDelay: `${(week * 7 + day) * 10}ms` }}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                      <div className="flex items-center space-x-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8"></div>
                        {Array.from({ length: 5 }, (_, i) => (
                          <div key={i} className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse" />
                        ))}
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Actual Calendar Grid */
                  <div className="space-y-4">
                    <div className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Last 24 weeks</div>
                  
                  {/* Day labels */}
                  <div className="flex items-start">
                    <div className="w-12 flex flex-col space-y-2 text-xs text-gray-500 dark:text-gray-400 mr-3">
                      <div style={{height: '18px'}}></div>
                      <div>Mon</div>
                      <div style={{height: '18px'}}></div>
                      <div>Wed</div>
                      <div style={{height: '18px'}}></div>
                      <div>Fri</div>
                      <div style={{height: '18px'}}></div>
                    </div>
                    
                    {/* Calendar grid */}
                    <div className="flex space-x-2">
                      {(() => {
                        const weeks = [];
                        const today = new Date();
                        const startDate = new Date(today);
                        startDate.setDate(today.getDate() - 168); // 24 weeks ago
                        
                        // Adjust to start from Sunday
                        const dayOfWeek = startDate.getDay();
                        startDate.setDate(startDate.getDate() - dayOfWeek);
                        
                        for (let week = 0; week < 24; week++) {
                          const weekDays = [];
                          for (let day = 0; day < 7; day++) {
                            const currentDate = new Date(startDate);
                            currentDate.setDate(startDate.getDate() + (week * 7) + day);
                            const dateKey = currentDate.toISOString().split('T')[0];
                            
                            const dayTasks = tasks.filter(task => {
                              if (!task.completed) return false;
                              const taskDate = task.completedAt ? new Date(task.completedAt) : 
                                               task.updatedAt ? new Date(task.updatedAt) : 
                                               new Date(task.createdAt);
                              return taskDate.toISOString().split('T')[0] === dateKey;
                            }).length;
                            
                            const dayJournals = journalEntries.filter(entry => {
                              const entryDate = new Date(entry.date);
                              return entryDate.toISOString().split('T')[0] === dateKey;
                            }).length;
                            
                            const totalActivity = dayTasks + dayJournals;
                            const intensity = totalActivity === 0 ? 0 : Math.min(Math.ceil(totalActivity / 2), 4);
                            const isToday = currentDate.toDateString() === today.toDateString();
                            const isFuture = currentDate > today;
                            
                            const intensityColors = [
                              'bg-gray-100 dark:bg-gray-800',
                              'bg-green-200 dark:bg-green-900/40',
                              'bg-green-300 dark:bg-green-800/60',
                              'bg-green-400 dark:bg-green-700/80',
                              'bg-green-500 dark:bg-green-600'
                            ];
                            
                            weekDays.push(
                              <div
                                key={`${week}-${day}`}
                                className={`w-5 h-5 rounded-sm transition-all duration-200 hover:opacity-80 hover:scale-105 cursor-pointer ${
                                  isFuture ? 'bg-gray-50 dark:bg-gray-900' : intensityColors[intensity]
                                } border border-gray-200 dark:border-gray-700 ${
                                  isToday ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-800' : ''
                                }`}
                                title={`${currentDate.toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  month: 'long', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}: ${isFuture ? 'Future date' : `${totalActivity} activities (${dayTasks} tasks, ${dayJournals} entries)`}`}
                              />
                            );
                          }
                          weeks.push(
                            <div key={week} className="flex flex-col space-y-2">
                              {weekDays}
                            </div>
                          );
                        }
                        return weeks;
                      })()}
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>Less</span>
                      <div className="flex space-x-2">
                        {[0, 1, 2, 3, 4].map(level => (
                          <div
                            key={level}
                            className={`w-4 h-4 rounded-sm border border-gray-200 dark:border-gray-700 ${
                              level === 0 ? 'bg-gray-100 dark:bg-gray-800' :
                              level === 1 ? 'bg-green-200 dark:bg-green-900/40' :
                              level === 2 ? 'bg-green-300 dark:bg-green-800/60' :
                              level === 3 ? 'bg-green-400 dark:bg-green-700/80' :
                              'bg-green-500 dark:bg-green-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span>More</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {chartData.reduce((sum, d) => sum + d.value, 0)} tasks in last 30 days
                    </div>
                  </div>
                </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Activity Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.streak}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Current Streak</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">days active</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{(analytics.avgTasksPerDay * 7).toFixed(1)}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Weekly Average</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">tasks per week</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.tasksThisWeek}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">This Week</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">tasks completed</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.journalThisWeek}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Journal Entries</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">this week</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Best Day Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Weekly Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                    const dayStats = tasks.filter(task => {
                      if (!task.completed) return false;
                      const taskDate = task.completedAt ? new Date(task.completedAt) : 
                                       task.updatedAt ? new Date(task.updatedAt) : 
                                       new Date(task.createdAt);
                      return taskDate.getDay() === index;
                    }).length;
                    
                    const maxDayStats = Math.max(...['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((_, i) => 
                      tasks.filter(task => {
                        if (!task.completed) return false;
                        const taskDate = task.completedAt ? new Date(task.completedAt) : 
                                         task.updatedAt ? new Date(task.updatedAt) : 
                                         new Date(task.createdAt);
                        return taskDate.getDay() === i;
                      }).length
                    ), 1);
                    
                    const isTopDay = dayStats === maxDayStats && dayStats > 0;
                    
                    return (
                      <div key={day} className="text-center">
                        <div className={`p-3 rounded-lg transition-all duration-200 ${
                          isTopDay 
                            ? 'bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700' 
                            : 'bg-gray-50 dark:bg-gray-800'
                        }`}>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{day}</div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{dayStats}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">tasks</div>
                          {isTopDay && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">Most productive</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Your most productive day is <span className="font-medium text-gray-900 dark:text-white">{advancedAnalytics.bestDay}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
};