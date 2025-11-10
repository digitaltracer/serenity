/**
 * Export Utilities
 * Functions for exporting analytics data to PDF and CSV formats
 */

import { Task, JournalEntry, ProductivityMetrics, VelocityAnalytics, HabitAnalytics, Insight } from './analyticsUtils';

export interface ExportData {
  metadata: {
    title: string;
    generatedAt: Date;
    timeRange: {
      start: Date;
      end: Date;
    };
    user?: string;
  };
  productivity: ProductivityMetrics;
  velocity: VelocityAnalytics;
  habits: HabitAnalytics;
  insights: Insight[];
  tasks: Task[];
  journalEntries: JournalEntry[];
}

export interface ExportOptions {
  includeRawData?: boolean;
  includeCharts?: boolean;
  format?: 'summary' | 'detailed';
  sections?: ('productivity' | 'velocity' | 'habits' | 'insights' | 'tasks' | 'journal')[];
}

// CSV Export Functions
export class CSVExporter {
  static exportProductivityMetrics(metrics: ProductivityMetrics): string {
    const headers = [
      'Metric',
      'Value',
      'Unit'
    ];

    const rows = [
      ['Completion Rate', metrics.completionRate.toString(), '%'],
      ['Average Tasks Per Day', metrics.averageTasksPerDay.toString(), 'tasks'],
      ['Current Streak', metrics.streakDays.toString(), 'days'],
      ['Best Streak', metrics.bestStreak.toString(), 'days'],
      ['Total Tasks', metrics.totalTasks.toString(), 'tasks'],
      ['Completed Tasks', metrics.completedTasks.toString(), 'tasks'],
      ['Pending Tasks', metrics.pendingTasks.toString(), 'tasks'],
      ['Average Completion Time', metrics.averageCompletionTime.toString(), 'hours'],
      ['Productivity Level', metrics.productivity, ''],
      ['Trend', metrics.trend, ''],
      ['Trend Percentage', metrics.trendPercentage.toString(), '%'],
    ];

    return this.arrayToCSV([headers, ...rows]);
  }

  static exportTasks(tasks: Task[]): string {
    const headers = [
      'ID',
      'Title',
      'Completed',
      'Priority',
      'Project ID',
      'Created At',
      'Updated At',
      'Due Date',
      'Tags'
    ];

    const rows = tasks.map(task => [
      task.id,
      task.title,
      task.completed ? 'Yes' : 'No',
      task.priority || '',
      task.projectId || '',
      task.createdAt.toISOString(),
      task.updatedAt?.toISOString() || '',
      task.dueDate?.toISOString() || '',
      task.tags?.join('; ') || ''
    ]);

    return this.arrayToCSV([headers, ...rows]);
  }

  static exportJournalEntries(entries: JournalEntry[]): string {
    const headers = [
      'ID',
      'Title',
      'Content Preview',
      'Date',
      'Tags',
      'Mood',
      'Created At',
      'Updated At'
    ];

    const rows = entries.map(entry => [
      entry.id,
      entry.title || 'Untitled',
      entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : ''),
      entry.date.toISOString(),
      entry.tags?.join('; ') || '',
      entry.mood?.toString() || '',
      entry.createdAt.toISOString(),
      entry.updatedAt?.toISOString() || ''
    ]);

    return this.arrayToCSV([headers, ...rows]);
  }

  static exportVelocityData(velocity: VelocityAnalytics): string {
    const headers = ['Period', 'Daily Velocity', 'Period Index'];
    const rows = velocity.daily.map((value, index) => [
      `Day ${index + 1}`,
      value.toString(),
      index.toString()
    ]);

    return this.arrayToCSV([headers, ...rows]);
  }

  static exportInsights(insights: Insight[]): string {
    const headers = [
      'Type',
      'Title',
      'Description',
      'Confidence',
      'Priority',
      'Category'
    ];

    const rows = insights.map(insight => [
      insight.type,
      insight.title,
      insight.description,
      (insight.confidence * 100).toFixed(1) + '%',
      insight.priority,
      insight.category
    ]);

    return this.arrayToCSV([headers, ...rows]);
  }

  static exportComplete(data: ExportData, options: ExportOptions = {}): string {
    const sections: string[] = [];
    const selectedSections = options.sections || ['productivity', 'velocity', 'habits', 'insights'];

    // Add metadata
    sections.push('# Serenity Analytics Report');
    sections.push(`Generated: ${data.metadata.generatedAt.toISOString()}`);
    sections.push(`Time Range: ${data.metadata.timeRange.start.toISOString()} to ${data.metadata.timeRange.end.toISOString()}`);
    sections.push('');

    // Add selected sections
    if (selectedSections.includes('productivity')) {
      sections.push('# Productivity Metrics');
      sections.push(this.exportProductivityMetrics(data.productivity));
      sections.push('');
    }

    if (selectedSections.includes('velocity')) {
      sections.push('# Velocity Data');
      sections.push(this.exportVelocityData(data.velocity));
      sections.push('');
    }

    if (selectedSections.includes('insights')) {
      sections.push('# Smart Insights');
      sections.push(this.exportInsights(data.insights));
      sections.push('');
    }

    if (selectedSections.includes('tasks') && options.includeRawData) {
      sections.push('# Tasks Data');
      sections.push(this.exportTasks(data.tasks));
      sections.push('');
    }

    if (selectedSections.includes('journal') && options.includeRawData) {
      sections.push('# Journal Entries');
      sections.push(this.exportJournalEntries(data.journalEntries));
      sections.push('');
    }

    return sections.join('\n');
  }

  private static arrayToCSV(data: string[][]): string {
    return data.map(row => 
      row.map(cell => 
        cell.includes(',') || cell.includes('"') || cell.includes('\n') 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join(',')
    ).join('\n');
  }
}

// PDF Export Functions (simplified - would normally use a library like jsPDF)
export class PDFExporter {
  static async exportComplete(data: ExportData, options: ExportOptions = {}): Promise<string> {
    // This is a simplified implementation
    // In a real app, you'd use jsPDF or similar library
    
    const content: string[] = [];
    
    // Title page
    content.push('SERENITY ANALYTICS REPORT');
    content.push('='.repeat(50));
    content.push('');
    content.push(`Generated: ${data.metadata.generatedAt.toLocaleDateString()}`);
    content.push(`Time Range: ${data.metadata.timeRange.start.toLocaleDateString()} - ${data.metadata.timeRange.end.toLocaleDateString()}`);
    content.push('');
    content.push('');

    // Executive Summary
    content.push('EXECUTIVE SUMMARY');
    content.push('-'.repeat(30));
    content.push(`• Completion Rate: ${data.productivity.completionRate.toFixed(1)}%`);
    content.push(`• Current Streak: ${data.productivity.streakDays} days`);
    content.push(`• Productivity Level: ${data.productivity.productivity.toUpperCase()}`);
    content.push(`• Active Days: ${data.habits.activeDays}/${data.habits.totalDays} (${(data.habits.consistency * 100).toFixed(1)}%)`);
    content.push('');
    content.push('');

    // Productivity Section
    if (!options.sections || options.sections.includes('productivity')) {
      content.push('PRODUCTIVITY METRICS');
      content.push('-'.repeat(30));
      content.push(`Completion Rate: ${data.productivity.completionRate.toFixed(1)}%`);
      content.push(`Average Tasks Per Day: ${data.productivity.averageTasksPerDay.toFixed(1)}`);
      content.push(`Current Streak: ${data.productivity.streakDays} days`);
      content.push(`Best Streak: ${data.productivity.bestStreak} days`);
      content.push(`Total Tasks: ${data.productivity.totalTasks}`);
      content.push(`Completed Tasks: ${data.productivity.completedTasks}`);
      content.push(`Pending Tasks: ${data.productivity.pendingTasks}`);
      content.push(`Average Completion Time: ${data.productivity.averageCompletionTime.toFixed(1)} hours`);
      content.push(`Productivity Level: ${data.productivity.productivity.toUpperCase()}`);
      content.push(`Trend: ${data.productivity.trend.toUpperCase()} (${data.productivity.trendPercentage}%)`);
      content.push('');
      content.push('');
    }

    // Velocity Section
    if (!options.sections || options.sections.includes('velocity')) {
      content.push('VELOCITY ANALYSIS');
      content.push('-'.repeat(30));
      content.push(`Trend: ${data.velocity.trend.toUpperCase()}`);
      content.push(`Predicted Next Period: ${data.velocity.predictedNext} tasks`);
      content.push(`Consistency: ${(data.velocity.consistency * 100).toFixed(1)}%`);
      content.push(`Volatility: ${(data.velocity.volatility * 100).toFixed(1)}%`);
      content.push('');
      content.push('Recent Daily Velocity:');
      const recentVelocity = data.velocity.daily.slice(-7);
      recentVelocity.forEach((value, index) => {
        content.push(`  Day ${index + 1}: ${value} tasks`);
      });
      content.push('');
      content.push('');
    }

    // Habits Section
    if (!options.sections || options.sections.includes('habits')) {
      content.push('HABIT ANALYSIS');
      content.push('-'.repeat(30));
      content.push(`Current Streak: ${data.habits.streakCurrent} days`);
      content.push(`Longest Streak: ${data.habits.streakLongest} days`);
      content.push(`Active Days: ${data.habits.activeDays}/${data.habits.totalDays}`);
      content.push(`Consistency: ${(data.habits.consistency * 100).toFixed(1)}%`);
      content.push(`Best Day of Week: ${data.habits.patterns.bestDayOfWeek}`);
      content.push(`Best Time of Day: ${data.habits.patterns.bestTimeOfDay}`);
      content.push('');
      content.push('');
    }

    // Insights Section
    if (!options.sections || options.sections.includes('insights')) {
      content.push('SMART INSIGHTS');
      content.push('-'.repeat(30));
      
      const highPriorityInsights = data.insights.filter(i => i.priority === 'high');
      const mediumPriorityInsights = data.insights.filter(i => i.priority === 'medium');
      
      if (highPriorityInsights.length > 0) {
        content.push('High Priority:');
        highPriorityInsights.forEach(insight => {
          content.push(`  • ${insight.title}`);
          content.push(`    ${insight.description}`);
          content.push(`    Confidence: ${(insight.confidence * 100).toFixed(0)}%`);
          content.push('');
        });
      }

      if (mediumPriorityInsights.length > 0) {
        content.push('Medium Priority:');
        mediumPriorityInsights.forEach(insight => {
          content.push(`  • ${insight.title}`);
          content.push(`    ${insight.description}`);
          content.push(`    Confidence: ${(insight.confidence * 100).toFixed(0)}%`);
          content.push('');
        });
      }
      content.push('');
    }

    // Raw data sections (if requested)
    if (options.includeRawData) {
      if (!options.sections || options.sections.includes('tasks')) {
        content.push('TASK DETAILS');
        content.push('-'.repeat(30));
        content.push(`Total Tasks: ${data.tasks.length}`);
        content.push(`Completed: ${data.tasks.filter(t => t.completed).length}`);
        content.push(`Pending: ${data.tasks.filter(t => !t.completed).length}`);
        content.push('');
        
        const recentTasks = data.tasks.slice(-10);
        content.push('Recent Tasks:');
        recentTasks.forEach(task => {
          content.push(`  ${task.completed ? '✓' : '○'} ${task.title}`);
          if (task.priority) content.push(`    Priority: ${task.priority}`);
          content.push(`    Created: ${task.createdAt.toLocaleDateString()}`);
          content.push('');
        });
      }

      if (!options.sections || options.sections.includes('journal')) {
        content.push('JOURNAL SUMMARY');
        content.push('-'.repeat(30));
        content.push(`Total Entries: ${data.journalEntries.length}`);
        const recentEntries = data.journalEntries.slice(-5);
        content.push('Recent Entries:');
        recentEntries.forEach(entry => {
          content.push(`  • ${entry.title}`);
          content.push(`    Date: ${entry.date.toLocaleDateString()}`);
          content.push(`    Preview: ${entry.content.substring(0, 80)}...`);
          content.push('');
        });
      }
    }

    // Footer
    content.push('');
    content.push('='.repeat(50));
    content.push('Generated by Serenity Notes Analytics Engine');
    content.push(`Report ID: ${Date.now()}`);

    return content.join('\n');
  }
}

// Export utilities
export class ExportManager {
  static async downloadCSV(data: ExportData, options: ExportOptions = {}, filename?: string): Promise<void> {
    const csvContent = CSVExporter.exportComplete(data, options);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, filename || `serenity-analytics-${Date.now()}.csv`);
  }

  static async downloadPDF(data: ExportData, options: ExportOptions = {}, filename?: string): Promise<void> {
    const pdfContent = await PDFExporter.exportComplete(data, options);
    const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8;' });
    this.downloadBlob(blob, filename || `serenity-analytics-${Date.now()}.txt`);
  }

  static async downloadJSON(data: ExportData, filename?: string): Promise<void> {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    this.downloadBlob(blob, filename || `serenity-analytics-${Date.now()}.json`);
  }

  private static downloadBlob(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  static prepareExportData(
    tasks: Task[],
    journalEntries: JournalEntry[],
    productivity: ProductivityMetrics,
    velocity: VelocityAnalytics,
    habits: HabitAnalytics,
    insights: Insight[],
    timeRange: { start: Date; end: Date },
    title: string = 'Serenity Analytics Report'
  ): ExportData {
    return {
      metadata: {
        title,
        generatedAt: new Date(),
        timeRange,
      },
      productivity,
      velocity,
      habits,
      insights,
      tasks,
      journalEntries,
    };
  }
}

export default ExportManager;