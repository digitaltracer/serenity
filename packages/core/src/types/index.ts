export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  projectId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  subtasks?: Subtask[];
  recurring?: RecurringPattern;
  userId?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  endDate?: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
  userId?: string;
}

export interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  date: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  pinned: boolean;
  mood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'stressed';
  userId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  notifications: {
    enabled: boolean;
    sounds: boolean;
    taskReminders: boolean;
    dailyReview: boolean;
  };
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

export interface Analytics {
  tasksCompleted: number;
  tasksCompletedToday: number;
  completionRate: number;
  activeStreak: number;
  journalEntries: number;
  journalEntriesThisMonth: number;
  avgWordsPerEntry: number;
  productivityTrend: 'up' | 'down' | 'stable';
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  
  // Specific, actionable goal types
  type: 'weekly_tasks' | 'project_tasks' | 'priority_tasks' | 'daily_streak' | 'journal_weekly' | 'completion_rate';
  
  // Goal-specific configuration
  config: {
    targetCount?: number;           // for count-based goals
    projectId?: string;             // for project-specific goals  
    priority?: 'high' | 'medium' | 'low'; // for priority-based goals
    streakDays?: number;            // for streak goals
    targetRate?: number;            // for completion rate goals (0-100)
    timeframe: 'daily' | 'weekly' | 'monthly';
  };
  
  // Auto-calculated progress
  progress: {
    current: number;
    target: number;
    percentage: number;
    isCompleted: boolean;
    periodStart: Date;
    periodEnd: Date;
  };
  
  status: 'active' | 'completed' | 'paused' | 'failed';
  priority: 'low' | 'medium' | 'high';
  reminders: Reminder[];
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

export interface Reminder {
  id: string;
  goalId?: string;
  taskId?: string;
  title: string;
  description?: string;
  reminderDate: Date;
  type: 'goal_check' | 'task_due' | 'habit_reminder' | 'custom';
  status: 'pending' | 'sent' | 'dismissed' | 'snoozed';
  repeatPattern?: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval: number;
    endDate?: Date;
  };
  notificationSettings: {
    enabled: boolean;
    sound: boolean;
    popup: boolean;
    beforeMinutes: number; // remind X minutes before
  };
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

// Re-export database types
export * from './database';