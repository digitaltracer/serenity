import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from './Button';

export interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  className,
  required = false,
  disabled = false,
  minDate,
  maxDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isDateSelected = (date: Date) => {
    if (!value) return false;
    return date.toDateString() === value.toDateString();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDateClick = (date: Date) => {
    if (!isDateDisabled(date)) {
      onChange(date);
      setIsOpen(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={cn('space-y-2', className)} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md',
            'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed',
            'hover:border-gray-400 dark:hover:border-gray-500'
          )}
        >
          <span className={cn(
            'text-sm',
            value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
          )}>
            {value ? formatDate(value) : placeholder}
          </span>
          <Calendar className="w-4 h-4 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-80 mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevMonth}
                className="w-8 h-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                className="w-8 h-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Calendar */}
            <div className="p-3">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentMonth).map((date, index) => {
                  if (!date) {
                    return <div key={index} className="w-8 h-8" />;
                  }

                  const disabled = isDateDisabled(date);
                  const selected = isDateSelected(date);
                  const today = isToday(date);

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDateClick(date)}
                      disabled={disabled}
                      className={cn(
                        'w-8 h-8 text-sm rounded-md flex items-center justify-center',
                        'hover:bg-gray-100 dark:hover:bg-gray-800',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500',
                        'disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent',
                        {
                          'bg-blue-600 text-white hover:bg-blue-700': selected,
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': today && !selected,
                          'text-gray-900 dark:text-gray-100': !selected && !today,
                        }
                      )}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-gray-500 dark:text-gray-400"
              >
                Clear
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange(new Date());
                  setIsOpen(false);
                }}
              >
                Today
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { DatePicker };