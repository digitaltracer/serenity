import React from 'react';
import { CustomSelect } from './CustomSelect';
import { DatePicker } from './DatePicker';
import { Input } from './Input';
import { Button } from './Button';
import { Repeat, X } from 'lucide-react';
import { cn } from '../utils/cn';

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  endDate?: Date;
}

export interface RecurringTaskSettingsProps {
  value: RecurringPattern | null;
  onChange: (pattern: RecurringPattern | null) => void;
  className?: string;
}

const RecurringTaskSettings: React.FC<RecurringTaskSettingsProps> = ({
  value,
  onChange,
  className,
}) => {
  const [isEnabled, setIsEnabled] = React.useState(!!value);

  const handleToggle = () => {
    if (isEnabled) {
      setIsEnabled(false);
      onChange(null);
    } else {
      setIsEnabled(true);
      onChange({
        type: 'daily',
        interval: 1,
      });
    }
  };

  const handleTypeChange = (type: RecurringPattern['type']) => {
    if (value) {
      onChange({
        ...value,
        type,
      });
    }
  };

  const handleIntervalChange = (interval: number) => {
    if (value) {
      onChange({
        ...value,
        interval: Math.max(1, interval),
      });
    }
  };

  const handleEndDateChange = (endDate: Date | null) => {
    if (value) {
      onChange({
        ...value,
        endDate: endDate || undefined,
      });
    }
  };

  const typeOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'custom', label: 'Custom' },
  ];

  const getIntervalLabel = () => {
    if (!value) return '';
    switch (value.type) {
      case 'daily':
        return value.interval === 1 ? 'day' : 'days';
      case 'weekly':
        return value.interval === 1 ? 'week' : 'weeks';
      case 'monthly':
        return value.interval === 1 ? 'month' : 'months';
      case 'custom':
        return 'interval';
      default:
        return '';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="inline-flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-secondary/20 px-4 py-3">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Repeat className="w-4 h-4" />
          Recurring Task
        </span>
        <Button
          type="button"
          variant={isEnabled ? 'primary' : 'secondary'}
          size="sm"
          onClick={handleToggle}
          className="text-xs h-7 rounded-lg"
        >
          {isEnabled ? 'Enabled' : 'Enable'}
        </Button>
      </div>

      {isEnabled && value && (
        <div className="space-y-3 p-3 bg-secondary/30 rounded-lg border border-border">
          <CustomSelect
            label="Repeat Type"
            value={value.type}
            onChange={(val) => handleTypeChange(val as RecurringPattern['type'])}
            options={typeOptions}
            className="text-sm"
          />

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Repeat Every
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                value={value.interval}
                onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                className="w-20 text-sm"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getIntervalLabel()}
              </span>
            </div>
          </div>

          <DatePicker
            label="End Date (optional)"
            value={value.endDate || null}
            onChange={handleEndDateChange}
            className="text-sm"
          />

          <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
            <strong>Note:</strong> When you complete this task, a new instance will be
            automatically created for the next occurrence.
          </div>
        </div>
      )}
    </div>
  );
};

export { RecurringTaskSettings };
