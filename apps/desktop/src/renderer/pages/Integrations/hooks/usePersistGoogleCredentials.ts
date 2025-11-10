import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { saveGoogleCalendarCredentials } from '@serenity/core';

export const usePersistGoogleCredentials = (clientId: string, clientSecret: string) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Debounce to avoid saving on every keystroke
    const t = setTimeout(() => {
      if (clientId.trim() && clientSecret.trim()) {
        dispatch(
          saveGoogleCalendarCredentials({
            clientId: clientId.trim(),
            clientSecret: clientSecret.trim(),
          })
        );
      }
    }, 400);
    return () => clearTimeout(t);
  }, [clientId, clientSecret, dispatch]);
};


