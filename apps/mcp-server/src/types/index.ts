/**
 * Type definitions for MCP server
 * Re-exports types from @serenity/core and adds MCP-specific types
 */

// Import and re-export core types
import type {
  Task,
  Subtask,
  JournalEntry,
  User,
  Project,
  Goal,
} from '@serenity/core';

export type {
  Task,
  Subtask,
  JournalEntry,
  User,
  Project,
  Goal,
};

/**
 * Create task data (omit auto-generated fields)
 */
export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date | string;
  projectId?: string;
  tags?: string[];
}

/**
 * Update task data (all fields optional)
 */
export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date | string | null;
  projectId?: string | null;
  tags?: string[];
  completed?: boolean;
}

/**
 * Task filter options
 */
export interface TaskFilters {
  filter?: 'all' | 'active' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  projectId?: string;
  tags?: string[];
  search?: string;
  dueDateFrom?: Date | string;
  dueDateTo?: Date | string;
  limit?: number;
  offset?: number;
}

/**
 * Create journal entry data
 */
export interface CreateJournalData {
  title?: string;
  content: string;
  mood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'stressed';
  tags?: string[];
  date?: Date | string;
}

/**
 * Update journal entry data
 */
export interface UpdateJournalData {
  title?: string;
  content?: string;
  mood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'stressed' | null;
  tags?: string[];
}

/**
 * Journal filter options
 */
export interface JournalFilters {
  mood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'stressed';
  tags?: string[];
  dateFrom?: Date | string;
  dateTo?: Date | string;
  limit?: number;
  offset?: number;
}

/**
 * Search result for journal entries
 */
export interface SearchResult {
  entry: JournalEntry;
  relevanceScore: number;
  highlight?: string;
}

/**
 * User context for tool handlers
 */
export interface UserContext {
  userId: string;
  userEmail: string;
}
