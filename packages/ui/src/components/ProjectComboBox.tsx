'use client'

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/cn';
import { ChevronDown, Check, Plus, Folder } from 'lucide-react';
import { Portal } from './Portal';
import { logger } from '@serenity/core';

export interface ProjectOption {
  id: string;
  name: string;
  color: string;
}

export interface ProjectComboBoxProps {
  projects: ProjectOption[];
  value?: string;
  onChange?: (projectId: string, projectName?: string) => void;
  onCreateProject?: (projectName: string) => string | void; // Return project ID for auto-selection
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

const ProjectComboBox: React.FC<ProjectComboBoxProps> = ({
  projects,
  value,
  onChange,
  onCreateProject,
  placeholder = 'Select or create project',
  label,
  error,
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProject = projects.find(project => project.id === value);
  
  // Filter projects based on input value
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Show "Create project" option when typing and no exact match exists
  const showCreateOption = inputValue.trim() && 
    !projects.some(p => p.name.toLowerCase() === inputValue.toLowerCase().trim()) &&
    onCreateProject;

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
        setInputValue('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!isOpen) setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    const totalOptions = filteredProjects.length + (showCreateOption ? 1 : 0) + 1; // +1 for "No Project"

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          if (highlightedIndex === 0) {
            // "No Project" option
            handleSelect('', 'No Project');
          } else if (highlightedIndex <= filteredProjects.length) {
            // Existing project
            const project = filteredProjects[highlightedIndex - 1];
            handleSelect(project.id, project.name);
          } else if (showCreateOption) {
            // Create new project
            handleCreateProject();
          }
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < totalOptions - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        setInputValue('');
        break;
    }
  };

  const handleSelect = (projectId: string, projectName?: string) => {
    onChange?.(projectId, projectName);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setInputValue('');
  };

  const handleCreateProject = () => {
    if (inputValue.trim() && onCreateProject) {
      const projectName = inputValue.trim();
      logger.info('Creating project', { component: 'ProjectComboBox', operation: 'creatingProject', metadata: { projectName } });

      const newProjectId = onCreateProject(projectName);
      logger.info('Received project ID', { component: 'ProjectComboBox', operation: 'receivedProjectId', metadata: { newProjectId } });

      // If the onCreateProject callback returns a project ID, auto-select it
      if (newProjectId && onChange) {
        logger.info('Auto-selecting project', { component: 'ProjectComboBox', operation: 'autoSelectingProject', metadata: { newProjectId, projectName } });
        onChange(newProjectId, projectName);
      } else {
        logger.warn('❌ ProjectComboBox: No project ID returned or no onChange callback', { component: 'ProjectComboBox', operation: 'projectcombobox:ProjectReturned' });
      }
      
      setInputValue('');
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleToggleDropdown = () => {
    if (!disabled) {
      if (!isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const estimatedHeight = Math.min((filteredProjects.length + 2) * 48 + 16, 240);
        const spaceBelow = window.innerHeight - rect.bottom - 10;
        const spaceAbove = rect.top - 10;
        
        const shouldPositionAbove = spaceBelow < estimatedHeight && spaceAbove > estimatedHeight;
        
        setDropdownPosition({
          top: shouldPositionAbove 
            ? rect.top + window.scrollY - estimatedHeight - 8
            : rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
      setIsOpen(!isOpen);
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
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
          onClick={handleToggleDropdown}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
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
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-gray-400" />
            <span className={cn(
              'text-sm',
              selectedProject ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
            )}>
              {selectedProject ? selectedProject.name : placeholder}
            </span>
          </div>
          <ChevronDown className={cn(
            'h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )} />
        </button>

        {isOpen && (
          <Portal>
            <div 
              ref={dropdownRef}
              className="fixed z-50 bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800/90 dark:to-gray-900/60 border border-gray-200/60 dark:border-gray-700/40 rounded-lg shadow-xl shadow-gray-300/50 dark:shadow-black/40 backdrop-blur-sm ring-1 ring-gray-100/80 dark:ring-gray-800/60 max-h-60 overflow-y-auto" 
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width
              }}
            >
              {/* Search Input */}
              <div className="p-2 border-b border-gray-200/60 dark:border-gray-700/40">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Project Name"
                  className="w-full px-3 py-2 text-sm bg-transparent border-0 focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Options */}
              <div>
                {/* No Project Option */}
                <button
                  type="button"
                  onClick={() => handleSelect('', 'No Project')}
                  className={cn(
                    'w-full px-4 py-3 text-left text-sm transition-all duration-150 flex items-center justify-between',
                    'hover:bg-gray-100/80 dark:hover:bg-gray-700/50',
                    'focus:outline-none focus:bg-gray-100/80 dark:focus:bg-gray-700/50',
                    {
                      'bg-gray-100/80 dark:bg-gray-700/50': highlightedIndex === 0,
                      'bg-blue-50/50 dark:bg-blue-900/20': !value,
                    }
                  )}
                  onMouseEnter={() => setHighlightedIndex(0)}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-gray-100">No Project</span>
                  </div>
                  {!value && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </button>

                {/* Existing Projects */}
                {filteredProjects.map((project, index) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleSelect(project.id, project.name)}
                    className={cn(
                      'w-full px-4 py-3 text-left text-sm transition-all duration-150 flex items-center justify-between',
                      'hover:bg-gray-100/80 dark:hover:bg-gray-700/50',
                      'focus:outline-none focus:bg-gray-100/80 dark:focus:bg-gray-700/50',
                      {
                        'bg-gray-100/80 dark:bg-gray-700/50': highlightedIndex === index + 1,
                        'bg-blue-50/50 dark:bg-blue-900/20': project.id === value,
                      }
                    )}
                    onMouseEnter={() => setHighlightedIndex(index + 1)}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-gray-900 dark:text-gray-100">{project.name}</span>
                    </div>
                    {project.id === value && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                ))}

                {/* Create New Project Option */}
                {showCreateOption && (
                  <button
                    type="button"
                    onClick={handleCreateProject}
                    className={cn(
                      'w-full px-4 py-3 text-left text-sm transition-all duration-150 flex items-center gap-2',
                      'hover:bg-green-50/80 dark:hover:bg-green-900/20',
                      'focus:outline-none focus:bg-green-50/80 dark:focus:bg-green-900/20',
                      'border-t border-gray-200/60 dark:border-gray-700/40',
                      {
                        'bg-green-50/80 dark:bg-green-900/20': highlightedIndex === filteredProjects.length + 1,
                      }
                    )}
                    onMouseEnter={() => setHighlightedIndex(filteredProjects.length + 1)}
                  >
                    <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300">
                      Create "{inputValue.trim()}"
                    </span>
                  </button>
                )}

                {/* Empty State */}
                {filteredProjects.length === 0 && !showCreateOption && inputValue && (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    No projects found
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

export { ProjectComboBox };
