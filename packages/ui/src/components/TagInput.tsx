import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAllUsedTags } from '@serenity/core';
import { cn } from '../utils/cn';
import { Tag, X } from 'lucide-react';
import { Portal } from './Portal';

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  maxTags?: number;
}

const TagInput: React.FC<TagInputProps> = ({
  value = [],
  onChange,
  placeholder = 'Add a tag...',
  label,
  className,
  maxTags = 10,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allUsedTags = useSelector(selectAllUsedTags);
  
  const getSuggestions = (query: string) => {
    if (!query.trim()) return allUsedTags.slice(0, 10);
    
    const queryLower = query.toLowerCase();
    return allUsedTags
      .filter(tag => tag.toLowerCase().includes(queryLower))
      .sort((a, b) => {
        // Prioritize tags that start with the query
        const aStarts = a.toLowerCase().startsWith(queryLower);
        const bStarts = b.toLowerCase().startsWith(queryLower);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 10);
  };
  
  const suggestions = getSuggestions(inputValue);
  const filteredSuggestions = suggestions.filter(tag => !value.includes(tag));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Check if user typed a comma
    if (newValue.includes(',')) {
      const beforeComma = newValue.split(',')[0].trim();
      const afterComma = newValue.split(',').slice(1).join(',');
      
      if (beforeComma) {
        addTag(beforeComma);
      }
      
      setInputValue(afterComma);
      return;
    }
    
    setInputValue(newValue);
    if (getSuggestions(newValue).filter(tag => !value.includes(tag)).length > 0) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (filteredSuggestions.length > 0) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
      setIsOpen(true);
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
      onChange([...value, trimmedTag]);
      setInputValue('');
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        addTag(filteredSuggestions[highlightedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handleSuggestionClick = (tag: string) => {
    addTag(tag);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <div className="relative" ref={containerRef}>
        {/* Tags and Input Container */}
        <div className="min-h-[48px] p-3 border border-gray-200/60 rounded-lg bg-gradient-to-br from-white to-gray-50/30 backdrop-blur-sm shadow-sm shadow-gray-200/30 ring-1 ring-gray-100/50 dark:border-gray-600/60 dark:from-gray-800 dark:to-gray-900 dark:shadow-black/20 dark:ring-gray-800/40 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-400/60 focus-within:from-blue-50/30 focus-within:to-white focus-within:shadow-md focus-within:shadow-blue-200/40 dark:focus-within:ring-gray-400/40 dark:focus-within:border-gray-400/60 dark:focus-within:from-gray-800 dark:focus-within:to-gray-900 dark:focus-within:shadow-black/40 transition-all duration-200 ease-out">
          <div className="flex flex-wrap gap-1 items-center">
            {/* Existing Tags */}
            {value.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 max-w-32"
                title={tag}
              >
                <Tag className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none"
                  aria-label={`Remove ${tag} tag`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Input */}
            {value.length < maxTags && (
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={handleKeyDown}
                placeholder={value.length === 0 ? placeholder : ''}
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && filteredSuggestions.length > 0 && (
          <Portal>
            <div
              ref={dropdownRef}
              className="absolute z-50 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800/90 dark:to-gray-900/60 border border-gray-200/60 dark:border-gray-700/40 rounded-lg shadow-xl shadow-gray-300/50 dark:shadow-black/40 backdrop-blur-sm ring-1 ring-gray-100/80 dark:ring-gray-800/60 max-h-48 overflow-y-auto" 
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width
              }}
            >
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 focus:outline-none flex items-center gap-2',
                  {
                    'bg-gray-100 dark:bg-gray-800': index === highlightedIndex,
                  }
                )}
              >
                <Tag className="w-3 h-3 text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100 truncate" title={suggestion}>{suggestion}</span>
              </button>
            ))}
            </div>
          </Portal>
        )}
      </div>

      {/* Helper Text */}
      {value.length >= maxTags && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Maximum {maxTags} tags allowed
        </p>
      )}
    </div>
  );
};

export { TagInput };