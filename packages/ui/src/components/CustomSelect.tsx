import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/cn';
import { ChevronDown, Check, Search } from 'lucide-react';
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
  searchable?: boolean;
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
  searchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedOption = options.find(option => option.value === value);

  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          handleSelect(filteredOptions[highlightedIndex].value);
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
            prev < filteredOptions.length - 1 ? prev + 1 : prev
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
        setSearchQuery('');
        break;
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setSearchQuery('');
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
                const dropdownHeight = Math.min(options.length * 48 + 16, 240); // Estimate dropdown height
                const spaceBelow = window.innerHeight - rect.bottom - 10;
                const spaceAbove = rect.top - 10;
                
                // Position above if not enough space below
                const shouldPositionAbove = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;
                
                setDropdownPosition({
                  top: shouldPositionAbove 
                    ? rect.top + window.scrollY - dropdownHeight - 8
                    : rect.bottom + window.scrollY + 8,
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
              ref={dropdownRef}
              className="fixed z-50 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800/90 dark:to-gray-900/60 border border-gray-200/60 dark:border-gray-700/40 rounded-lg shadow-xl shadow-gray-300/50 dark:shadow-black/40 backdrop-blur-sm ring-1 ring-gray-100/80 dark:ring-gray-800/60 max-h-60 overflow-hidden flex flex-col"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width
              }}
            >
              {/* Search Input */}
              {searchable && (
                <div className="p-2 border-b border-gray-200/60 dark:border-gray-700/40">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setHighlightedIndex(-1); // Reset highlight when searching
                      }}
                      placeholder="Search models..."
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                          e.preventDefault();
                          if (filteredOptions.length > 0) {
                            setHighlightedIndex(e.key === 'ArrowDown' ? 0 : filteredOptions.length - 1);
                          }
                        } else if (e.key === 'Enter' && highlightedIndex >= 0) {
                          e.preventDefault();
                          handleSelect(filteredOptions[highlightedIndex].value);
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Options List */}
              <div className="overflow-y-auto max-h-52">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, index) => (
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
                        !searchable && 'first:rounded-t-lg',
                        'last:rounded-b-lg'
                      )}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <span className="text-gray-900 dark:text-gray-100">{option.label}</span>
                      {option.value === value && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                    No models found
                  </div>
                )}
              </div>
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