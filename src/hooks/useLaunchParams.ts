import { useState, useEffect } from 'react';

export interface LaunchParams {
  searchUser?: string;
  searchGift?: string;
  adminAccess?: boolean;
  startParam?: string;
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

      if (!startParam) {
        return;
      }

      const parsedParams: LaunchParams = { startParam };

      if (startParam.startsWith('user_')) {
        const username = startParam.replace('user_', '');
        parsedParams.searchUser = username;
        console.log('[LaunchParams] Search user param:', username);
      }
      else if (startParam.startsWith('gift_')) {
        const giftId = startParam.replace('gift_', '');
        const giftUrl = `https://t.me/nft/${giftId}`;
        parsedParams.searchGift = giftUrl;
        console.log('[LaunchParams] Search gift param:', giftUrl);
      }
      else if (startParam === 'admin_panel_2024') {
        parsedParams.adminAccess = true;
        console.log('[LaunchParams] Admin access granted');
      }

      setParams(parsedParams);
    } catch (error) {
      console.error('[LaunchParams] Error parsing launch params:', error);
    }
  }, []);

  return params;
};
