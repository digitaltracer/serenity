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

// Re-export database types
export * from './database';