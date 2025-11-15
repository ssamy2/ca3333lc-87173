import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, ExternalLink, Globe, Users, Flame, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation, Language } from '@/i18n/translations';
import { apiClient } from '@/lib/api';

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
  const [statistics, setStatistics] = useState<{
    total_users: number;
    active_today: number;
    total_gifts_checked: number;
    top_country: string;
  } | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
        if (tgUser) {
          const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'User';
          setUserData({
            name: fullName,
            username: tgUser.username || `user_${userId || 'guest'}`,
            avatar_url: (tgUser as any).photo_url || null,
          });
        } else {
          setUserData(prev => ({ ...prev }));
        }
      } catch (error) {
        console.error('Failed to load Telegram user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [userId]);

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const stats = await apiClient.getGlobalStatistics();
        if (stats) {
          setStatistics({
            total_users: stats.total_users,
            active_today: stats.active_today,
            total_gifts_checked: stats.total_gifts_checked,
            top_country: stats.top_country
          });
        }
      } catch (error) {
        console.error('Failed to load statistics:', error);
      }
    };

    loadStatistics();
  }, []);

  const handleThemeChange = async (selectedTheme: string) => {
    setTheme(selectedTheme);
    try {
      await apiClient.updateUserPreferences({ theme: selectedTheme });
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
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
          <div className="grid grid-cols-2 gap-3">
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
            <button
              onClick={() => handleLanguageChange('zh')}
              className={`p-3 rounded-lg border-2 transition-all ${
                language === 'zh'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              <div className="text-sm font-medium">{t('chinese')}</div>
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

        {/* Statistics Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Statistics</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Total Users */}
            <Card className="p-5 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
              <div className="flex flex-col space-y-3">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statistics ? statistics.total_users.toLocaleString() : '...'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Active Now */}
            <Card className="p-5 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <div className="flex flex-col space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Now</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statistics ? Math.floor(statistics.active_today * 0.15).toLocaleString() : '...'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Active Today */}
            <Card className="p-5 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <div className="flex flex-col space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Today</p>
                  <p className="text-2xl font-bold text-foreground">
                    {statistics ? statistics.active_today.toLocaleString() : '...'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Top Country */}
            <Card className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <div className="flex flex-col space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Top Country</p>
                  <p className="text-xl font-bold text-foreground flex items-center gap-2">
                    {statistics?.top_country === 'Iraq' && '🇮🇶'}
                    {statistics?.top_country === 'USA' && '🇺🇸'}
                    {statistics?.top_country === 'Russia' && '🇷🇺'}
                    {statistics?.top_country === 'China' && '🇨🇳'}
                    {statistics ? statistics.top_country : '...'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
