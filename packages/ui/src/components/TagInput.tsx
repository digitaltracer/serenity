import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAllUsedTags } from '@serenity/core';
import { cn } from '../utils/cn';
import { Tag, X } from 'lucide-react';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    setInputValue(newValue);
    setIsOpen(filteredSuggestions.length > 0);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (filteredSuggestions.length > 0) {
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
      
      <div className="relative">
        {/* Tags and Input Container */}
        <div className="min-h-[40px] p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-500 dark:focus-within:ring-blue-400">
          <div className="flex flex-wrap gap-1 items-center">
            {/* Existing Tags */}
            {value.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                <Tag className="w-3 h-3" />
                {tag}
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
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto"
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
                <span className="text-gray-900 dark:text-gray-100">{suggestion}</span>
              </button>
            ))}
          </div>
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