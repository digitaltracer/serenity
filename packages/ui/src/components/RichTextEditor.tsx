'use client'

import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '../utils/cn';
import { Button } from './Button';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Link,
  Image,
  Code,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing...',
  className,
  minHeight = 200,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Range | null>(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      // Sanitize HTML content to prevent XSS attacks
      const sanitized = DOMPurify.sanitize(value, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'blockquote', 'a', 'h1', 'h2', 'h3', 'code', 'pre'],
        ALLOWED_ATTR: ['href', 'target']
      });
      editorRef.current.innerHTML = sanitized;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
    setShowToolbar(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsEditing(false);
      setShowToolbar(false);
    }, 200);
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertText = (text: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    handleInput();
  };

  const formatButton = (command: string, icon: React.ReactNode, value?: string) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => executeCommand(command, value)}
    >
      {icon}
    </Button>
  );

  const toolbarButtons = [
    { command: 'bold', icon: <Bold className="w-4 h-4" />, label: 'Bold' },
    { command: 'italic', icon: <Italic className="w-4 h-4" />, label: 'Italic' },
    { command: 'underline', icon: <Underline className="w-4 h-4" />, label: 'Underline' },
    { command: 'formatBlock', icon: <Heading1 className="w-4 h-4" />, value: 'h1', label: 'Heading 1' },
    { command: 'formatBlock', icon: <Heading2 className="w-4 h-4" />, value: 'h2', label: 'Heading 2' },
    { command: 'formatBlock', icon: <Heading3 className="w-4 h-4" />, value: 'h3', label: 'Heading 3' },
    { command: 'insertUnorderedList', icon: <List className="w-4 h-4" />, label: 'Bullet List' },
    { command: 'insertOrderedList', icon: <ListOrdered className="w-4 h-4" />, label: 'Numbered List' },
    { command: 'formatBlock', icon: <Quote className="w-4 h-4" />, value: 'blockquote', label: 'Quote' },
    { command: 'formatBlock', icon: <Code className="w-4 h-4" />, value: 'pre', label: 'Code Block' },
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          executeCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          executeCommand('underline');
          break;
        default:
          break;
      }
    }

    // Handle task creation with @task syntax
    if (e.key === ' ' && editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
          const text = textNode.textContent || '';
          const cursorPos = range.startOffset;
          const wordStart = text.lastIndexOf(' ', cursorPos - 1) + 1;
          const word = text.substring(wordStart, cursorPos);
          
          if (word === '@task') {
            e.preventDefault();
            // Replace @task with a task creation interface
            const taskElement = document.createElement('span');
            taskElement.className = 'inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm';
            taskElement.contentEditable = 'false';
            taskElement.innerHTML = '📋 Create Task';
            
            range.setStart(textNode, wordStart);
            range.setEnd(textNode, cursorPos);
            range.deleteContents();
            range.insertNode(taskElement);
            range.collapse(false);
            
            // Add a space after the task element
            range.insertNode(document.createTextNode(' '));
            range.collapse(false);
            
            selection.removeAllRanges();
            selection.addRange(range);
            
            handleInput();
          }
        }
      }
    }
  };

  const isEmptyContent = !value || value === '<br>' || value === '<div><br></div>' || value.trim() === '';

  return (
    <div className={cn(
      'relative border border-gray-700/50 rounded-lg',
      'bg-gray-900/40 backdrop-blur-sm',
      className
    )}>
      {/* Clean Toolbar */}
      {showToolbar && (
        <div className="flex items-center gap-2 p-3 border-b border-gray-700/30 bg-gray-800/30 backdrop-blur-sm rounded-t-lg">
          {toolbarButtons.map((button, index) => (
            <React.Fragment key={index}>
              {formatButton(button.command, button.icon, button.value)}
              {(index === 2 || index === 5 || index === 7) && (
                <div className="w-px h-6 bg-gray-600/50 mx-1" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className={cn(
          'w-full p-4 text-gray-100 bg-transparent',
          'focus:outline-none focus:ring-1 focus:ring-gray-400/30',
          'prose prose-sm prose-invert max-w-none',
          'placeholder:text-gray-500',
          showToolbar ? 'rounded-b-lg' : 'rounded-lg',
          {
            'text-gray-500': isEmptyContent,
          }
        )}
        style={{ minHeight }}
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Placeholder */}
      {isEmptyContent && (
        <div
          className="absolute text-gray-500 pointer-events-none"
          style={{ 
            top: showToolbar ? '68px' : '16px',
            left: '16px'
          }}
        >
          {placeholder}
        </div>
      )}
    </div>
  );
};

export { RichTextEditor };