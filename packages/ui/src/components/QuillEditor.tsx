'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { cn } from '../utils/cn';

export interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  readOnly?: boolean;
}

// Dynamically loaded Quill component
let ReactQuill: any = null;

const QuillEditor: React.FC<QuillEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing...',
  className,
  minHeight = 200,
  readOnly = false,
}) => {
  const quillRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [QuillComponent, setQuillComponent] = useState<any>(null);

  // Only load Quill on client-side
  useEffect(() => {
    setIsClient(true);

    // Dynamically import react-quill only on client
    const loadQuill = async () => {
      try {
        const quillModule = await import('react-quill');
        // CSS is imported via link tag or bundled separately
        ReactQuill = quillModule.default;
        setQuillComponent(() => ReactQuill);
      } catch (error) {
        console.error('Failed to load Quill editor:', error);
      }
    };

    loadQuill();
  }, []);

  // Custom toolbar configuration
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean'],
    ],
    clipboard: {
      matchVisual: false,
    },
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link',
  ];

  // Show loading state while Quill loads
  if (!isClient || !QuillComponent) {
    return (
      <div className={cn('quill-wrapper', className)}>
        <div
          className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          style={{ minHeight: `${minHeight}px` }}
        >
          <div className="p-4 text-gray-400 dark:text-gray-500">
            {placeholder}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('quill-wrapper', className)}>
      <style>{`
        .quill-wrapper .ql-container {
          font-family: inherit;
          font-size: 0.875rem;
          min-height: ${minHeight}px;
        }

        /* Light theme styles */
        .quill-wrapper .ql-snow {
          border: 1px solid rgb(209 213 219);
          border-radius: 0.5rem;
          background-color: white;
        }

        .quill-wrapper .ql-toolbar {
          border-bottom: 1px solid rgb(229 231 235);
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background-color: rgb(249 250 251);
        }

        .quill-wrapper .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          color: rgb(17 24 39);
        }

        .quill-wrapper .ql-editor.ql-blank::before {
          color: rgb(156 163 175);
          font-style: normal;
        }

        /* Dark theme styles */
        .dark .quill-wrapper .ql-snow {
          border-color: rgb(55 65 81);
          background-color: rgb(17 24 39);
        }

        .dark .quill-wrapper .ql-toolbar {
          border-bottom-color: rgb(55 65 81);
          background-color: rgb(31 41 55);
        }

        .dark .quill-wrapper .ql-container {
          color: rgb(243 244 246);
        }

        .dark .quill-wrapper .ql-editor.ql-blank::before {
          color: rgb(107 114 128);
        }

        /* Toolbar button styles */
        .quill-wrapper .ql-stroke {
          stroke: rgb(107 114 128);
        }

        .quill-wrapper .ql-fill {
          fill: rgb(107 114 128);
        }

        .quill-wrapper .ql-picker-label {
          color: rgb(107 114 128);
        }

        .dark .quill-wrapper .ql-stroke {
          stroke: rgb(156 163 175);
        }

        .dark .quill-wrapper .ql-fill {
          fill: rgb(156 163 175);
        }

        .dark .quill-wrapper .ql-picker-label {
          color: rgb(156 163 175);
        }

        /* Active/hover states */
        .quill-wrapper .ql-toolbar button:hover,
        .quill-wrapper .ql-toolbar button:focus {
          color: rgb(59 130 246);
        }

        .quill-wrapper .ql-toolbar button:hover .ql-stroke,
        .quill-wrapper .ql-toolbar button:focus .ql-stroke {
          stroke: rgb(59 130 246);
        }

        .quill-wrapper .ql-toolbar button:hover .ql-fill,
        .quill-wrapper .ql-toolbar button:focus .ql-fill {
          fill: rgb(59 130 246);
        }

        .quill-wrapper .ql-toolbar button.ql-active {
          color: rgb(59 130 246);
        }

        .quill-wrapper .ql-toolbar button.ql-active .ql-stroke {
          stroke: rgb(59 130 246);
        }

        .quill-wrapper .ql-toolbar button.ql-active .ql-fill {
          fill: rgb(59 130 246);
        }

        /* Editor content styles */
        .quill-wrapper .ql-editor {
          padding: 1rem;
          line-height: 1.625;
        }

        .quill-wrapper .ql-editor h1 {
          font-size: 2em;
          font-weight: bold;
          margin-bottom: 0.5em;
        }

        .quill-wrapper .ql-editor h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-bottom: 0.5em;
        }

        .quill-wrapper .ql-editor h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin-bottom: 0.5em;
        }

        .quill-wrapper .ql-editor blockquote {
          border-left: 4px solid rgb(209 213 219);
          padding-left: 1em;
          margin-left: 0;
          font-style: italic;
        }

        .dark .quill-wrapper .ql-editor blockquote {
          border-left-color: rgb(55 65 81);
        }

        .quill-wrapper .ql-editor pre.ql-syntax {
          background-color: rgb(243 244 246);
          color: rgb(17 24 39);
          border-radius: 0.375rem;
          padding: 0.75rem;
          overflow-x: auto;
        }

        .dark .quill-wrapper .ql-editor pre.ql-syntax {
          background-color: rgb(31 41 55);
          color: rgb(243 244 246);
        }

        .quill-wrapper .ql-editor a {
          color: rgb(59 130 246);
          text-decoration: underline;
        }

        .quill-wrapper .ql-editor ul,
        .quill-wrapper .ql-editor ol {
          padding-left: 1.5em;
        }

        .quill-wrapper .ql-editor li {
          margin-bottom: 0.25em;
        }
      `}</style>
      <QuillComponent
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  );
};

export { QuillEditor };
