/**
 * Export Button Component
 * Provides UI for exporting analytics data in various formats
 */

import React, { useState } from 'react';
import { Download, FileText, Database, Settings, ChevronDown } from 'lucide-react';
import { ExportManager, ExportData, ExportOptions } from '../utils/exportUtils';

interface ExportButtonProps {
  data: ExportData;
  className?: string;
  variant?: 'button' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onExportStart?: () => void;
  onExportComplete?: (format: string) => void;
  onExportError?: (error: Error) => void;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  className = '',
  variant = 'dropdown',
  size = 'md',
  disabled = false,
  onExportStart,
  onExportComplete,
  onExportError,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const [customOptions, setCustomOptions] = useState<ExportOptions>({
    includeRawData: false,
    includeCharts: false,
    format: 'summary',
    sections: ['productivity', 'velocity', 'habits', 'insights'],
  });

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const handleExport = async (format: 'csv' | 'pdf' | 'json', options: ExportOptions = {}) => {
    if (disabled || isExporting) return;

    try {
      setIsExporting(true);
      onExportStart?.();

      const filename = `serenity-analytics-${new Date().toISOString().split('T')[0]}`;

      switch (format) {
        case 'csv':
          await ExportManager.downloadCSV(data, options, `${filename}.csv`);
          break;
        case 'pdf':
          await ExportManager.downloadPDF(data, options, `${filename}.txt`);
          break;
        case 'json':
          await ExportManager.downloadJSON(data, `${filename}.json`);
          break;
      }

      onExportComplete?.(format);
      setIsOpen(false);
    } catch (error) {
      onExportError?.(error as Error);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSection = (section: string) => {
    setCustomOptions(prev => ({
      ...prev,
      sections: prev.sections?.includes(section as any)
        ? prev.sections.filter(s => s !== section)
        : [...(prev.sections || []), section as any],
    }));
  };

  if (variant === 'button') {
    return (
      <button
        onClick={() => handleExport('csv')}
        disabled={disabled || isExporting}
        className={`
          flex items-center space-x-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
          disabled:opacity-50 disabled:cursor-not-allowed transition-colors
          ${sizeClasses[size]} ${className}
        `}
      >
        <Download className="w-4 h-4" />
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting}
        className={`
          flex items-center space-x-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
          disabled:opacity-50 disabled:cursor-not-allowed transition-colors
          ${sizeClasses[size]}
        `}
      >
        <Download className="w-4 h-4" />
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Export Options</h4>
            
            {/* Quick Export Options */}
            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleExport('csv', { format: 'summary' })}
                disabled={isExporting}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">CSV Summary</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Key metrics and insights</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('pdf', { format: 'detailed' })}
                disabled={isExporting}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4 text-red-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">PDF Report</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Comprehensive report</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Database className="w-4 h-4 text-blue-600" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">JSON Data</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Raw structured data</div>
                </div>
              </button>
            </div>

            {/* Custom Options Toggle */}
            <button
              onClick={() => setShowCustomOptions(!showCustomOptions)}
              className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Custom Options</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showCustomOptions ? 'rotate-180' : ''}`} />
            </button>

            {/* Custom Options Panel */}
            {showCustomOptions && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="space-y-3">
                  {/* Format Options */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Report Format
                    </label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCustomOptions(prev => ({ ...prev, format: 'summary' }))}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          customOptions.format === 'summary'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                        }`}
                      >
                        Summary
                      </button>
                      <button
                        onClick={() => setCustomOptions(prev => ({ ...prev, format: 'detailed' }))}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          customOptions.format === 'detailed'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                        }`}
                      >
                        Detailed
                      </button>
                    </div>
                  </div>

                  {/* Sections */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Include Sections
                    </label>
                    <div className="space-y-1">
                      {['productivity', 'velocity', 'habits', 'insights', 'tasks', 'journal'].map(section => (
                        <label key={section} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={customOptions.sections?.includes(section as any) || false}
                            onChange={() => toggleSection(section)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                            {section}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Additional Options */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={customOptions.includeRawData || false}
                        onChange={(e) => setCustomOptions(prev => ({ ...prev, includeRawData: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Include raw data</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={customOptions.includeCharts || false}
                        onChange={(e) => setCustomOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Include charts</span>
                    </label>
                  </div>

                  {/* Custom Export Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => handleExport('csv', customOptions)}
                      disabled={isExporting}
                      className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport('pdf', customOptions)}
                      disabled={isExporting}
                      className="flex-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};