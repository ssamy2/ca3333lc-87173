import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  userId: string | null;
  isAuthenticated: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  authenticate: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem('telegram_user_id');
    const storedSubscribed = localStorage.getItem('telegram_subscribed');

    if (storedUserId && storedSubscribed === 'true') {
      setUserId(storedUserId);
      setIsAuthenticated(true);
      setIsSubscribed(true);
      setIsLoading(false);
    } else {
      // Auto-authenticate on mount
      authenticate();
    }
  }, []);

  const authenticate = async () => {
    try {
      setIsLoading(true);

      // Get initData from Telegram WebApp
      const initData = window.Telegram?.WebApp?.initData;
      
      if (!initData) {
        throw new Error('Telegram WebApp not available');
      }

      // Send to backend for verification
      const apiUrl = 'https://www.channelsseller.site/api/verify-auth';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          init_data: initData
        })
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();

      if (data.valid) {
        setUserId(data.user_id?.toString() || null);
        setIsAuthenticated(true);
        setIsSubscribed(data.is_subscribed || false);

        // Store in localStorage
        localStorage.setItem('telegram_user_id', data.user_id?.toString() || '');
        localStorage.setItem('telegram_subscribed', data.is_subscribed ? 'true' : 'false');
        
        console.log('✅ Auth successful:', { userId: data.user_id, isSubscribed: data.is_subscribed });
      } else {
        throw new Error('Invalid authentication');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setIsAuthenticated(false);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      setIsLoading(true);
      await authenticate(); // Re-verify authentication and subscription
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <AuthContext.Provider
      value={{
        userId,
        isAuthenticated,
        isSubscribed,
        isLoading,
        authenticate,
        checkSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
