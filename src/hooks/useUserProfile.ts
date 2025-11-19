import { useState, useEffect } from 'react';

export interface TelegramUser {
  username: string;
  fullName: string;
  photoUrl: string;
}

export const useUserProfile = () => {
  const [user, setUser] = useState<TelegramUser>({
    username: '',
    fullName: '',
    photoUrl: ''
  });

  useEffect(() => {
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    
    if (telegramUser) {
      const username = telegramUser.username || 'user';
      const fullName = [telegramUser.first_name, telegramUser.last_name]
        .filter(Boolean)
        .join(' ') || 'User';
      const photoUrl = (telegramUser as any).photo_url || '';

      setUser({ username, fullName, photoUrl });
    } else {
      setUser({
        username: 'demo_user',
        fullName: 'Demo User',
        photoUrl: ''
      });
    }
  }, []);

  return user;
};
