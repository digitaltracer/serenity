/**
 * KPICard Component
 * Displays a key performance indicator with optional sparkline and change indicator
 */

import React from 'react';
import { SparklineChart } from './SparklineChart';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period?: string;
  };
  sparklineData?: number[];
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  onClick?: () => void;
  loading?: boolean;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
    sparkline: '#3B82F6',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'text-green-600 dark:text-green-400',
    sparkline: '#10B981',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'text-purple-600 dark:text-purple-400',
    sparkline: '#8B5CF6',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    icon: 'text-orange-600 dark:text-orange-400',
    sparkline: '#F59E0B',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-600 dark:text-red-400',
    sparkline: '#EF4444',
  },
};

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-4 bg-muted rounded w-1/2" />
    <div className="h-8 bg-muted rounded w-3/4" />
    <div className="h-10 bg-muted rounded" />
  </div>
);

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  sparklineData,
  icon,
  color = 'blue',
  onClick,
  loading = false,
}) => {
  const colors = colorClasses[color];

  const getChangeColor = () => {
    if (!change) return '';

    if (change.direction === 'up') return 'text-green-600 dark:text-green-400';
    if (change.direction === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const getChangeIcon = () => {
    if (!change) return null;

    if (change.direction === 'up') return <ArrowUp className="w-3 h-3" />;
    if (change.direction === 'down') return <ArrowDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const CardWrapper = onClick ? 'button' : 'div';
  const clickableProps = onClick
    ? {
        onClick,
        className: 'w-full text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
      }
    : { className: 'w-full' };

  return (
    <CardWrapper {...clickableProps}>
      <div className="bg-card rounded-lg border border-border p-4 shadow-sm h-[168px] flex flex-col">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                {title}
              </span>
              {icon && (
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <div className={`w-4 h-4 ${colors.icon}`}>
                    {icon}
                  </div>
                </div>
              )}
            </div>

            {/* Value */}
            <div className="mb-3">
              <div className="text-2xl font-bold text-foreground">
                {value}
              </div>

              {/* Change Indicator */}
              {change && (
                <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${getChangeColor()}`}>
                  {getChangeIcon()}
                  <span>{Math.abs(change.value).toFixed(2)}%</span>
                  {change.period && (
                    <span className="text-muted-foreground font-normal">
                      vs {change.period}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Sparkline */}
            <div className="flex-1 flex items-end">
              {sparklineData && sparklineData.length > 0 && (
                <div className="h-10 w-full">
                  <SparklineChart
                    data={sparklineData}
                    color={colors.sparkline}
                    height={40}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </CardWrapper>
  );
};
