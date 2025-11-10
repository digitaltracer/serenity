/**
 * Time Range Picker Component
 * Allows users to select custom date ranges for analytics filtering
 */

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Clock, RotateCcw } from 'lucide-react';

export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
  preset?: boolean;
}

interface TimeRangePickerProps {
  value?: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
  showPresets?: boolean;
  showCustom?: boolean;
  maxDate?: Date;
  minDate?: Date;
  disabled?: boolean;
}

const DEFAULT_PRESETS: TimeRange[] = [
  {
    start: new Date(new Date().setDate(new Date().getDate() - 7)),
    end: new Date(),
    label: 'Last 7 days',
    preset: true,
  },
  {
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
    label: 'Last 30 days',
    preset: true,
  },
  {
    start: new Date(new Date().setDate(new Date().getDate() - 90)),
    end: new Date(),
    label: 'Last 3 months',
    preset: true,
  },
  {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(),
    label: 'This month',
    preset: true,
  },
  {
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    end: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
    label: 'Last month',
    preset: true,
  },
  {
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(),
    label: 'This year',
    preset: true,
  },
];

export const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
  value,
  onChange,
  className = '',
  showPresets = true,
  showCustom = true,
  maxDate = new Date(),
  minDate,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Set default value to last 30 days if not provided
  const currentRange = value || DEFAULT_PRESETS[1];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Initialize custom date inputs when opening custom tab
  useEffect(() => {
    if (isOpen && activeTab === 'custom') {
      setCustomStart(formatDateForInput(currentRange.start));
      setCustomEnd(formatDateForInput(currentRange.end));
    }
  }, [isOpen, activeTab, currentRange]);

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const handlePresetClick = (preset: TimeRange) => {
    onChange(preset);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (!customStart || !customEnd) return;

    const startDate = new Date(customStart);
    const endDate = new Date(customEnd);

    // Validate dates
    if (startDate > endDate) {
      alert('Start date must be before end date');
      return;
    }

    if (minDate && startDate < minDate) {
      alert('Start date cannot be before the minimum allowed date');
      return;
    }

    if (maxDate && endDate > maxDate) {
      alert('End date cannot be after the maximum allowed date');
      return;
    }

    const customRange: TimeRange = {
      start: startDate,
      end: endDate,
      label: `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`,
      preset: false,
    };

    onChange(customRange);
    setIsOpen(false);
  };

  const handleReset = () => {
    const defaultRange = DEFAULT_PRESETS[1]; // Last 30 days
    onChange(defaultRange);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (currentRange.preset) {
      return currentRange.label;
    }
    return `${formatDateForDisplay(currentRange.start)} - ${formatDateForDisplay(currentRange.end)}`;
  };

  const isPresetActive = (preset: TimeRange) => {
    return (
      currentRange.start.getTime() === preset.start.getTime() &&
      currentRange.end.getTime() === preset.end.getTime()
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
          rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <Calendar className="w-4 h-4" />
        <span className="whitespace-nowrap">{getDisplayText()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
          {/* Tabs */}
          {showPresets && showCustom && (
            <div className="flex border-b border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setActiveTab('presets')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'presets'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Quick Select
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'custom'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Custom Range
              </button>
            </div>
          )}

          <div className="p-4">
            {/* Presets Tab */}
            {(activeTab === 'presets' || !showCustom) && showPresets && (
              <div className="space-y-2">
                {DEFAULT_PRESETS.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetClick(preset)}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                      ${
                        isPresetActive(preset)
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {preset.label}
                  </button>
                ))}
                
                {/* Reset button */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={handleReset}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset to Default</span>
                  </button>
                </div>
              </div>
            )}

            {/* Custom Tab */}
            {(activeTab === 'custom' || !showPresets) && showCustom && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    min={minDate ? formatDateForInput(minDate) : undefined}
                    max={maxDate ? formatDateForInput(maxDate) : undefined}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    min={customStart || (minDate ? formatDateForInput(minDate) : undefined)}
                    max={maxDate ? formatDateForInput(maxDate) : undefined}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCustomApply}
                    disabled={!customStart || !customEnd}
                    className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to create time ranges
export const createTimeRange = (
  startDate: Date,
  endDate: Date,
  label?: string
): TimeRange => ({
  start: startDate,
  end: endDate,
  label: label || `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
  preset: false,
});

// Common preset ranges
export const getCommonRanges = () => ({
  today: createTimeRange(
    new Date(new Date().setHours(0, 0, 0, 0)),
    new Date(new Date().setHours(23, 59, 59, 999)),
    'Today'
  ),
  yesterday: createTimeRange(
    new Date(new Date().setDate(new Date().getDate() - 1)),
    new Date(new Date().setDate(new Date().getDate() - 1)),
    'Yesterday'
  ),
  thisWeek: createTimeRange(
    new Date(new Date().setDate(new Date().getDate() - new Date().getDay())),
    new Date(),
    'This Week'
  ),
  lastWeek: createTimeRange(
    new Date(new Date().setDate(new Date().getDate() - new Date().getDay() - 7)),
    new Date(new Date().setDate(new Date().getDate() - new Date().getDay() - 1)),
    'Last Week'
  ),
  last7Days: DEFAULT_PRESETS[0],
  last30Days: DEFAULT_PRESETS[1],
  last3Months: DEFAULT_PRESETS[2],
  thisMonth: DEFAULT_PRESETS[3],
  lastMonth: DEFAULT_PRESETS[4],
  thisYear: DEFAULT_PRESETS[5],
});