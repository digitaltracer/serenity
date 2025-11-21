'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components';
import { Brain, Lightbulb, TrendingUp, Sparkles, BarChart3, Target } from 'lucide-react';

/**
 * Shared InsightsPage component (simplified version)
 */
export const InsightsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Insights Hub
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          AI-powered insights and analytics for your productivity
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tasks Completed</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">24</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">+12% from last week</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Productivity Score</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">87%</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">+5% improvement</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Streak</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">7 days</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Keep it up!</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          AI Insights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Peak Productivity Time</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Based on completion patterns</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                You're most productive between <span className="font-semibold">9 AM - 11 AM</span>.
                Consider scheduling important tasks during this time for optimal results.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Task Completion Trend</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Weekly analysis</p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                Your completion rate has increased by <span className="font-semibold">15%</span> this week.
                You're on track to exceed your monthly goals!
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Project Focus</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Time allocation</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                You've spent <span className="font-semibold">60%</span> of your time on high-priority tasks.
                Great job maintaining focus on what matters most!
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Journaling Consistency</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Reflection habits</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                You've journaled <span className="font-semibold">5 times</span> this week.
                Regular reflection helps maintain clarity and motivation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Features Placeholder */}
      <Card>
        <CardContent className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Advanced AI Insights Coming Soon
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Connect your AI provider in Settings to unlock personalized insights, trend analysis,
            and AI-powered recommendations based on your productivity patterns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
