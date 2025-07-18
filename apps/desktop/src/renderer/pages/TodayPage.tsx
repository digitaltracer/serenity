import React from 'react';
import { useSelector } from 'react-redux';
import { selectTodayTasks } from '@serenity/core';
import { Card, CardHeader, CardTitle, CardContent, TaskCard, ProgressBar } from '@serenity/ui';
import { Calendar, Clock } from 'lucide-react';

export const TodayPage: React.FC = () => {
  const todayTasks = useSelector(selectTodayTasks);
  const completedToday = todayTasks.filter(task => task.completed);
  const progressToday = todayTasks.length > 0 ? (completedToday.length / todayTasks.length) * 100 : 0;

  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Today</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Focus on what matters most right now
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{dateString}</p>
      </div>

      {/* Today's Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {Math.round(progressToday)}%
            </div>
            <ProgressBar value={progressToday} variant="success" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {completedToday.length} of {todayTasks.length} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Clock className="w-5 h-5" />
              <span className="font-medium">3 tasks planned</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              2 tasks left to complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Today's Tasks
        </h2>
        
        {todayTasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No tasks scheduled for today
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You have a clear schedule today. Consider adding some tasks or take a well-deserved break!
              </p>
            </CardContent>
          </Card>
        ) : (
          todayTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={(taskId) => {
                console.log('Toggle task:', taskId);
              }}
              onClick={(task) => {
                console.log('Open task:', task);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};