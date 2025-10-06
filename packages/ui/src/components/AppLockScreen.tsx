/// <reference path="../../../core/src/types/electron.d.ts" />
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { logger } from '@serenity/core';
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader,
  Shield,
  KeyRound,
  Fingerprint
} from 'lucide-react';

interface AppLockScreenProps {
  onUnlock: (password: string) => Promise<boolean>;
  onForgotPassword?: () => void;
  isValidating?: boolean;
  error?: string;
  attempts?: number;
  maxAttempts?: number;
  lockoutTime?: number; // in seconds
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  onUnlock,
  onForgotPassword,
  isValidating = false,
  error,
  attempts = 0,
  maxAttempts = 5,
  lockoutTime = 0
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingLockoutTime, setRemainingLockoutTime] = useState(lockoutTime);
  
  // Touch ID state
  const [touchIdAvailable, setTouchIdAvailable] = useState(false);
  const [touchIdAuthenticating, setTouchIdAuthenticating] = useState(false);

  // Check Touch ID availability on mount
  useEffect(() => {
    const checkTouchIdAvailability = async () => {
      if ((window.electronAPI as any)?.biometric?.isAvailable) {
        try {
          const result = await (window.electronAPI as any).biometric.isAvailable();
          setTouchIdAvailable(result.available);
        } catch (error) {
          logger.error('Failed to check Touch ID availability:', { component: 'AppLockScreen', operation: 'failedCheckTouch' }, error as Error);
          setTouchIdAvailable(false);
        }
      }
    };

    checkTouchIdAvailability();
  }, []);

  // Handle Touch ID authentication
  const handleTouchIdAuth = useCallback(async () => {
    if (!touchIdAvailable || touchIdAuthenticating) return;

    setTouchIdAuthenticating(true);
    try {
      if ((window.electronAPI as any)?.biometric?.authenticate) {
        const result = await (window.electronAPI as any).biometric.authenticate('Unlock Serenity Notes');
        if (result.success) {
          // Touch ID succeeded, unlock without password
          await onUnlock(''); // Empty password since we used biometric auth
        } else if (!result.cancelled) {
          // Only show error if not cancelled by user
          logger.error('Touch ID failed:', { component: 'AppLockScreen', operation: 'touchFailed:' }, result.error);
        }
      }
    } catch (error) {
      logger.error('Touch ID error:', { component: 'AppLockScreen', operation: 'touchError:' }, error as Error);
    } finally {
      setTouchIdAuthenticating(false);
    }
  }, [touchIdAvailable, touchIdAuthenticating, onUnlock]);

  // Handle lockout countdown
  useEffect(() => {
    if (remainingLockoutTime > 0) {
      const interval = setInterval(() => {
        setRemainingLockoutTime(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [remainingLockoutTime]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim() || isSubmitting || remainingLockoutTime > 0) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = await onUnlock(password);
      if (success) {
        setPassword('');
      }
    } catch (error) {
      logger.error('Unlock failed:', { component: 'AppLockScreen', operation: 'unlockFailed:' }, error as Error);
    } finally {
      setIsSubmitting(false);
    }
  }, [password, onUnlock, isSubmitting, remainingLockoutTime]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  }, [handleSubmit]);

  const formatLockoutTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const isLocked = remainingLockoutTime > 0;
  const attemptsRemaining = maxAttempts - attempts;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      {/* Lock Screen Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/30 p-8 transform-gpu">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg shadow-blue-500/20">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Serenity Notes
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter your master password to unlock
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Master Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter master password"
                  className="pl-10 pr-12 py-3 text-lg"
                  disabled={isSubmitting || isLocked}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={isSubmitting || isLocked}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Lockout Message */}
            {isLocked && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/50">
                <Shield className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  <p className="font-medium">Too many failed attempts</p>
                  <p>Try again in {formatLockoutTime(remainingLockoutTime)}</p>
                </div>
              </div>
            )}

            {/* Attempts Warning */}
            {!isLocked && attempts > 0 && attemptsRemaining > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {attemptsRemaining === 1 
                    ? 'Last attempt before temporary lockout'
                    : `${attemptsRemaining} attempts remaining`
                  }
                </p>
              </div>
            )}

            {/* Unlock Button */}
            <Button
              type="submit"
              className="w-full py-3 text-lg font-medium"
              disabled={!password.trim() || isSubmitting || isLocked}
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Validating...
                </>
              ) : isLocked ? (
                'Locked'
              ) : (
                'Unlock'
              )}
            </Button>

            {/* Touch ID Button */}
            {touchIdAvailable && !isLocked && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleTouchIdAuth}
                  disabled={touchIdAuthenticating || isSubmitting}
                  className="w-full py-3 text-lg font-medium"
                >
                  {touchIdAuthenticating ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-5 h-5 mr-2" />
                      Use Touch ID
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Divider between authentication methods */}
            {touchIdAvailable && !isLocked && (
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>
            )}

            {/* Forgot Password */}
            {onForgotPassword && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                  disabled={isSubmitting}
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Your data is protected</p>
                <p>All sensitive information is encrypted with your master password.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Version Info */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Serenity Notes v2.0 • Privacy-First Productivity
          </p>
        </div>
      </div>
    </div>
  );
};