import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Calculator, RefreshCw, User } from 'lucide-react';
import NFTCard from './NFTCard';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import TonIcon from './TonIcon';
import StatsCard from './StatsCard';
import ThemeToggle from './ThemeToggle';
import BottomNav from './BottomNav';
import Chart from '@/pages/Chart';
import { fetchNFTGifts, fetchUserProfile } from '@/services/apiService';
import { useTheme } from '@/hooks/useTheme';
import novaLogo from '@/assets/nova-logo.png';

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
  details: {
    links: string[];
  };
}

interface NFTData {
  owner: string;
  visible_nfts?: number;
  total_saved_gifts?: number;
  prices: {
    floor_price: { TON: number; USD: number; STAR: number };
    avg_price: { TON: number; USD: number; STAR: number };
  };
  nfts: NFTGift[];
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [activeTab, setActiveTab] = useState<'home' | 'chart'>('home');
  const { toast } = useToast();
  const { theme, setTheme, isLight, isDark } = useTheme();

  // Initialize Telegram WebApp
  useEffect(() => {
    // Configure Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      
      // Additional configuration if methods are available
      const webApp = window.Telegram.WebApp as any;
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

  // Countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Pull-to-refresh functionality
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (pullStartY > 0 && window.scrollY === 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - pullStartY);
      setPullDistance(distance);
      
      if (distance > 80) {
        setIsRefreshing(true);
      }
    }
  }, [pullStartY]);

  const handleTouchEnd = useCallback(() => {
    if (isRefreshing && countdown === 0) {
      handleRefresh();
    }
    setPullStartY(0);
    setPullDistance(0);
    setIsRefreshing(false);
  }, [isRefreshing, countdown]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

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
      // Fetch both NFT data and user profile in parallel
      const [data, profile] = await Promise.all([
        fetchNFTGifts(searchUsername),
        fetchUserProfile(searchUsername)
      ]);

      if (data.success && data.data) {
        setNftData(data.data);
        setSearchedUserProfile(profile);
        saveToHistory(searchUsername);
        const giftCount = data.data.nfts?.length || data.data.visible_nfts || 0;
        toast({
          title: "Success!",
          description: `Found ${giftCount} NFT gifts for ${data.data.owner}`,
        });
      } else if (data.message) {
        handleAPIMessage(data.message, data.wait_time);
      } else {
        setError(data.error || "Failed to fetch NFT data");
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
        } else if (err.message === 'RATE_LIMIT_EXCEEDED') {
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
    if (username.trim() && countdown === 0) {
      fetchNFTs(username.trim());
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

  if (activeTab === 'chart') {
    return (
      <>
        <Chart />
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-20">
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-primary/10 text-primary transition-all duration-200"
          style={{ height: `${Math.min(pullDistance, 80)}px` }}
        >
          <div className={`flex items-center gap-2 ${pullDistance > 80 ? 'animate-spin' : ''}`}>
            <img src={novaLogo} alt="Nova" className="w-6 h-6 rounded-full" />
            <span className="text-sm font-medium">
              {pullDistance > 80 ? 'Release to refresh' : 'Pull down to refresh'}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Header - Nova Calculator */}
        <div className="telegram-card p-6 animate-fade-in bg-gradient-to-br from-card to-card/80 border shadow-lg">
          <div className="flex flex-col gap-6">
            {/* Top Row - Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md overflow-hidden">
                <img src={novaLogo} alt="Nova Logo" className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-xl font-bold text-foreground">Nova</h1>
                <p className="text-sm text-muted-foreground">Telegram Gifts Price Checker</p>
              </div>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Channel and Chat Links */}
            <div className="flex gap-3">
              <Button
                asChild
                variant="outline"
                className="flex-1"
              >
                <a 
                  href="https://t.me/GT_Rolet" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Channel
                </a>
              </Button>
              
              <Button
                asChild
                variant="outline"
                className="flex-1"
              >
                <a 
                  href="https://t.me/Gifts_Super" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Chat
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Current User Info */}
        {currentUser && (
          <div className="relative overflow-hidden telegram-card p-6 animate-slide-up bg-gradient-to-br from-background via-background/95 to-primary/5 border border-primary/10 shadow-lg hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-2 right-2 w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-full blur-3xl"></div>
              <div className="absolute bottom-2 left-2 w-24 h-24 bg-gradient-to-tr from-accent to-primary rounded-full blur-2xl"></div>
            </div>
            
            {/* User Info Section */}
            <div className="relative flex items-center gap-4 mb-4">
              {/* Enhanced User Avatar with Photo */}
              <div className="relative group">
                <div className="w-16 h-16 bg-gradient-to-br from-primary via-primary/90 to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-300 border border-primary/20 overflow-hidden">
                  {currentUserPhotoUrl ? (
                    <img 
                      src={currentUserPhotoUrl}
                      alt={currentUserFullName || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                {/* Avatar Ring Effect */}
                <div className="absolute -inset-1 bg-gradient-to-br from-primary to-accent rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
                {/* Online Status Indicator */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background shadow-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              
              {/* Enhanced User Info */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {currentUserFullName || 'User'}
                  </h3>
                  <div className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                    Active
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">@</span>
                  <span className="font-mono text-sm font-medium text-foreground/90">{currentUser}</span>
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Telegram</span>
                </div>
              </div>
            </div>

            {/* Check My Gifts Button */}
            <div className="relative">
              <Button 
                onClick={handleRefresh}
                disabled={loading || countdown > 0}
                className="relative w-full h-12 rounded-xl bg-gradient-to-r from-primary via-primary/90 to-accent hover:from-primary/90 hover:via-primary hover:to-accent/90 text-white font-bold text-base shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 group border-0"
              >
                <div className="flex items-center justify-center gap-2">
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  )}
                  <span className="tracking-wide">
                    {loading ? 'Loading...' : 'Check My Gifts'}
                  </span>
                </div>
                {/* Button Shine Effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700 ease-in-out"></div>
              </Button>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="telegram-card p-4 animate-slide-up">
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder={currentUser ? `@${currentUser}` : "Enter username..."}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 h-11"
              disabled={loading || countdown > 0}
            />
            <Button 
              onClick={handleSearch}
              disabled={loading || countdown > 0 || !username.trim()}
              className="telegram-button h-11 px-4"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Recent Searches</p>
                <button
                  onClick={clearHistory}
                  className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All
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
                <span className="text-sm font-medium text-warning">Rate Limited</span>
              </div>
              <p className="text-xs text-warning/80">
                Please wait {countdown} seconds before next request
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

        {nftData && !loading && !error && (
          <div className="space-y-6 animate-bounce-in">
            {/* Owner Info with Photo */}
            <div className="telegram-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                  {searchedUserProfile?.photo_base64 ? (
                    <img 
                      src={`data:image/jpeg;base64,${searchedUserProfile.photo_base64}`}
                      alt={searchedUserProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{searchedUserProfile?.name || nftData.owner}</h2>
                  <p className="text-sm text-muted-foreground">
                    @{nftData.owner} • {nftData.nfts?.length || nftData.visible_nfts || 0} Visible NFT Gifts
                  </p>
                  {nftData.total_saved_gifts && nftData.total_saved_gifts > 0 && (
                    <p className="text-xs text-primary font-medium mt-1">
                      Total Saved Gifts: {nftData.total_saved_gifts}
                    </p>
                  )}
                </div>
              </div>

              {/* Total Value Card */}
              {nftData.prices?.avg_price && (
                <div className="flex justify-center">
                  <div className="w-full max-w-xs">
                    <StatsCard
                      icon={<Calculator className="w-4 h-4 text-primary" />}
                      label="Total Value"
                      value={`${formatTON(nftData.prices.avg_price.TON)} TON`}
                      subValue={`$${formatTON(nftData.prices.avg_price.USD)}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* NFT Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">NFT Collection</h3>
                <span className="text-sm text-muted-foreground">
                  {nftData.nfts?.length || 0} items
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {nftData.nfts && Array.isArray(nftData.nfts) && nftData.nfts.map((nft, index) => (
                  <NFTCard key={`${nft.name}-${nft.model}-${index}-${nft.floor_price}-${nft.avg_price}`} nft={nft} />
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && !error && !nftData && currentUser && (
          <EmptyState onSearch={() => handleSearch()} />
        )}

      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default TelegramApp;