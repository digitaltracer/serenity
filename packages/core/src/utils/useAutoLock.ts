'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkAutoLock, updateLastActivity, selectAuth } from '../store/slices/authSlice';

/**
 * Hook for managing auto-lock functionality
 * Tracks user activity and automatically locks the app after inactivity
 */
export const useAutoLock = () => {
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced activity updater
  const updateActivity = useCallback(() => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    activityTimeoutRef.current = setTimeout(() => {
      dispatch(updateLastActivity());
    }, 1000); // Debounce activity updates to once per second
  }, [dispatch]);

  // Activity event handler
  const handleActivity = useCallback(() => {
    // Only track activity if the app is unlocked and has master password enabled
    if (!auth.isLocked && auth.hasMasterPassword) {
      updateActivity();
    }
  }, [auth.isLocked, auth.hasMasterPassword, updateActivity]);

  // Set up activity listeners
  useEffect(() => {
    if (!auth.hasMasterPassword || auth.isLocked) {
      return;
    }

    // List of events to track for user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus',
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [auth.hasMasterPassword, auth.isLocked, handleActivity]);

  // Set up auto-lock check interval
  useEffect(() => {
    if (!auth.hasMasterPassword || auth.autoLockTimeout === 0) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // Check for auto-lock every 30 seconds
    checkIntervalRef.current = setInterval(() => {
      dispatch(checkAutoLock());
    }, 30000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [auth.hasMasterPassword, auth.autoLockTimeout, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, []);

  // Return manual lock function and current state
  return {
    isLocked: auth.isLocked,
    hasMasterPassword: auth.hasMasterPassword,
    autoLockTimeout: auth.autoLockTimeout,
    lastActivity: auth.lastActivity,
    manualLock: () => dispatch(checkAutoLock()), // Force auto-lock check
  };
};