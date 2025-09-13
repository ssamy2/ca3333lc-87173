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
import { fetchNFTGifts } from '@/services/apiService';

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
  const [nftData, setNftData] = useState<NFTData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const { toast } = useToast();

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

    // Detect Telegram user
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (telegramUser) {
      const detectedUsername = telegramUser.username || telegramUser.first_name || 'user';
      setCurrentUser(detectedUsername);
      setUsername(detectedUsername);
      fetchNFTs(detectedUsername);
    } else {
      // Fallback for testing
      setCurrentUser('demo_user');
      setUsername('demo_user');
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
    const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('nft_search_history', JSON.stringify(newHistory));
  };

  const fetchNFTs = async (searchUsername: string) => {
    if (!searchUsername.trim()) return;

    setLoading(true);
    setError(null);
    setNftData(null);

    try {
      const data: APIResponse = await fetchNFTGifts(searchUsername);

      if (data.success && data.data) {
        setNftData(data.data);
        saveToHistory(searchUsername);
        const giftCount = data.data.nfts?.length || data.data.visible_nfts || 0;
        toast({
          title: "تم بنجاح!",
          description: `تم العثور على ${giftCount} هدية NFT لـ ${data.data.owner}`,
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
        title: "خطأ في الطلب",
        description: "حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.",
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
    return nftData.nfts.reduce((total, nft) => total + (nft.avg_price * nft.count), 0);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-primary/10 text-primary transition-all duration-200"
          style={{ height: `${Math.min(pullDistance, 80)}px` }}
        >
          <div className={`flex items-center gap-2 ${pullDistance > 80 ? 'animate-spin' : ''}`}>
            <TonIcon className="w-6 h-6" />
            <span className="text-sm font-medium">
              {pullDistance > 80 ? 'Release to refresh' : 'Pull down to refresh'}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Header */}
          <div className="telegram-card p-6 text-center animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
              <Calculator className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">Nova Calculator</h1>
              <p className="text-sm text-muted-foreground">Advanced NFT Analytics</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Professional insights for Telegram NFT gifts</p>
        </div>

        {/* Current User Info */}
        {currentUser && (
          <div className="relative overflow-hidden telegram-card p-6 animate-slide-up bg-gradient-to-br from-background via-background/95 to-primary/5 border border-primary/10 shadow-lg hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-2 right-2 w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-full blur-3xl"></div>
              <div className="absolute bottom-2 left-2 w-24 h-24 bg-gradient-to-tr from-accent to-primary rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Enhanced User Avatar */}
                <div className="relative group">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary via-primary/90 to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-300 border border-primary/20">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  {/* Avatar Ring Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary to-accent rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
                  {/* Online Status Indicator */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background shadow-sm flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                {/* Enhanced User Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      المستخدم الحالي
                    </h3>
                    <div className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                      نشط
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
              {/* Enhanced Refresh Button */}
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleRefresh}
                  disabled={loading || countdown > 0}
                  variant="ghost"
                  size="sm"
                  className="relative h-10 w-10 p-0 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border border-primary/20 shadow-sm hover:shadow-md hover:shadow-primary/10 transition-all duration-300 group"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-primary' : 'text-primary/70 group-hover:text-primary'} transition-colors duration-200`} />
                  {/* Button Glow Effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10"></div>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="telegram-card p-4 animate-slide-up">
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="اكتب اسم المستخدم..."
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
              <p className="text-xs text-muted-foreground font-medium">عمليات البحث الأخيرة</p>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => setUsername(term)}
                    className="px-3 py-1 bg-secondary/70 text-secondary-foreground rounded-full text-xs hover:bg-secondary transition-colors border border-border/30"
                  >
                    @{term}
                  </button>
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
            {/* Owner Info */}
            <div className="telegram-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{nftData.owner}</h2>
                <p className="text-sm text-muted-foreground">
                  {nftData.nfts?.length || nftData.visible_nfts || 0} هدية NFT مرئية
                </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-primary">
                    <TonIcon className="w-5 h-5" />
                    <span className="font-bold text-lg">{formatTON(calculateTotalValue())}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">القيمة الإجمالية</p>
                </div>
              </div>

              {/* Price Stats */}
              {nftData.prices && (
                <div className="grid grid-cols-2 gap-3">
                  {nftData.prices.floor_price && (
                    <StatsCard
                      icon={<TonIcon className="w-4 h-4 text-success" />}
                      label="Floor Price"
                      value={`${formatTON(nftData.prices.floor_price.TON)} TON`}
                      subValue={`$${formatTON(nftData.prices.floor_price.USD)}`}
                    />
                  )}
                  {nftData.prices.avg_price && (
                    <StatsCard
                      icon={<TonIcon className="w-4 h-4 text-warning" />}
                      label="Avg Price"
                      value={`${formatTON(nftData.prices.avg_price.TON)} TON`}
                      subValue={`$${formatTON(nftData.prices.avg_price.USD)}`}
                    />
                  )}
                </div>
              )}
            </div>

            {/* NFT Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">مجموعة NFT</h3>
                <span className="text-sm text-muted-foreground">
                  {nftData.nfts?.length || 0} items
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {nftData.nfts && Array.isArray(nftData.nfts) && nftData.nfts.map((nft, index) => (
                  <NFTCard key={index} nft={nft} />
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && !error && !nftData && currentUser && (
          <EmptyState onSearch={() => handleSearch()} />
        )}

        {/* Telegram WebApp Footer */}
        <div className="text-center py-6">
          <p className="text-xs text-muted-foreground">
            صُنع بـ ❤️ لتيليجرام • مدعوم بـ Nva Analytics
          </p>
        </div>
      </div>
    </div>
  );
};

export default TelegramApp;