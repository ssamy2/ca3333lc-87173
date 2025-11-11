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
          const profile = await fetchUserProfile(userId);
          setUserData({
            name: profile.name || 'User',
            username: `user_${userId}`,
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
              onClick={() => openTelegramLink('https://t.me/GT_Rolet_Chat')}
              variant="outline"
              className="w-full justify-between rounded-xl h-12"
            >
              <span>{t('joinTelegramGroup')}</span>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Surprises Coming Soon */}
        <div className="flex justify-center items-center py-8">
          <img 
            src={surprisesImage} 
            alt="Surprises Coming Soon" 
            className="w-full max-w-md h-auto opacity-90"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
