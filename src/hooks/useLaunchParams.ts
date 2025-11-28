import { useState, useEffect } from 'react';

export interface LaunchParams {
  searchUser?: string;
  searchGift?: string;
  adminAccess?: boolean;
  adminAds?: boolean;
  startParam?: string;
  startapp?: string;
}

export const useLaunchParams = (): LaunchParams => {
  const [params, setParams] = useState<LaunchParams>({});

  useEffect(() => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        console.log('[LaunchParams] Telegram WebApp not available');
        return;
      }

      const initData = tg.initDataUnsafe;
      const startParam = initData?.start_param;

      console.log('[LaunchParams] Start param:', startParam);
      console.log('[LaunchParams] Full initData:', initData);

      // Also check for tgWebAppStartParam in URL
      const urlParams = new URLSearchParams(window.location.search);
      const tgWebAppStartParam = urlParams.get('tgWebAppStartParam');
      
      console.log('[LaunchParams] tgWebAppStartParam:', tgWebAppStartParam);

      const paramToUse = startParam || tgWebAppStartParam;

      if (!paramToUse) {
        return;
      }

      const parsedParams: LaunchParams = { 
        startParam: paramToUse,
        startapp: paramToUse 
      };

      if (paramToUse.startsWith('user_')) {
        const username = paramToUse.replace('user_', '');
        parsedParams.searchUser = username;
        console.log('[LaunchParams] Search user param:', username);
      }
      else if (paramToUse.startsWith('gift_')) {
        const giftId = paramToUse.replace('gift_', '');
        const giftUrl = `https://t.me/nft/${giftId}`;
        parsedParams.searchGift = giftUrl;
        console.log('[LaunchParams] Search gift param:', giftUrl);
      }
      else if (paramToUse === 'admin_panel_2024' || paramToUse === 'admin') {
        parsedParams.adminAccess = true;
        console.log('[LaunchParams] Admin access granted');
      }
      else if (paramToUse === 'admin_ads') {
        parsedParams.adminAds = true;
        console.log('[LaunchParams] Admin ads access granted');
      }

      setParams(parsedParams);
    } catch (error) {
      console.error('[LaunchParams] Error parsing launch params:', error);
    }
  }, []);

  return params;
};
