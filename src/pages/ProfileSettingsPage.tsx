import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, ExternalLink, Globe, Users, Flame, TrendingUp, Sun, Moon, Monitor, Languages, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation, Language } from '@/i18n/translations';
import { apiClient } from '@/lib/api';

interface ProfileSettingsPageProps {
  onBack?: () => void;
}

const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({ onBack }) => {
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

  // Memoize theme icons
  const themeIcons = useMemo(() => ({
    light: <Sun className="w-4 h-4" />,
    dark: <Moon className="w-4 h-4" />,
    system: <Monitor className="w-4 h-4" />
  }), []);

  // Memoize language flags
  const languageFlags = useMemo(() => ({
    en: '🇬🇧',
    ar: '🇮🇶',
    ru: '🇷🇺',
    zh: '🇨🇳'
  }), []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-20">
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onBack ? onBack() : navigate('/')}
            className="rounded-full hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('settings')}
          </h1>
        </div>

        {/* User Profile Header - Compact */}
        <Card className="p-4 bg-gradient-to-br from-card to-card/50 border-primary/10 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-primary/20">
                {isLoading ? (
                  <div className="w-8 h-8 animate-pulse bg-primary/20 rounded-full" />
                ) : userData.avatar_url ? (
                  <img
                    src={userData.avatar_url}
                    alt={userData.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold truncate">{userData.name}</h2>
              <p className="text-xs text-muted-foreground truncate">@{userData.username}</p>
            </div>
          </div>
        </Card>

        {/* Language Selector - Compact */}
        <Card className="p-4 space-y-3 bg-gradient-to-br from-card to-card/50 border-primary/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Languages className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">{t('language')}</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(['en', 'ar', 'ru', 'zh'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`p-2.5 rounded-lg border transition-all duration-200 ${
                  language === lang
                    ? 'border-primary bg-primary/15 shadow-sm scale-105'
                    : 'border-border/50 bg-card/50 hover:bg-muted hover:border-primary/30'
                }`}
              >
                <div className="text-lg mb-0.5">{languageFlags[lang]}</div>
                <div className="text-[10px] font-medium truncate">
                  {t(lang === 'en' ? 'english' : lang === 'ar' ? 'arabic' : lang === 'ru' ? 'russian' : 'chinese')}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Theme Selector - Compact */}
        <Card className="p-4 space-y-3 bg-gradient-to-br from-card to-card/50 border-primary/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">{t('theme')}</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'system'] as const).map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => handleThemeChange(themeOption)}
                className={`p-2.5 rounded-lg border transition-all duration-200 flex flex-col items-center gap-1 ${
                  theme === themeOption
                    ? 'border-primary bg-primary/15 shadow-sm scale-105'
                    : 'border-border/50 bg-card/50 hover:bg-muted hover:border-primary/30'
                }`}
              >
                {themeIcons[themeOption]}
                <div className="text-[10px] font-medium">
                  {t(themeOption)}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Community Section - Compact */}
        <Card className="p-4 space-y-3 bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-blue-500/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Globe className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-sm font-semibold">{t('community')}</h3>
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => openTelegramLink('https://t.me/GT_Rolet')}
              variant="outline"
              className="w-full justify-between rounded-lg h-10 text-sm hover:bg-blue-500/10 hover:border-blue-500/30 transition-all"
            >
              <span>{t('joinTelegramChannel')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={() => openTelegramLink('https://t.me/Gifts_Super')}
              variant="outline"
              className="w-full justify-between rounded-lg h-10 text-sm hover:bg-blue-500/10 hover:border-blue-500/30 transition-all"
            >
              <span>{t('joinTelegramGroup')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* Statistics Section - Compact & Optimized */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">Statistics</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
            {/* Total Users */}
            <Card className="p-3.5 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-orange-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Total Users</p>
                  <p className="text-lg font-bold text-foreground truncate">
                    {statistics ? statistics.total_users.toLocaleString() : '...'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Active Now */}
            <Card className="p-3.5 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0 relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Active Now</p>
                  <p className="text-lg font-bold text-foreground truncate">
                    {statistics ? Math.floor(statistics.active_today * 0.15).toLocaleString() : '...'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Active Today */}
            <Card className="p-3.5 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-5 h-5 text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Active Today</p>
                  <p className="text-lg font-bold text-foreground truncate">
                    {statistics ? statistics.active_today.toLocaleString() : '...'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Top Country */}
            <Card className="p-3.5 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Top Country</p>
                  <p className="text-base font-bold text-foreground flex items-center gap-1.5 truncate">
                    <span className="text-lg">
                      {statistics?.top_country === 'Iraq' && '🇮🇶'}
                      {statistics?.top_country === 'USA' && '🇺🇸'}
                      {statistics?.top_country === 'Russia' && '🇷🇺'}
                      {statistics?.top_country === 'China' && '🇨🇳'}
                    </span>
                    <span className="truncate">{statistics ? statistics.top_country : '...'}</span>
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
