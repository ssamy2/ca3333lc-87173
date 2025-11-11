import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, ExternalLink, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation, Language } from '@/i18n/translations';
import { fetchUserProfile } from '@/services/apiService';
import surprisesImage from '@/assets/surprises-coming.png';

const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { userId } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [userData, setUserData] = useState<{
    name: string;
    username: string;
    avatar_url: string | null;
  }>({
    name: 'User',
    username: `user_${userId || 'guest'}`,
    avatar_url: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (userId) {
        try {
          const profile = await fetchUserProfile(`@${userId}`);
          setUserData({
            name: profile.name || 'User',
            username: userId,
            avatar_url: profile.photo_base64 || null,
          });
        } catch (error) {
          console.error('Failed to load user profile:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [userId]);

  const handleThemeChange = (selectedTheme: string) => {
    setTheme(selectedTheme);
  };

  const handleLanguageChange = (selectedLang: Language) => {
    setLanguage(selectedLang);
  };

  const openTelegramLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const t = (key: keyof typeof import('@/i18n/translations').translations.en) => 
    getTranslation(language, key);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">{t('settings')}</h1>
        </div>

        {/* User Profile Header */}
        <Card className="p-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              {isLoading ? (
                <div className="w-12 h-12 animate-pulse bg-muted-foreground/20 rounded-full" />
              ) : userData.avatar_url ? (
                <img
                  src={userData.avatar_url}
                  alt={userData.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{userData.name}</h2>
              <p className="text-sm text-muted-foreground">@{userData.username}</p>
            </div>
          </div>
        </Card>

        {/* Language Selector */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <h3 className="text-base font-medium">{t('language')}</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`p-3 rounded-lg border-2 transition-all ${
                language === 'en'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              <div className="text-sm font-medium">{t('english')}</div>
            </button>
            <button
              onClick={() => handleLanguageChange('ar')}
              className={`p-3 rounded-lg border-2 transition-all ${
                language === 'ar'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              <div className="text-sm font-medium">{t('arabic')}</div>
            </button>
            <button
              onClick={() => handleLanguageChange('ru')}
              className={`p-3 rounded-lg border-2 transition-all ${
                language === 'ru'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              <div className="text-sm font-medium">{t('russian')}</div>
            </button>
          </div>
        </Card>

        {/* Theme Selector */}
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-medium">{t('theme')}</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleThemeChange('light')}
              className={`p-3 rounded-lg border-2 transition-all ${
                theme === 'light'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              <div className="text-sm font-medium">{t('light')}</div>
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`p-3 rounded-lg border-2 transition-all ${
                theme === 'dark'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              <div className="text-sm font-medium">{t('dark')}</div>
            </button>
            <button
              onClick={() => handleThemeChange('system')}
              className={`p-3 rounded-lg border-2 transition-all ${
                theme === 'system'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              <div className="text-sm font-medium">{t('system')}</div>
            </button>
          </div>
        </Card>

        {/* Community Section */}
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-medium">{t('community')}</h3>
          <div className="space-y-3">
            <Button
              onClick={() => openTelegramLink('https://t.me/GT_Rolet')}
              variant="outline"
              className="w-full justify-between rounded-xl h-12"
            >
              <span>{t('joinTelegramChannel')}</span>
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => openTelegramLink('https://t.me/Gifts_Super')}
              variant="outline"
              className="w-full justify-between rounded-xl h-12"
            >
              <span>{t('joinTelegramGroup')}</span>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Surprises Coming Soon */}
        <div className="flex justify-center items-center py-12">
          <div className="relative w-full max-w-sm">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/20 via-yellow-600/10 to-transparent blur-3xl rounded-full"></div>
            
            {/* Main card */}
            <div className="relative bg-gradient-to-b from-black/80 via-gray-900/70 to-black/80 rounded-3xl p-8 border border-yellow-500/20 shadow-2xl shadow-yellow-500/10">
              {/* Stars decoration */}
              <div className="absolute top-4 left-6 w-3 h-3 bg-yellow-400 rounded-full opacity-40 animate-pulse"></div>
              <div className="absolute top-8 right-8 w-2 h-2 bg-yellow-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute bottom-12 left-8 w-2 h-2 bg-yellow-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-6 right-12 w-3 h-3 bg-yellow-300 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
              
              {/* Content */}
              <div className="flex flex-col items-center space-y-6">
                {/* Nova Logo */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center border border-yellow-500/30">
                    <span className="text-yellow-500 text-lg">🎁</span>
                  </div>
                  <span className="text-yellow-400 font-medium text-lg tracking-wide">Nova</span>
                </div>
                
                {/* Soon text - handwritten style */}
                <div className="relative">
                  <h2 
                    className="text-6xl font-bold text-yellow-400 tracking-wider"
                    style={{ 
                      fontFamily: 'cursive',
                      textShadow: '0 0 30px rgba(250, 204, 21, 0.5), 0 0 60px rgba(250, 204, 21, 0.3)',
                      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))'
                    }}
                  >
                    Soon...
                  </h2>
                  <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent"></div>
                </div>
                
                {/* Question mark with glow */}
                <div className="relative mt-8">
                  <div className="absolute inset-0 bg-yellow-500/30 blur-2xl rounded-full scale-150"></div>
                  <div className="relative w-32 h-32 bg-gradient-to-b from-yellow-400/90 to-yellow-500/80 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/50 border-4 border-yellow-300/30">
                    <span className="text-white text-7xl font-bold" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' }}>?</span>
                  </div>
                  
                  {/* Sparkle stars around question mark */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" className="text-yellow-300 animate-pulse">
                      <path fill="currentColor" d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4-6.3-4.6-6.3 4.6 2.3-7.4-6-4.6h7.6z"/>
                    </svg>
                  </div>
                  <div className="absolute bottom-2 -left-8">
                    <svg width="20" height="20" viewBox="0 0 24 24" className="text-yellow-400 animate-pulse" style={{ animationDelay: '0.3s' }}>
                      <path fill="currentColor" d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4-6.3-4.6-6.3 4.6 2.3-7.4-6-4.6h7.6z"/>
                    </svg>
                  </div>
                  <div className="absolute -bottom-4 -right-8">
                    <svg width="18" height="18" viewBox="0 0 24 24" className="text-yellow-300 animate-pulse" style={{ animationDelay: '0.6s' }}>
                      <path fill="currentColor" d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4-6.3-4.6-6.3 4.6 2.3-7.4-6-4.6h7.6z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
