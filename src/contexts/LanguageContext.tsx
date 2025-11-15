import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '@/i18n/translations';
import { apiClient } from '@/lib/api';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Fetch language from backend on mount
  useEffect(() => {
    const fetchLanguage = async () => {
      try {
        const prefs = await apiClient.getUserPreferences();
        if (prefs && prefs.language && prefs.language !== language) {
          setLanguageState(prefs.language as Language);
        }
      } catch (error) {
        console.error('Failed to fetch language from backend:', error);
      }
    };

    // Only fetch if we have Telegram init data
    if (window.Telegram?.WebApp?.initData) {
      fetchLanguage();
    }
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    
    // Sync with backend
    try {
      const initData = window.Telegram?.WebApp?.initData;
      if (initData) {
        await fetch('https://www.channelsseller.site/api/user/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Telegram-Init-Data': initData
          },
          body: JSON.stringify({ language: lang })
        });
      }
    } catch (error) {
      console.error('Failed to sync language with backend:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
