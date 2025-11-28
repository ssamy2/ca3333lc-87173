import { useEffect } from 'react';

export const useTelegramInit = () => {
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) return;

    webApp.ready();
    webApp.expand();
    webApp.enableClosingConfirmation();

    return () => {
      webApp.disableClosingConfirmation();
    };
  }, []);
};
