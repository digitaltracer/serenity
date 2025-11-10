import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { logger } from '@serenity/core';
import {
  setGoogleCalendarSyncEnabled,
  setGitHubSyncEnabled,
  persistIntegrationsState,
} from '@serenity/core';

interface UseSyncTogglesParams {
  setPendingAction: (a: 'google' | 'github' | 'load' | null) => void;
  setShowPasswordModal: (v: boolean) => void;
  setPassword: (v: string) => void;
  setPasswordError: (v: string) => void;
  setPendingSyncToggle: (v: { integration: 'google' | 'github'; enabled: boolean } | null) => void;
  sessionMasterPassword?: string;
  showSuccess: (t: string, m: string) => void;
  showError: (t: string, m: string) => void;
}

export const useSyncToggles = ({
  setPendingAction,
  setShowPasswordModal,
  setPassword,
  setPasswordError,
  setPendingSyncToggle,
  sessionMasterPassword,
  showSuccess,
  showError,
}: UseSyncTogglesParams) => {
  const dispatch = useDispatch();

  const toggleGoogle = useCallback(
    async (enabled: boolean) => {
      dispatch(setGoogleCalendarSyncEnabled(enabled));
      if (!sessionMasterPassword) {
        setPendingSyncToggle({ integration: 'google', enabled });
        setPendingAction('google');
        setShowPasswordModal(true);
        setPassword('');
        setPasswordError('');
        return;
      }
      try {
        const anyDispatch = dispatch as any;
        await anyDispatch(persistIntegrationsState(sessionMasterPassword));
        showSuccess('Sync Settings', `Google Calendar sync ${enabled ? 'enabled' : 'disabled'} and saved permanently.`);
      } catch (error) {
        logger.error('Failed to persist Google sync state:', { component: 'useSyncToggles', operation: 'failedPersistGoogle' }, error);
        showError('Sync Settings', 'Sync preference could not be saved permanently. Changes may be lost on restart.');
      }
    },
    [dispatch, sessionMasterPassword, setPassword, setPasswordError, setPendingAction, setPendingSyncToggle, setShowPasswordModal, showError, showSuccess]
  );

  const toggleGitHub = useCallback(
    async (enabled: boolean) => {
      dispatch(setGitHubSyncEnabled(enabled));
      if (!sessionMasterPassword) {
        setPendingSyncToggle({ integration: 'github', enabled });
        setPendingAction('github');
        setShowPasswordModal(true);
        setPassword('');
        setPasswordError('');
        return;
      }
      try {
        const anyDispatch = dispatch as any;
        await anyDispatch(persistIntegrationsState(sessionMasterPassword));
        showSuccess('Sync Settings', `GitHub sync ${enabled ? 'enabled' : 'disabled'} and saved permanently.`);
      } catch (error) {
        logger.error('Failed to persist GitHub sync state:', { component: 'useSyncToggles', operation: 'failedPersistGithub' }, error);
        showError('Sync Settings', 'Sync preference could not be saved permanently. Changes may be lost on restart.');
      }
    },
    [dispatch, sessionMasterPassword, setPassword, setPasswordError, setPendingAction, setPendingSyncToggle, setShowPasswordModal, showError, showSuccess]
  );

  return { toggleGoogle, toggleGitHub };
};


