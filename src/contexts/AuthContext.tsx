import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  token: string | null;
  operationsRemaining: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  username: string | null;
  authenticate: (initData: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [operationsRemaining, setOperationsRemaining] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing token in localStorage
    const storedToken = localStorage.getItem('telegram_auth_token');
    const storedOperations = localStorage.getItem('operations_remaining');
    const storedUserId = localStorage.getItem('user_id');
    const storedUsername = localStorage.getItem('username');

    if (storedToken && storedOperations) {
      setToken(storedToken);
      setOperationsRemaining(parseInt(storedOperations));
      setUserId(storedUserId);
      setUsername(storedUsername);
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, []);

  const authenticate = async (initData: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: { initData }
      });

      if (error) throw error;

      if (data.success) {
        setToken(data.token);
        setOperationsRemaining(data.operations_remaining);
        setUserId(data.user_id);
        setUsername(data.username);
        setIsAuthenticated(true);

        // Store in localStorage
        localStorage.setItem('telegram_auth_token', data.token);
        localStorage.setItem('operations_remaining', data.operations_remaining.toString());
        localStorage.setItem('user_id', data.user_id);
        if (data.username) localStorage.setItem('username', data.username);
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setOperationsRemaining(0);
    setUserId(null);
    setUsername(null);
    setIsAuthenticated(false);
    localStorage.removeItem('telegram_auth_token');
    localStorage.removeItem('operations_remaining');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
  };

  const updateOperationsRemaining = (count: number) => {
    setOperationsRemaining(count);
    localStorage.setItem('operations_remaining', count.toString());

    if (count <= 0) {
      logout();
    }
  };

  // Listen for operations count updates from API calls
  useEffect(() => {
    const handleOperationsUpdate = (event: CustomEvent) => {
      updateOperationsRemaining(event.detail.operationsRemaining);
    };

    window.addEventListener('operationsUpdate' as any, handleOperationsUpdate);

    return () => {
      window.removeEventListener('operationsUpdate' as any, handleOperationsUpdate);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        operationsRemaining,
        isAuthenticated,
        isLoading,
        userId,
        username,
        authenticate,
        logout,
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
