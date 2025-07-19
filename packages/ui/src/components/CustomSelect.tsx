import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/cn';
import { ChevronDown, Check } from 'lucide-react';
import { Portal } from './Portal';

export interface CustomSelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  options: CustomSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex].value);
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div className={cn('space-y-2', className)} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
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
                  left: rect.left + window.scrollX,
                  width: rect.width
                });
              }
              setIsOpen(!isOpen);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            // Premium select styling with elegant gradients and shadows
            'flex h-12 w-full items-center justify-between rounded-lg border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/30 backdrop-blur-sm px-4 py-2.5 text-base',
            'text-gray-900 transition-all duration-200 ease-out',
            'shadow-sm shadow-gray-200/30 ring-1 ring-gray-100/50',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/60',
            'focus:shadow-md focus:shadow-blue-200/40',
            'dark:border-gray-600/60 dark:from-gray-800 dark:to-gray-900 dark:text-gray-100',
            'dark:shadow-black/20 dark:ring-gray-800/40',
            'dark:focus:ring-gray-400/40 dark:focus:border-gray-400/60',
            'dark:focus:shadow-black/40',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'cursor-pointer',
            {
              'border-red-500/60 focus:ring-red-500/40 focus:border-red-500/60': error,
            }
          )}
        >
          <span className={cn(
            'text-sm',
            selectedOption ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={cn(
            'h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )} />
        </button>

        {isOpen && (
          <Portal>
            <div 
              className="absolute z-50 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800/90 dark:to-gray-900/60 border border-gray-200/60 dark:border-gray-700/40 rounded-lg shadow-xl shadow-gray-300/50 dark:shadow-black/40 backdrop-blur-sm ring-1 ring-gray-100/80 dark:ring-gray-800/60 max-h-60 overflow-y-auto" 
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width
              }}
            >
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'w-full px-4 py-3 text-left text-sm transition-all duration-150 flex items-center justify-between',
                  'hover:bg-gray-100/80 dark:hover:bg-gray-700/50',
                  'focus:outline-none focus:bg-gray-100/80 dark:focus:bg-gray-700/50',
                  {
                    'bg-gray-100/80 dark:bg-gray-700/50': index === highlightedIndex,
                    'bg-blue-50/50 dark:bg-blue-900/20': option.value === value,
                  },
                  'first:rounded-t-lg last:rounded-b-lg'
                )}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="text-gray-900 dark:text-gray-100">{option.label}</span>
                {option.value === value && (
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            ))}
            </div>
          </Portal>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <span className="w-1 h-1 bg-red-400 rounded-full"></span>
          {error}
        </p>
      )}
    </div>
  );
};

export { CustomSelect };