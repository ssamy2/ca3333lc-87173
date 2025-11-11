import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';

const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { userId } = useAuth();

  // Mock user data - replace with actual user data when available
  const userData = {
    name: 'User',
    username: `user_${userId || 'guest'}`,
    avatar_url: null,
  };

  const handleThemeChange = (selectedTheme: string) => {
    setTheme(selectedTheme);
  };

  const openTelegramLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>

        {/* User Profile Header */}
        <Card className="p-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              {userData.avatar_url ? (
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

        {/* Theme Selector */}
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-medium">Theme</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleThemeChange('light')}
              className={`p-3 rounded-lg border-2 transition-all ${
                theme === 'light'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              <div className="text-sm font-medium">Light</div>
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`p-3 rounded-lg border-2 transition-all ${
                theme === 'dark'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              <div className="text-sm font-medium">Dark</div>
            </button>
            <button
              onClick={() => handleThemeChange('system')}
              className={`p-3 rounded-lg border-2 transition-all ${
                theme === 'system'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              <div className="text-sm font-medium">System</div>
            </button>
          </div>
        </Card>

        {/* Community Section */}
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-medium">Community</h3>
          <div className="space-y-3">
            <Button
              onClick={() => openTelegramLink('https://t.me/GT_Rolet')}
              variant="outline"
              className="w-full justify-between rounded-xl h-12"
            >
              <span>Join Telegram Channel</span>
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => openTelegramLink('https://t.me/GT_Rolet_Chat')}
              variant="outline"
              className="w-full justify-between rounded-xl h-12"
            >
              <span>Join Telegram Group</span>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
