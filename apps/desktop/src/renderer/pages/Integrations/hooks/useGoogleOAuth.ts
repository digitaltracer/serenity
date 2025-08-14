import { useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { connectGoogleCalendar, EncryptedIntegrationService, store } from '@serenity/core';

interface UseGoogleOAuthParams {
  googleClientId: string;
  googleClientSecret: string;
  currentMasterPassword: string;
  validatedMasterPassword: string;
  masterPasswordRef: React.MutableRefObject<string>;
  setIsConnecting: (connecting: boolean) => void;
}

export const useGoogleOAuth = ({
  googleClientId,
  googleClientSecret,
  currentMasterPassword,
  validatedMasterPassword,
  masterPasswordRef,
  setIsConnecting,
}: UseGoogleOAuthParams) => {
  const dispatch = useDispatch();

  // Set up OAuth event listeners
  useEffect(() => {
    if (!(window as any).electronAPI?.oauth) return;

    const handleOAuthSuccess = async (authData: any) => {
      console.log('📅 OAuth success received:', authData);

      const tempKeyFromStorage = sessionStorage.getItem('serenity_oauth_temp_key');
      const sessionStoragePassword = tempKeyFromStorage ? sessionStorage.getItem(tempKeyFromStorage) : null;

      console.log('🔍 Checking master password availability in OAuth callback:', {
        hasCurrentMasterPassword: !!currentMasterPassword,
        currentMasterPasswordLength: currentMasterPassword?.length || 0,
        hasValidatedMasterPassword: !!validatedMasterPassword,
        validatedMasterPasswordLength: validatedMasterPassword?.length || 0,
        hasMasterPasswordRef: !!masterPasswordRef.current,
        masterPasswordRefLength: masterPasswordRef.current?.length || 0,
        hasSessionStoragePassword: !!sessionStoragePassword,
        sessionStoragePasswordLength: sessionStoragePassword?.length || 0,
      });

      // Connect to Google Calendar in Redux
      dispatch(
        connectGoogleCalendar({
          ...authData,
          clientId: googleClientId.trim(),
          clientSecret: googleClientSecret.trim(),
        })
      );

      // Get the current session master password from Redux
      const currentState = (store as any).getState() as any;
      const sessionPassword = currentState.auth.sessionMasterPassword;
      console.log('🔑 Session master password available:', !!sessionPassword);

      if (sessionPassword) {
        try {
          console.log(
            '🔐 Using session master password for Google Calendar encryption (length:',
            sessionPassword.length,
            ')'
          );
          await EncryptedIntegrationService.saveEncryptedIntegrations(
            currentState.integrations,
            sessionPassword
          );
          console.log('✅ Google Calendar tokens encrypted and stored successfully');
        } catch (error) {
          console.error('❌ Failed to encrypt Google Calendar tokens:', error);
          alert('Warning: Failed to encrypt integration tokens. Please try reconnecting.');
        }
      } else {
        console.warn('⚠️ No session master password available for Google Calendar encryption');
        alert(
          'Warning: Session master password not available. Integration tokens were not encrypted. Please unlock the app first.'
        );
      }

      setIsConnecting(false);
    };

    const handleOAuthError = (error: string) => {
      console.error('OAuth error:', error);
      alert(`Google Calendar connection failed: ${error}`);
      setIsConnecting(false);
    };

    const handleOAuthCancelled = () => {
      console.log('OAuth cancelled by user');
      setIsConnecting(false);
    };

    (window as any).electronAPI.oauth.onGoogleSuccess(handleOAuthSuccess);
    (window as any).electronAPI.oauth.onGoogleError(handleOAuthError);
    (window as any).electronAPI.oauth.onGoogleCancelled(handleOAuthCancelled);

    return () => {
      (window as any).electronAPI?.oauth.removeOAuthListeners();
    };
  }, [
    dispatch,
    currentMasterPassword,
    validatedMasterPassword,
    googleClientId,
    googleClientSecret,
    masterPasswordRef,
    setIsConnecting,
  ]);

  const startOAuth = useCallback(async () => {
    console.log('📅 startOAuth called');
    if (!(window as any).electronAPI?.oauth) {
      alert('OAuth not available in this environment');
      return;
    }

    try {
      setIsConnecting(true);

      // Persist credentials in main (optional)
      if (
        googleClientId.trim() &&
        googleClientSecret.trim() &&
        (window as any).electronAPI?.auth?.setSecureSetting
      ) {
        try {
          await (window as any).electronAPI.auth.setSecureSetting('google_client_id', googleClientId.trim());
          await (window as any).electronAPI.auth.setSecureSetting('google_client_secret', googleClientSecret.trim());
        } catch (e) {
          console.warn('Failed to persist Google OAuth credentials securely:', e);
        }
      }

      const idArg = (googleClientId.trim() || undefined) as any;
      const secretArg = (googleClientSecret.trim() || undefined) as any;
      const result = await (window as any).electronAPI.oauth.googleStart(idArg, secretArg);
      if (!result.success) {
        throw new Error(result.error || 'Failed to start OAuth flow');
      }
      console.log('📅 OAuth flow started successfully');
    } catch (error) {
      console.error('Google Calendar connection failed:', error);
      alert(`Failed to start Google Calendar connection: ${error}`);
      setIsConnecting(false);
    }
  }, [googleClientId, googleClientSecret, setIsConnecting]);

  return { startOAuth };
};


