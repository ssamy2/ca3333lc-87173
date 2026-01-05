import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, ExternalLink, Globe, Users, Flame, TrendingUp, Sun, Moon, Zap, Languages, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation, Language } from '@/i18n/translations';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

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
  } | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
        if (tgUser) {
          const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'User';
          setUserData({
            name: fullName,
            username: tgUser.username || `user_${userId || 'guest'}`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            total_gifts_checked: stats.total_gifts_checked
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
    electric: <Zap className="w-4 h-4" />
  }), []);

  // Memoize language flags
  const languageFlags = useMemo(() => ({
    en: '🇬🇧',
    ar: '🇮🇶',
    ru: '🇷🇺',
    zh: '🇨🇳'
  }), []);

  return (
    <div className="min-h-screen bg-background pb-20 font-sans transition-colors duration-300">
      {/* Header with Glassmorphism */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-4 p-4 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onBack ? onBack() : navigate('/')}
            className="rounded-full hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('settings')}
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* User Profile Header - Premium Card */}
        <Card className="p-5 bg-gradient-to-br from-card to-card-elevated border-border/50 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20 shadow-inner">
                {isLoading ? (
                  <div className="w-8 h-8 animate-pulse bg-primary/20 rounded-full" />
                ) : userData.avatar_url ? (
                  <img
                    src={userData.avatar_url}
                    alt={userData.name}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-card ring-2 ring-card/50" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold truncate text-foreground">{userData.name}</h2>
              <p className="text-sm text-muted-foreground truncate font-medium">@{userData.username}</p>
            </div>
          </div>
        </Card>

        {/* Language Selector */}
        <Card className="p-5 space-y-4 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
              <Languages className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{t('language')}</h3>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {(['en', 'ar', 'ru', 'zh'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={cn(
                  "p-3 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2",
                  language === lang
                    ? "border-primary bg-primary/10 shadow-sm scale-[1.02] ring-1 ring-primary/20"
                    : "border-border/50 bg-card hover:bg-muted hover:border-primary/30"
                )}
              >
                <div className="text-2xl filter drop-shadow-sm">{languageFlags[lang]}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider truncate w-full text-center">
                  {t(lang === 'en' ? 'english' : lang === 'ar' ? 'arabic' : lang === 'ru' ? 'russian' : 'chinese')}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Theme Selector */}
        <Card className="p-5 space-y-4 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
              <Palette className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{t('theme')}</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', icon: themeIcons.light },
              { id: 'dark', label: 'Dark', icon: themeIcons.dark },
              { id: 'electric', label: 'Electric', icon: themeIcons.electric }
            ].map((themeOption) => (
              <button
                key={themeOption.id}
                onClick={() => handleThemeChange(themeOption.id)}
                className={cn(
                  "p-3 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2",
                  theme === themeOption.id
                    ? "border-primary bg-primary/10 shadow-sm scale-[1.02] ring-1 ring-primary/20"
                    : "border-border/50 bg-card hover:bg-muted hover:border-primary/30"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                  theme === themeOption.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}>
                  {themeOption.icon}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider">
                  {themeOption.label}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Community Section */}
        <Card className="p-5 space-y-4 bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20">
              <Globe className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{t('community')}</h3>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => openTelegramLink('https://t.me/Nova_Gifts')}
              variant="outline"
              className="w-full justify-between rounded-xl h-12 text-sm hover:bg-blue-500/10 hover:border-blue-500/30 transition-all border-blue-500/20"
            >
              <span className="font-medium">{t('joinTelegramChannel')}</span>
              <ExternalLink className="w-4 h-4 opacity-70" />
            </Button>
            <Button
              onClick={() => openTelegramLink('https://t.me/Gifts_Super')}
              variant="outline"
              className="w-full justify-between rounded-xl h-12 text-sm hover:bg-blue-500/10 hover:border-blue-500/30 transition-all border-blue-500/20"
            >
              <span className="font-medium">{t('joinTelegramGroup')}</span>
              <ExternalLink className="w-4 h-4 opacity-70" />
            </Button>
          </div>
        </Card>

        {/* Statistics Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Global Stats</h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Total Users */}
            <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-orange-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Total Users</p>
                  <p className="text-2xl font-bold text-foreground truncate font-mono">
                    {statistics ? statistics.total_users.toLocaleString() : '...'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Active Today */}
            <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Flame className="w-6 h-6 text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Active Today</p>
                  <p className="text-2xl font-bold text-foreground truncate font-mono">
                    {statistics ? statistics.active_today.toLocaleString() : '...'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Gifts Checked */}
            <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Gifts Checked</p>
                  <p className="text-2xl font-bold text-foreground truncate font-mono">
                    {statistics ? statistics.total_gifts_checked.toLocaleString() : '...'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div >
    </div >
  );
};

export default ProfileSettingsPage;
