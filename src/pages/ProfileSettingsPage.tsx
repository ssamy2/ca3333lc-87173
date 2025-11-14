import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, ExternalLink, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation, Language } from '@/i18n/translations';
// Removed external API usage – we'll read from Telegram Mini App directly

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
          // Fallback: keep defaults
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

        {/* Creative Surprises Section */}
        <div className="flex justify-center items-center py-16">
          <div className="relative w-full max-w-lg">
            {/* Magical background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-yellow-500/10 blur-3xl rounded-full animate-pulse"></div>
            <div className="absolute -top-8 -left-8 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '3s' }}></div>
            <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-gradient-to-br from-pink-400/20 to-yellow-500/20 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
            
            {/* Main creative card */}
            <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl rounded-3xl p-10 border border-gradient-to-r from-purple-500/30 via-pink-500/30 to-yellow-500/30 shadow-2xl overflow-hidden">
              {/* Floating particles */}
              <div className="absolute top-6 left-8 w-2 h-2 bg-purple-400 rounded-full opacity-60 animate-ping"></div>
              <div className="absolute top-12 right-12 w-3 h-3 bg-pink-400 rounded-full opacity-50 animate-ping" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute bottom-16 left-12 w-2 h-2 bg-yellow-400 rounded-full opacity-70 animate-ping" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-8 right-8 w-3 h-3 bg-blue-400 rounded-full opacity-40 animate-ping" style={{ animationDelay: '1.5s' }}></div>
              <div className="absolute top-20 left-20 w-1 h-1 bg-green-400 rounded-full opacity-80 animate-ping" style={{ animationDelay: '2s' }}></div>
              
              {/* Content */}
              <div className="flex flex-col items-center space-y-8 relative z-10">
                {/* Handwritten title */}
                <div className="text-center space-y-2">
                  <div className="relative">
                    <h2 
                      className="text-5xl text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text font-bold transform -rotate-2"
                      style={{ 
                        fontFamily: '"Kalam", "Comic Sans MS", cursive',
                        textShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                      }}
                    >
                      Something
                    </h2>
                    {/* Underline scribble */}
                    <svg 
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2" 
                      width="180" 
                      height="12" 
                      viewBox="0 0 180 12"
                    >
                      <path 
                        d="M2 8c20-4 40 4 60-2s40-8 60 2c20 6 40-4 56 2" 
                        stroke="url(#gradient)" 
                        strokeWidth="2" 
                        fill="none" 
                        strokeLinecap="round"
                        className="animate-pulse"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="50%" stopColor="#ec4899" />
                          <stop offset="100%" stopColor="#eab308" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  
                  <h3 
                    className="text-4xl text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text font-bold transform rotate-1"
                    style={{ 
                      fontFamily: '"Kalam", "Comic Sans MS", cursive',
                      textShadow: '0 0 15px rgba(251, 191, 36, 0.3)'
                    }}
                  >
                    Amazing
                  </h3>
                </div>
                
                {/* Handwritten "is coming" */}
                <div className="relative">
                  <p 
                    className="text-2xl text-slate-300 font-medium transform -rotate-1"
                    style={{ 
                      fontFamily: '"Kalam", "Comic Sans MS", cursive',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                    }}
                  >
                    is coming...
                  </p>
                  {/* Doodle arrow */}
                  <svg 
                    className="absolute -right-16 top-1/2 transform -translate-y-1/2 rotate-12" 
                    width="40" 
                    height="30" 
                    viewBox="0 0 40 30"
                  >
                    <path 
                      d="M5 15c8-3 16 3 25-2m-8-5l8 5-8 7" 
                      stroke="#94a3b8" 
                      strokeWidth="2" 
                      fill="none" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="animate-pulse"
                    />
                  </svg>
                </div>
                
                {/* Creative mystery box */}
                <div className="relative mt-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-yellow-500/20 blur-2xl rounded-3xl scale-110 animate-pulse"></div>
                  
                  {/* Gift box */}
                  <div className="relative w-24 h-24 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-6 transition-transform duration-300">
                    <div className="absolute inset-2 bg-gradient-to-br from-purple-600 via-pink-600 to-yellow-600 rounded-xl"></div>
                    <div className="relative text-white text-3xl animate-bounce">
                      🎁
                    </div>
                    
                    {/* Ribbon */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-full"></div>
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full"></div>
                  </div>
                  
                  {/* Floating sparkles */}
                  <div className="absolute -top-4 -left-4 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }}>✨</div>
                  <div className="absolute -top-2 -right-6 text-pink-400 animate-spin" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>⭐</div>
                  <div className="absolute -bottom-4 -left-6 text-purple-400 animate-spin" style={{ animationDuration: '5s', animationDelay: '1s' }}>💫</div>
                  <div className="absolute -bottom-2 -right-4 text-blue-400 animate-spin" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }}>✨</div>
                </div>
                
                {/* Handwritten note */}
                <div className="mt-6 p-4 bg-yellow-100/10 rounded-2xl border border-yellow-400/20 transform -rotate-1">
                  <p 
                    className="text-slate-300 text-sm text-center leading-relaxed"
                    style={{ 
                      fontFamily: '"Kalam", "Comic Sans MS", cursive'
                    }}
                  >
                    Stay tuned for exciting new features
                    <br />
                    <span className="text-yellow-400">& magical surprises! ✨</span>
                  </p>
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
