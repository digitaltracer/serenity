/**
 * Recharts Configuration
 * Centralized theme and styling configuration for all charts
 */

export const chartColors = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  gradient: ['#3B82F6', '#8B5CF6', '#EC4899'],
  productivity: '#3B82F6',
  wellbeing: '#10B981',
  habits: '#8B5CF6',
  goals: '#F59E0B',
};

export const chartTheme = {
  fontSize: 12,
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  axisColor: '#9CA3AF',
  gridColor: '#E5E7EB',
  tooltipBg: '#1F2937',
  tooltipColor: '#F9FAFB',
  tooltipBorder: '#374151',
};

export const darkChartTheme = {
  fontSize: 12,
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  axisColor: '#6B7280',
  gridColor: '#374151',
  tooltipBg: '#F9FAFB',
  tooltipColor: '#1F2937',
  tooltipBorder: '#E5E7EB',
};

/**
 * Get theme based on current mode
 */
export const getChartTheme = (isDark: boolean) => isDark ? darkChartTheme : chartTheme;

/**
 * Responsive chart dimensions
 */
export const chartDimensions = {
  default: {
    width: 600,
    height: 300,
  },
  small: {
    width: 300,
    height: 150,
  },
  large: {
    width: 800,
    height: 400,
  },
  sparkline: {
    width: 100,
    height: 40,
  },
};

/**
 * Common chart margins
 */
export const chartMargins = {
  default: { top: 20, right: 20, bottom: 20, left: 20 },
  withAxis: { top: 20, right: 30, bottom: 30, left: 40 },
  minimal: { top: 5, right: 5, bottom: 5, left: 5 },
};
