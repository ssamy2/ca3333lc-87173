import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  userId: string | null;
  isAuthenticated: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  authError: boolean;
  authenticate: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    // دائماً نصادق للحصول على توكن جديد
    // لأن Telegram ينتج initData جديد في كل مرة
    // والباك اند يحتاج توكن جديد لكل جلسة
    authenticate();
  }, []);

  const authenticate = async () => {
    try {
      setIsLoading(true);
      setAuthError(false);

      // Get initData from Telegram WebApp
      const initData = window.Telegram?.WebApp?.initData;
      
      if (!initData) {
        console.error('Telegram WebApp not available');
        setAuthError(true);
        setIsLoading(false);
        return;
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
        console.error('Authentication failed with status:', response.status);
        setAuthError(true);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.valid) {
        setUserId(data.user_id?.toString() || null);
        setIsAuthenticated(true);
        setIsSubscribed(data.is_subscribed || false);
        setAuthError(false);

        // لا نحفظ بيانات المصادقة في localStorage
        // الكاش للصور فقط - المصادقة تتم في كل مرة
      } else {
        console.error('Invalid authentication response');
        setAuthError(true);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setIsAuthenticated(false);
      setIsSubscribed(false);
      setAuthError(true);
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
        authError,
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
