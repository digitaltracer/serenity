import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { logger } from '@serenity/core';
import {
  GitHubService,
  GitHubToken,
  addGitHubToken,
  removeGitHubToken,
  toggleGitHubTokenActive,
  persistIntegrationsState,
  EncryptedIntegrationService,
  store,
} from '@serenity/core';

interface UseGitHubTokensParams {
  newGithubToken: string;
  newTokenDisplayName: string;
  sessionMasterPassword?: string;
  setNewGithubToken: (v: string) => void;
  setNewTokenDisplayName: (v: string) => void;
  showSuccess: (t: string, m: string) => void;
  showError: (t: string, m: string) => void;
  getTokenById: (id: string) => GitHubToken | undefined;
}

export const useGitHubTokens = ({
  newGithubToken,
  newTokenDisplayName,
  sessionMasterPassword,
  setNewGithubToken,
  setNewTokenDisplayName,
  showSuccess,
  showError,
  getTokenById,
}: UseGitHubTokensParams) => {
  const dispatch = useDispatch();

  const addToken = useCallback(async () => {
    if (!newGithubToken.trim()) {
      alert('Please enter a GitHub personal access token');
      return;
    }

    try {
      const userInfo = await GitHubService.validateToken(newGithubToken);
      const newToken: GitHubToken = {
        id: `github_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        token: newGithubToken,
        username: userInfo.login,
        displayName: newTokenDisplayName.trim() || `${userInfo.login} Token`,
        organizations: [],
        repositories: [],
        lastSync: undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      dispatch(addGitHubToken(newToken));

      if (sessionMasterPassword) {
        try {
          const currentState = (store as any).getState();
          await EncryptedIntegrationService.saveEncryptedIntegrations(
            (currentState as any).integrations,
            sessionMasterPassword
          );
          showSuccess('GitHub Token Added', `GitHub token for ${userInfo.login} has been added and encrypted successfully.`);
        } catch (error: any) {
          logger.error('Failed to encrypt GitHub tokens:', { component: 'useGitHubTokens', operation: 'failedEncryptGithub' }, error);
          showError('Encryption Failed', `Failed to encrypt integration tokens: ${error}. Please try reconnecting.`);
        }
      } else {
        showError('Authentication Error', 'Session master password not available. Please unlock the app first.');
      }

      setNewGithubToken('');
      setNewTokenDisplayName('');
    } catch (error: any) {
      alert(`GitHub token validation failed: ${error}`);
    }
  }, [
    newGithubToken,
    newTokenDisplayName,
    sessionMasterPassword,
    setNewGithubToken,
    setNewTokenDisplayName,
    dispatch,
    showSuccess,
    showError,
  ]);

  const removeToken = useCallback(
    async (tokenId: string) => {
      const token = getTokenById(tokenId);
      if (!token) return;
      const confirmed = confirm(`Are you sure you want to remove the GitHub token for ${token.username}?`);
      if (!confirmed) return;

      dispatch(removeGitHubToken(tokenId));

      if (sessionMasterPassword) {
        try {
          const anyDispatch = dispatch as any;
          await anyDispatch(persistIntegrationsState(sessionMasterPassword));
          showSuccess('Token Removed', `GitHub token for ${token.username} has been removed successfully.`);
        } catch (error) {
          logger.error('Failed to persist token removal:', { component: 'useGitHubTokens', operation: 'failedPersistToken' }, error);
          showError('Persistence Failed', 'Token removed locally but could not be saved permanently.');
        }
      } else {
        showError('Save Required', 'Token removed locally. Please unlock the app to save changes permanently.');
      }
    },
    [dispatch, getTokenById, sessionMasterPassword, showError, showSuccess]
  );

  const toggleTokenActive = useCallback(
    async (tokenId: string, lookup: (id: string) => GitHubToken | undefined) => {
      dispatch(toggleGitHubTokenActive(tokenId));
      if (sessionMasterPassword) {
        try {
          const anyDispatch = dispatch as any;
          await anyDispatch(persistIntegrationsState(sessionMasterPassword));
          const token = lookup(tokenId);
          if (token) {
            showSuccess('Token Updated', `GitHub token for ${token.username} ${token.isActive ? 'disabled' : 'enabled'} successfully.`);
          }
        } catch (error) {
          logger.error('Failed to persist token status change:', { component: 'useGitHubTokens', operation: 'failedPersistToken' }, error);
          showError('Persistence Failed', 'Token status changed locally but could not be saved permanently.');
        }
      } else {
        showError('Save Required', 'Token status changed locally. Please unlock the app to save changes permanently.');
      }
    },
    [dispatch, sessionMasterPassword, showError, showSuccess]
  );

  return { addToken, removeToken, toggleTokenActive };
};


