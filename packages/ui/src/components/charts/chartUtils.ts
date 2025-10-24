/**
 * Chart Utilities
 * Helper functions for data transformation, formatting, and chart operations
 */

/**
 * Format date for chart display
 */
export const formatChartDate = (
  dateString: string,
  format: 'short' | 'medium' | 'long' = 'medium'
): string => {
  const date = new Date(dateString);

  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'long':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'medium':
    default:
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit'
      });
  }
};

/**
 * Format number for chart display
 */
export const formatChartNumber = (
  value: number,
  options: {
    decimals?: number;
    compact?: boolean;
    percentage?: boolean;
  } = {}
): string => {
  const { decimals = 0, compact = false, percentage = false } = options;

  if (percentage) {
    return `${value.toFixed(decimals)}%`;
  }

  if (compact && value >= 1000) {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
  }

  return value.toFixed(decimals);
};

/**
 * Generate color palette for multiple series
 */
export const generateColorPalette = (count: number, baseColors?: string[]): string[] => {
  const defaultColors = [
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#10B981', // green
    '#F59E0B', // orange
    '#06B6D4', // cyan
    '#EF4444', // red
    '#6366F1', // indigo
  ];

  const colors = baseColors || defaultColors;
  const palette: string[] = [];

  for (let i = 0; i < count; i++) {
    palette.push(colors[i % colors.length]);
  }

  return palette;
};

/**
 * Fill gaps in time series data
 */
export const fillTimeSeriesGaps = <T extends { timestamp: string; value: number }>(
  data: T[],
  granularity: 'day' | 'week' | 'month' = 'day'
): T[] => {
  if (data.length === 0) return [];

  const sorted = [...data].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const start = new Date(sorted[0].timestamp);
  const end = new Date(sorted[sorted.length - 1].timestamp);
  const filled: T[] = [];

  const incrementDate = (date: Date): Date => {
    const newDate = new Date(date);
    switch (granularity) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    return newDate;
  };

  let currentDate = new Date(start);
  let dataIndex = 0;

  while (currentDate <= end) {
    const currentTimestamp = currentDate.toISOString().split('T')[0];
    const existingData = sorted.find(d =>
      d.timestamp.startsWith(currentTimestamp)
    );

    if (existingData) {
      filled.push(existingData);
      dataIndex++;
    } else {
      // Create placeholder with zero value
      filled.push({
        ...sorted[0],
        timestamp: currentDate.toISOString(),
        value: 0,
      } as T);
    }

    currentDate = incrementDate(currentDate);
  }

  return filled;
};

/**
 * Calculate moving average
 */
export const calculateMovingAverage = (
  data: number[],
  window: number
): number[] => {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(data[i]);
      continue;
    }

    const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / window);
  }

  return result;
};

/**
 * Aggregate data by time period
 */
export const aggregateByTimePeriod = <T extends { timestamp: string; value: number }>(
  data: T[],
  period: 'day' | 'week' | 'month',
  aggregation: 'sum' | 'average' | 'max' | 'min' = 'sum'
): Array<{ timestamp: string; value: number }> => {
  const groups = new Map<string, number[]>();

  data.forEach(item => {
    const date = new Date(item.timestamp);
    let key: string;

    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item.value);
  });

  const result: Array<{ timestamp: string; value: number }> = [];

  groups.forEach((values, timestamp) => {
    let aggregatedValue: number;

    switch (aggregation) {
      case 'sum':
        aggregatedValue = values.reduce((a, b) => a + b, 0);
        break;
      case 'average':
        aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'max':
        aggregatedValue = Math.max(...values);
        break;
      case 'min':
        aggregatedValue = Math.min(...values);
        break;
    }

    result.push({ timestamp, value: aggregatedValue });
  });

  return result.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
};

/**
 * Get domain (min, max) with padding
 */
export const getDataDomain = (
  data: number[],
  paddingPercent: number = 10
): [number, number] => {
  if (data.length === 0) return [0, 100];

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const padding = range * (paddingPercent / 100);

  return [
    Math.max(0, min - padding),
    max + padding
  ];
};
