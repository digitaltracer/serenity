"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAutoLock = void 0;
const react_1 = require("react");
const react_redux_1 = require("react-redux");
const authSlice_1 = require("../store/slices/authSlice");
/**
 * Hook for managing auto-lock functionality
 * Tracks user activity and automatically locks the app after inactivity
 */
const useAutoLock = () => {
    const dispatch = (0, react_redux_1.useDispatch)();
    const auth = (0, react_redux_1.useSelector)(authSlice_1.selectAuth);
    const checkIntervalRef = (0, react_1.useRef)(null);
    const activityTimeoutRef = (0, react_1.useRef)(null);
    // Debounced activity updater
    const updateActivity = (0, react_1.useCallback)(() => {
        if (activityTimeoutRef.current) {
            clearTimeout(activityTimeoutRef.current);
        }
        activityTimeoutRef.current = setTimeout(() => {
            dispatch((0, authSlice_1.updateLastActivity)());
        }, 1000); // Debounce activity updates to once per second
    }, [dispatch]);
    // Activity event handler
    const handleActivity = (0, react_1.useCallback)(() => {
        // Only track activity if the app is unlocked and has master password enabled
        if (!auth.isLocked && auth.hasMasterPassword) {
            updateActivity();
        }
    }, [auth.isLocked, auth.hasMasterPassword, updateActivity]);
    // Set up activity listeners
    (0, react_1.useEffect)(() => {
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
    (0, react_1.useEffect)(() => {
        if (!auth.hasMasterPassword || auth.autoLockTimeout === 0) {
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
                checkIntervalRef.current = null;
            }
            return;
        }
        // Check for auto-lock every 30 seconds
        checkIntervalRef.current = setInterval(() => {
            dispatch((0, authSlice_1.checkAutoLock)());
        }, 30000);
        return () => {
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
            }
        };
    }, [auth.hasMasterPassword, auth.autoLockTimeout, dispatch]);
    // Cleanup on unmount
    (0, react_1.useEffect)(() => {
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
        manualLock: () => dispatch((0, authSlice_1.checkAutoLock)()), // Force auto-lock check
    };
};
exports.useAutoLock = useAutoLock;
