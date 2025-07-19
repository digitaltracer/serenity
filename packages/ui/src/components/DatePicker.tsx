import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from './Button';
import { Portal } from './Portal';

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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
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
          ref={buttonRef}
          type="button"
          onClick={() => {
            if (!disabled) {
              if (!isOpen && buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setDropdownPosition({
                  top: rect.bottom + window.scrollY + 8,
                  left: rect.left + window.scrollX
                });
              }
              setIsOpen(!isOpen);
            }
          }}
          disabled={disabled}
          className={cn(
            // Premium date picker styling with elegant gradients and shadows
            'w-full flex items-center justify-between px-4 py-2.5 border border-gray-200/60 rounded-lg h-12',
            'bg-gradient-to-br from-white to-gray-50/30 backdrop-blur-sm text-gray-900 transition-all duration-200 ease-out',
            'shadow-sm shadow-gray-200/30 ring-1 ring-gray-100/50',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/60',
            'focus:shadow-md focus:shadow-blue-200/40',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'hover:shadow-md hover:shadow-gray-300/40',
            'dark:border-gray-600/60 dark:from-gray-800 dark:to-gray-900 dark:text-gray-100',
            'dark:shadow-black/20 dark:ring-gray-800/40',
            'dark:focus:ring-gray-400/40 dark:focus:border-gray-400/60',
            'dark:focus:shadow-black/40 dark:hover:shadow-black/30'
          )}
        >
          <span className={cn(
            'text-sm',
            value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
          )}>
            {value ? formatDate(value) : placeholder}
          </span>
          <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {isOpen && (
          <Portal>
            <div 
              ref={calendarRef}
              className="absolute z-50 w-64 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800/90 dark:to-gray-900/60 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/40 rounded-lg shadow-xl shadow-gray-300/50 dark:shadow-black/40 ring-1 ring-gray-100/80 dark:ring-gray-800/60" 
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left
              }}
            >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevMonth}
                className="w-6 h-6 p-0"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                className="w-6 h-6 p-0"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>

            {/* Calendar */}
            <div className="p-3">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-gray-600 dark:text-gray-400 py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentMonth).map((date, index) => {
                  if (!date) {
                    return <div key={index} className="w-6 h-6" />;
                  }

                  const disabled = isDateDisabled(date);
                  const selected = isDateSelected(date);
                  const today = isToday(date);

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDateClick(date);
                      }}
                      disabled={disabled}
                      className={cn(
                        'w-6 h-6 text-xs rounded-lg flex items-center justify-center transition-all duration-200',
                        'hover:bg-gray-200 hover:scale-110 dark:hover:bg-gray-700/50',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-gray-400/50',
                        'disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:scale-100',
                        'dark:disabled:text-gray-600',
                        {
                          'bg-blue-500 text-white hover:bg-blue-600 shadow-lg dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500': selected,
                          'bg-gray-300 text-gray-700 border border-gray-400 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-500/30': today && !selected,
                          'text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white': !selected && !today,
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
            <div className="flex justify-between items-center p-3 border-t border-gray-200 dark:border-gray-700/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
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
          </Portal>
        )}
      </div>
    </div>
  );
};

export { DatePicker };