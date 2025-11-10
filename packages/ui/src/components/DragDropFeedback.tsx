/**
 * Drag and Drop Feedback Component
 * Provides visual feedback for drag and drop operations
 */

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectDropFeedback, 
  selectIsDragging, 
  clearDropFeedback 
} from '@serenity/core';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  InfoIcon,
  MousePointerIcon 
} from 'lucide-react';

export const DragDropFeedback: React.FC = () => {
  const dispatch = useDispatch();
  const feedback = useSelector(selectDropFeedback);
  const isDragging = useSelector(selectIsDragging);

  // Auto-dismiss feedback after 3 seconds
  useEffect(() => {
    if (feedback.show && feedback.type !== 'info') {
      const timer = setTimeout(() => {
        dispatch(clearDropFeedback());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [feedback.show, feedback.type, dispatch]);

  if (!feedback.show && !isDragging) return null;

  return (
    <>
      {/* Drag indicator overlay */}
      {isDragging && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {/* Subtle background overlay */}
          <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-[1px]" />
          
          {/* Drag instructions */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
              <MousePointerIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                Drag to reorder or drop in different areas
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Feedback toast */}
      {feedback.show && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
          <div className={`
            flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg max-w-sm
            ${feedback.type === 'success' 
              ? 'bg-green-100 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
              : feedback.type === 'error'
              ? 'bg-red-100 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              : 'bg-blue-100 border border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
            }
          `}>
            {feedback.type === 'success' && (
              <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            )}
            {feedback.type === 'error' && (
              <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
            {feedback.type === 'info' && (
              <InfoIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
            
            <div className="flex-1">
              <p className="text-sm font-medium">{feedback.message}</p>
            </div>
            
            <button
              onClick={() => dispatch(clearDropFeedback())}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <XCircleIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Drop Zone Helper Component
 * Shows available drop zones during drag operations
 */
export const DropZoneHelper: React.FC = () => {
  const isDragging = useSelector(selectIsDragging);

  if (!isDragging) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 animate-in slide-in-from-left-2">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Drop Zones Available
        </h3>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Project areas - Assign to project</li>
          <li>• Priority zones - Change priority</li>
          <li>• Task lists - Reorder tasks</li>
          <li>• Calendar - Schedule due date</li>
        </ul>
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Hold <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl</kbd> to copy
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Combined Drag Drop Feedback Provider
 */
export const DragDropFeedbackProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <>
      {children}
      <DragDropFeedback />
      <DropZoneHelper />
    </>
  );
};