/**
 * Hook for managing auto-lock functionality
 * Tracks user activity and automatically locks the app after inactivity
 */
export declare const useAutoLock: () => {
    isLocked: boolean;
    hasMasterPassword: boolean;
    autoLockTimeout: number;
    lastActivity: number;
    manualLock: () => {
        payload: undefined;
        type: "auth/checkAutoLock";
    };
};
