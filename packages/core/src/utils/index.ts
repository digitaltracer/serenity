import { v4 as uuidv4 } from 'uuid';
import { format, isToday, isPast, isFuture, startOfDay } from 'date-fns';

export const generateId = (): string => uuidv4();

export const formatDate = (date: Date, formatString = 'PPP'): string => {
  return format(date, formatString);
};

export const isTaskOverdue = (dueDate?: Date): boolean => {
  if (!dueDate) return false;
  return isPast(startOfDay(dueDate)) && !isToday(dueDate);
};

export const isTaskDueToday = (dueDate?: Date): boolean => {
  if (!dueDate) return false;
  return isToday(dueDate);
};

export const isTaskUpcoming = (dueDate?: Date): boolean => {
  if (!dueDate) return false;
  return isFuture(dueDate) && !isToday(dueDate);
};

export const calculateCompletionRate = (
  completed: number,
  total: number
): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const searchItems = <T extends { title: string; description?: string }>(
  items: T[],
  query: string
): T[] => {
  const lowerQuery = query.toLowerCase();
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery)
  );
};

export const sortTasksByPriority = <T extends { priority: 'low' | 'medium' | 'high' }>(
  tasks: T[]
): T[] => {
  const priorityOrder: Record<'low' | 'medium' | 'high', number> = { high: 3, medium: 2, low: 1 };
  return [...tasks].sort(
    (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
  );
};

// Export storage utilities
export * from './storage';

// Export privacy utilities
export * from './privacy';

// Export enhanced security utilities
export * from './secureStorage';
export * from './encryption';
export * from './secureExport';
export * from './useAutoLock';