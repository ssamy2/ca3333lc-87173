import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Calculator, RefreshCw, User, Gift, ArrowLeft } from 'lucide-react';
import NFTCard from './NFTCard';
import RegularGiftCard from './RegularGiftCard';
import VirtualizedNFTGrid from './VirtualizedNFTGrid';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import TonIcon from './TonIcon';
import StatsCard from './StatsCard';
import ThemeToggle from './ThemeToggle';
import BottomNav from './BottomNav';
import Chart from '@/pages/Chart';
import ToolsPage from '@/pages/ToolsPage';
import CryptoPage from '@/pages/CryptoPage';
import TradingPage from '@/pages/TradingPage';
import ProfileSettingsPage from '@/pages/ProfileSettingsPage';
import { fetchNFTGifts, fetchSingleGiftPrice, fetchProfileImageAsBase64 } from '@/services/apiService';
import { proxyImageUrl } from '@/lib/imageProxy';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import AppLoader from './AppLoader';
import SubscribePrompt from './SubscribePrompt';
import TelegramAuthError from './TelegramAuthError';
import novaLogo from '@/assets/nova-logo-new.png';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/i18n/translations';
import { useLaunchParams } from '@/hooks/useLaunchParams';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  name: string;
  photo_base64: string | null;
}

interface NFTGift {
  count: number;
  name: string;
  model: string;
  floor_price: number;
  avg_price: number;
  image?: string;
  title?: string;
  backdrop?: string;
  backdrop_rarity?: string;
  symbol?: string;
  symbol_rarity?: string;
  model_rarity?: string;
  quantity_issued?: number;
  quantity_total?: number;
  quantity_raw?: string;
  description?: string;
  tg_deeplink?: string;
  details?: {
    links?: string[];
  };
}

interface RegularGift {
  id: string;
  name: string;
  short_name?: string;
  image: string;
  count: number;
  price_ton: number;
  price_usd: number;
  total_ton: number;
  total_usd: number;
  supply: number;
  multiplier?: string;
  change_24h?: number;
  is_unupgraded: boolean;
}

interface NFTData {
  owner: string;
  visible_nfts?: number;
  total_saved_gifts?: number;
  prices: {
    floor_price: { TON: number; USD: number; STAR: number };
    avg_price: { TON: number; USD: number; STAR: number };
    upgraded_value?: { TON: number; USD: number };
    regular_value?: { TON: number; USD: number };
  };
  nfts: NFTGift[];
  regular_gifts?: RegularGift[];
}

interface APIResponse {
  success: boolean;
  data?: NFTData;
  stats?: {
    items: number;
    total_gifts: number;
    enriched: number;
  };
  message?: string;
  error?: string;
  wait_time?: number;
}

const TelegramApp: React.FC = () => {
  const { isAuthenticated, isSubscribed, isLoading: authLoading, authError, checkSubscription } = useAuth();
  const { language } = useLanguage();
  const launchParams = useLaunchParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [currentUserFullName, setCurrentUserFullName] = useState('');
  const [currentUserPhotoUrl, setCurrentUserPhotoUrl] = useState('');
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [searchedUserProfile, setSearchedUserProfile] = useState<UserProfile | null>(null);
  const [nftData, setNftData] = useState<NFTData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'chart' | 'tools' | 'crypto' | 'settings' | 'trade'>('chart');
  const [searchMode, setSearchMode] = useState<'user' | 'gift'>('user');
  const [giftUrl, setGiftUrl] = useState('');
  const [singleGift, setSingleGift] = useState<any | null>(null);
  const [hasSkippedSubscribe, setHasSkippedSubscribe] = useState(false);
  const [showSubscribePopup, setShowSubscribePopup] = useState(false);
  const [autoSearchTriggered, setAutoSearchTriggered] = useState(false);
  const { toast } = useToast();
  const { theme, setTheme, isLight, isDark } = useTheme();
  
  // Translation helper
  const t = (key: keyof typeof import('@/i18n/translations').translations.en) => 
    getTranslation(language, key);

  // Initialize Telegram WebApp
  useEffect(() => {
    // Configure Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      
      // Additional configuration if methods are available
      const webApp = window.Telegram?.WebApp as any;
      if (webApp.disableVerticalSwipes) webApp.disableVerticalSwipes();
      if (webApp.setHeaderColor) webApp.setHeaderColor('#2481cc');
      if (webApp.setBackgroundColor) webApp.setBackgroundColor('#f0f8ff');
    }

    // Detect Telegram user and get data directly from Telegram
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (telegramUser) {
      // Username للبحث
      const detectedUsername = telegramUser.username || 'user';
      setCurrentUser(detectedUsername);
      setUsername(detectedUsername);
      
      // الاسم الكامل للعرض
      const fullName = [telegramUser.first_name, telegramUser.last_name]
        .filter(Boolean)
        .join(' ') || 'User';
      setCurrentUserFullName(fullName);
      
      // الصورة مباشرة من Telegram
      const photoUrl = (telegramUser as any).photo_url;
      if (photoUrl) {
        setCurrentUserPhotoUrl(photoUrl);
      }

      // Send user info to backend for trading system
      const sendUserInfo = async () => {
        try {
          const { getAuthHeaders } = await import('@/lib/telegramAuth');
          const headers = await getAuthHeaders();
          
          await fetch('https://channelsseller.site/api/trading/update-user-info', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...headers
            },
            body: JSON.stringify({
              username: telegramUser.username,
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name,
              photo_url: photoUrl,
              language_code: telegramUser.language_code
            })
          });
        } catch (error) {
          console.error('Failed to update user info:', error);
        }
      };
      
      sendUserInfo();
    } else {
      // Fallback for testing
      setCurrentUser('demo_user');
      setUsername('demo_user');
      setCurrentUserFullName('Demo User');
    }

    // Load search history
    const history = localStorage.getItem('nft_search_history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Handle Launch Parameters from Telegram
  useEffect(() => {
    if (!isAuthenticated || autoSearchTriggered) return;

    console.log('[LaunchParams] Processing params:', launchParams);

    if (launchParams.adminAccess) {
      console.log('[LaunchParams] Admin access, navigating to /admin');
      navigate('/admin');
      setAutoSearchTriggered(true);
      return;
    }

    if (launchParams.adminAds || launchParams.startapp === 'admin_ads') {
      console.log('[LaunchParams] Admin ads access, navigating to /admin/ads');
      navigate('/admin/ads');
      setAutoSearchTriggered(true);
      return;
    }

    if (launchParams.searchUser) {
      console.log('[LaunchParams] Auto-searching user:', launchParams.searchUser);
      setUsername(launchParams.searchUser);
      setSearchMode('user');
      setTimeout(() => {
        fetchNFTs(launchParams.searchUser!);
        setAutoSearchTriggered(true);
      }, 500);
    } else if (launchParams.searchGift) {
      console.log('[LaunchParams] Auto-searching gift:', launchParams.searchGift);
      setGiftUrl(launchParams.searchGift);
      setSearchMode('gift');
      setTimeout(async () => {
        try {
          const result = await fetchSingleGiftPrice(launchParams.searchGift!);
          setSingleGift(result.data);
          setAutoSearchTriggered(true);
          toast({
            title: "Success!",
            description: `Found gift: ${result.data.gift_name}`,
          });
        } catch (err) {
          console.error('[LaunchParams] Gift search error:', err);
          setError('Failed to fetch gift data');
          setAutoSearchTriggered(true);
        }
      }, 500);
    }
  }, [isAuthenticated, launchParams, autoSearchTriggered, navigate, toast]);

  // Show subscription popup after authentication (optional)
  useEffect(() => {
    if (isAuthenticated && !isSubscribed && !hasSkippedSubscribe) {
      // Show popup after a short delay to let the main app load
      const timer = setTimeout(() => {
        setShowSubscribePopup(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isSubscribed, hasSkippedSubscribe]);

  // Countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const saveToHistory = (searchTerm: string) => {
    const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 8);
    setSearchHistory(newHistory);
    localStorage.setItem('nft_search_history', JSON.stringify(newHistory));
  };

  const removeFromHistory = (searchTerm: string) => {
    const newHistory = searchHistory.filter(h => h !== searchTerm);
    setSearchHistory(newHistory);
    localStorage.setItem('nft_search_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('nft_search_history');
    toast({
      title: "History Cleared",
      description: "Search history has been deleted",
    });
  };

  const fetchNFTs = async (searchUsername: string) => {
    if (!searchUsername.trim()) return;

    setLoading(true);
    setError(null);
    setNftData(null);
    setSearchedUserProfile(null);

    try {
      // Fetch NFT data (includes user profile information)
      const data = await fetchNFTGifts(searchUsername);

      if (data.success && data.data) {
        setNftData(data.data);
        
        // Fetch profile image with auth token and convert to base64
        let photoBase64: string | null = null;
        if (data.data.profile_image) {
          photoBase64 = await fetchProfileImageAsBase64(data.data.profile_image);
        }
        
        // Extract user profile from the response
        setSearchedUserProfile({
          name: data.data.name,
          photo_base64: photoBase64
        });
        saveToHistory(searchUsername);
        const giftCount = data.data.nfts?.length || data.data.visible_nfts || 0;
        toast({
          title: "Success!",
          description: `Found ${giftCount} NFT gifts for ${data.data.owner}`,
        });
      }
    } catch (err) {
      // Handle different error types
      if (err instanceof Error) {
        console.log('Error type:', err.message);
        
        if (err.message === 'NETWORK_ERROR') {
          setError('NETWORK_ERROR');
        } else if (err.message === 'CORS_ERROR') {
          setError('CORS_ERROR');
        } else if (err.message === 'TIMEOUT_ERROR') {
          setError('TIMEOUT_ERROR');
        } else if (err.message === 'SERVER_ERROR') {
          setError('SERVER_ERROR');
        } else if (err.message.startsWith('RATE_LIMIT_EXCEEDED')) {
          setError('RATE_LIMIT_EXCEEDED');
          setCountdown(60);
        } else if (err.message === 'USER_NOT_FOUND') {
          setError('user_not_found');
        } else if (err.message === 'ACCESS_FORBIDDEN') {
          setError('ACCESS_FORBIDDEN');
        } else if (err.message === 'PARSE_ERROR') {
          setError('PARSE_ERROR');
        } else {
          setError(err.message);
        }
      } else {
        setError('NETWORK_ERROR');
      }
      console.error("API Error:", err);
      
      // Show toast notification for better UX
      toast({
        title: "Request Error",
        description: "An error occurred while fetching data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAPIMessage = (message: string, waitTime?: number) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes("no open nft gifts") || lowerMessage.includes("no nft data found")) {
      setError("no_gifts");
    } else if (lowerMessage.includes("user not found")) {
      setError("user_not_found");
    } else if (lowerMessage.includes("please wait") && waitTime) {
      setError("rate_limit");
      setCountdown(waitTime);
    } else if (lowerMessage.includes("rate limit exceeded")) {
      setError("rate_limit_exceeded");
      setCountdown(60);
    } else if (lowerMessage.includes("flood wait")) {
      setError("flood_wait");
    } else if (lowerMessage.includes("internal server error")) {
      setError("server_error");
    } else {
      setError(message);
    }
  };

  const handleSearch = () => {
    if (searchMode === 'user') {
      if (username.trim() && countdown === 0) {
        fetchNFTs(username.trim());
      }
    } else {
      handleGiftSearch();
    }
  };

  const handleGiftSearch = async () => {
    if (!giftUrl.trim()) {
      setError('Please enter a valid gift URL');
      return;
    }

    if (countdown > 0) return;

    setLoading(true);
    setError(null);
    setSingleGift(null);
    setNftData(null);

    try {
      const result = await fetchSingleGiftPrice(giftUrl.trim());
      setSingleGift(result.data);
      toast({
        title: "Success!",
        description: `Found gift: ${result.data.gift_name}`,
      });
    } catch (err) {
      console.error('Gift search error:', err);
      if (err instanceof Error) {
        if (err.message === 'GIFT_NOT_FOUND') {
          setError('Gift not found. Please check the URL.');
        } else if (err.message === 'INVALID_GIFT_URL') {
          setError('Invalid gift URL. Please use a valid t.me/nft/ link.');
        } else {
          setError('Failed to fetch gift data. Please try again.');
        }
      }
      toast({
        title: "Error",
        description: "Failed to fetch gift data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (currentUser && countdown === 0) {
      fetchNFTs(currentUser);
      // Haptic feedback if available
      const webApp = window.Telegram?.WebApp as any;
      if (webApp?.HapticFeedback?.impactOccurred) {
        webApp.HapticFeedback.impactOccurred('light');
      }
    }
  };

  const formatTON = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const calculateTotalValue = () => {
    if (!nftData?.nfts || !Array.isArray(nftData.nfts)) return 0;
    return nftData.nfts.reduce((total, nft) => total + (nft.floor_price * nft.count), 0);
  };

  // Memoized sorted NFTs to prevent re-sorting on every render
  const sortedNFTs = useMemo(() => {
    if (!nftData?.nfts || !Array.isArray(nftData.nfts)) return [];
    
    return [...nftData.nfts].sort((a, b) => {
      const priceA = a.floor_price * a.count;
      const priceB = b.floor_price * b.count;
      
      // الهدايا اللي سعرها 0 تروح للآخر
      if (priceA === 0 && priceB !== 0) return 1;
      if (priceA !== 0 && priceB === 0) return -1;
      if (priceA === 0 && priceB === 0) return 0;
      
      // الترتيب من الأغلى للأرخص
      return priceB - priceA;
    });
  }, [nftData?.nfts]);

  // Threshold for using virtualization (for large lists)
  const VIRTUALIZATION_THRESHOLD = 20;

  if (activeTab === 'chart') {
    return (
      <>
        <Chart />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </>
    );
  }

  if (activeTab === 'trade') {
    return (
      <>
        <TradingPage />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </>
    );
  }

  if (activeTab === 'tools') {
    return (
      <>
        <ToolsPage onGoToHome={() => setActiveTab('home')} />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </>
    );
  }

  
  if (activeTab === 'crypto') {
    return (
      <>
        <CryptoPage />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </>
    );
  }

  if (activeTab === 'settings') {
    return (
      <>
        <ProfileSettingsPage />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-20">
      {/* Back Button Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => setActiveTab('tools')}
            className="p-2 bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="text-lg font-bold">{language === 'ar' ? 'حاسبة هدايا المستخدم' : 'User Gift Calculator'}</h1>
            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'احسب قيمة هدايا أي مستخدم' : "Calculate any user's gift value"}</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Hero Section */}
        {!nftData && !singleGift && !loading && !error && (
          <section className="telegram-card p-5 border border-border/50 shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold">
                {t('heroTitle')}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('heroDescription')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('heroExample')}
            </p>
          </section>
        )}

        {/* Search Section */}
        <div className="telegram-card p-5 animate-slide-up border border-border/50 shadow-[var(--shadow-card)]">
          {/* Search Input */}
          <div className="flex gap-2 mb-4">
            {searchMode === 'user' ? (
              <Input
                type="text"
                placeholder={currentUser ? `@${currentUser}` : t('enterUsername')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                disabled={loading || countdown > 0}
              />
            ) : (
              <Input
                type="text"
                placeholder={t('enterGiftUrl')}
                value={giftUrl}
                onChange={(e) => setGiftUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                disabled={loading || countdown > 0}
              />
            )}
            <Button 
              onClick={handleSearch}
              disabled={loading || countdown > 0 || (searchMode === 'user' ? !username.trim() : !giftUrl.trim())}
              className="h-12 px-5 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>

          {/* Search History - Only for user mode */}
          {searchMode === 'user' && searchHistory.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">{t('recentSearches')}</p>
                <button
                  onClick={clearHistory}
                  className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {t('clearAll')}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((term, index) => (
                  <div
                    key={index}
                    className="relative group"
                  >
                    <button
                      onClick={() => setUsername(term)}
                      className="pl-3 pr-7 py-1.5 bg-secondary/70 text-secondary-foreground rounded-full text-xs hover:bg-secondary transition-colors border border-border/30"
                    >
                      @{term}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(term);
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
                      aria-label="Remove"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Countdown Timer */}
          {countdown > 0 && (
            <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TonIcon className="w-5 h-5 text-warning animate-pulse" />
                <span className="text-sm font-medium text-warning">{t('rateLimited')}</span>
              </div>
              <p className="text-xs text-warning/80">
                {t('pleaseWait').replace('{seconds}', countdown.toString())}
              </p>
              <div className="mt-2 w-full bg-warning/20 rounded-full h-1">
                <div 
                  className="bg-warning h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${100 - (countdown / 60) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {loading && <LoadingState />}
        
        {error && !loading && (
          <ErrorState 
            error={error} 
            onRetry={() => handleSearch()} 
            canRetry={countdown === 0}
          />
        )}

        {/* Single Gift Display */}
        {singleGift && !loading && !error && (
          <div className="space-y-5 animate-bounce-in pb-6">
            <div className="telegram-card p-6 border border-border/50 shadow-[var(--shadow-card)]">
              <div className="flex flex-col items-center">
                {/* Gift Image */}
                <div className="relative w-56 h-56 mb-6 rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={proxyImageUrl(singleGift.image)}
                    alt={singleGift.gift_name}
                    className="w-full h-full object-contain bg-gradient-to-br from-primary/5 via-background to-accent/5"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                {/* Gift Info */}
                <div className="text-center mb-6 space-y-3">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {singleGift.gift_name}
                  </h2>
                  
                  {/* Model and Backdrop */}
                  <div className="flex flex-col gap-2 items-center">
                    {singleGift.model && (
                      <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl border border-primary/30">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        <span className="text-sm font-semibold text-primary">{t('model')}:</span>
                        <span className="text-sm font-medium text-foreground">{singleGift.model}</span>
                      </div>
                    )}
                    {singleGift.backdrop && (
                      <div className="flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-xl border border-accent/30">
                        <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-semibold text-accent">{t('backdrop')}:</span>
                        <span className="text-sm font-medium text-foreground">{singleGift.backdrop}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Cards */}
                <div className="grid grid-cols-2 gap-4 w-full mb-6">
                  <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 rounded-2xl p-5 border border-primary/20 shadow-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TonIcon className="w-5 h-5 text-primary" />
                      <p className="text-sm text-muted-foreground font-medium">{t('priceTon')}</p>
                    </div>
                    <p className="text-3xl font-bold text-primary text-center">{typeof singleGift.price_ton === 'number' ? singleGift.price_ton.toFixed(2) : '0.00'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-accent/10 via-background to-accent/5 rounded-2xl p-5 border border-accent/20 shadow-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground font-medium">{t('priceUsd')}</span>
                    </div>
                    <p className="text-3xl font-bold text-accent text-center">${typeof singleGift.price_usd === 'number' ? singleGift.price_usd.toFixed(2) : '0.00'}</p>
                  </div>
                </div>

                {/* Rarity */}
                {singleGift.rarity !== undefined && (
                  <div className="w-full bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-2xl p-5 border border-border shadow-lg">
                    <p className="text-sm text-muted-foreground mb-2 text-center font-medium">{t('rarity')}</p>
                    <p className="text-2xl font-bold text-foreground text-center">
                      {singleGift.rarity}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {nftData && !loading && !error && (
          <div className="space-y-5 animate-bounce-in">
            {/* Owner Info with Photo */}
            <div className="telegram-card p-6 border border-border/50 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-4 mb-5">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary via-primary/90 to-accent rounded-2xl flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20 border border-primary/20">
                    {searchedUserProfile?.photo_base64 ? (
                      <img 
                        src={searchedUserProfile.photo_base64}
                        alt={searchedUserProfile.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <User className={`w-8 h-8 text-white ${searchedUserProfile?.photo_base64 ? 'hidden' : ''}`} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background shadow-sm">
                    <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {searchedUserProfile?.name || nftData.owner}
                  </h2>
                  <p className="text-sm text-muted-foreground font-medium">
                    {nftData.owner.startsWith('@') ? nftData.owner : `@${nftData.owner}`} • {nftData.nfts?.length || nftData.visible_nfts || 0} Visible NFT Gifts
                  </p>
                  {nftData.total_saved_gifts && nftData.total_saved_gifts > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <p className="text-xs text-primary font-semibold">
                        Total Saved: {nftData.total_saved_gifts}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {/* Total Value Card */}
              {nftData.prices?.avg_price && (
                <div className="flex justify-center">
                  <div className="w-full">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border border-primary/20 p-5 shadow-lg shadow-primary/5">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl"></div>
                      <div className="relative flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calculator className="w-5 h-5 text-primary" />
                            <span className="text-sm font-semibold text-muted-foreground">Total Value</span>
                          </div>
                          <div className="text-3xl font-bold text-gradient">
                            {formatTON(nftData.prices.avg_price.TON)} TON
                          </div>
                          <div className="text-base text-muted-foreground font-medium mt-0.5">
                            ${formatTON(nftData.prices.avg_price.USD)}
                          </div>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                          <TonIcon className="w-10 h-10 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* NFT Grid */}
            {sortedNFTs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-lg font-bold text-foreground">NFT Collection</h3>
                  <div className="px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full border border-primary/20">
                    {sortedNFTs.length} items
                  </div>
                </div>
                
                {/* Use virtualization for large lists, regular grid for small lists */}
                {sortedNFTs.length > VIRTUALIZATION_THRESHOLD ? (
                  <VirtualizedNFTGrid nfts={sortedNFTs} />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {sortedNFTs.map((nft, index) => (
                      <NFTCard key={`${nft.name}-${nft.model}-${index}-${nft.floor_price}`} nft={nft} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Regular Gifts Section */}
            {nftData?.regular_gifts && nftData.regular_gifts.length > 0 && (
              <div className="space-y-4">
                {/* Separator */}
                <div className="flex items-center gap-3 px-1">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
                  <span className="text-amber-400 text-sm font-medium px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                    {language === 'ar' ? 'غير مطورة' : 'Not Upgraded'}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <h3 className="text-lg font-bold text-amber-400">{language === 'ar' ? 'الهدايا العادية' : 'Regular Gifts'}</h3>
                  <div className="px-3 py-1 bg-amber-500/10 text-amber-400 text-sm font-semibold rounded-full border border-amber-500/20">
                    {nftData.regular_gifts.reduce((sum, g) => sum + g.count, 0)} items
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {nftData.regular_gifts
                    .sort((a, b) => b.total_ton - a.total_ton)
                    .map((gift, index) => (
                      <RegularGiftCard key={`regular-${gift.id}-${index}`} gift={gift} />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Note - shown only when data is loaded */}
        {(nftData || singleGift) && !loading && (
          <div className="telegram-card p-4 border border-border/30 bg-muted/30">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              ℹ️ {t('footerNote')}
            </p>
          </div>
        )}

      </div>

      {/* Bottom Toggle Buttons */}
      <div className="fixed bottom-16 left-0 right-0 z-30 bg-background/90 backdrop-blur-lg border-t border-border/30">
        <div className="max-w-md mx-auto p-3">
          <div className="flex gap-2 bg-background/50 p-1.5 rounded-xl border border-border shadow-lg">
            <button
              onClick={() => {
                setSearchMode('user');
                setError(null);
                setSingleGift(null);
              }}
              className={`flex-1 py-3 px-4 rounded-lg transition-all duration-300 font-medium ${
                searchMode === 'user'
                  ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="w-4 h-4 inline-block mr-2" />
              {t('userProfile')}
            </button>
            <button
              onClick={() => {
                setSearchMode('gift');
                setError(null);
                setNftData(null);
              }}
              className={`flex-1 py-3 px-4 rounded-lg transition-all duration-300 font-medium ${
                searchMode === 'gift'
                  ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Gift className="w-4 h-4 inline-block mr-2" />
              {t('singleGift')}
            </button>
          </div>
        </div>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Optional Subscription Popup */}
      <SubscribePrompt 
        isOpen={showSubscribePopup}
        onClose={() => {
          setShowSubscribePopup(false);
          setHasSkippedSubscribe(true);
        }}
      />
    </div>
  );
};

export default TelegramApp;