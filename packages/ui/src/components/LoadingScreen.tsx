import React from 'react';
import { Shield, Lock, Key, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  progress?: number; // 0-100
  stage?: 'initializing' | 'loading' | 'deriving-key' | 'decrypting' | 'complete';
  title?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...', 
  progress = 0,
  stage = 'initializing',
  title = 'Please wait'
}) => {
  const getStageIcon = () => {
    switch (stage) {
      case 'loading':
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
      case 'deriving-key':
        return <Key className="w-8 h-8 text-blue-500" />;
      case 'decrypting':
        return <Lock className="w-8 h-8 text-green-500" />;
      case 'complete':
        return <Shield className="w-8 h-8 text-green-500" />;
      default:
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
    }
  };

  const getStageMessage = () => {
    switch (stage) {
      case 'loading':
        return 'Loading application...';
      case 'deriving-key':
        return 'Deriving encryption keys...';
      case 'decrypting':
        return 'Decrypting your data...';
      case 'complete':
        return 'Loading complete!';
      default:
        return message;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl max-w-md w-full mx-4">
        <div className="text-center">
          {/* Animated icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full mb-4">
            <div className="animate-pulse">
              {getStageIcon()}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {getStageMessage()}
          </p>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>

          {/* Progress text */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {progress > 0 && `${Math.round(progress)}% complete`}
          </div>

          {/* Info text */}
          {stage === 'deriving-key' && (
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              This may take a few seconds for security key generation
            </div>
          )}
        </div>
      </div>
    </div>
  );
};