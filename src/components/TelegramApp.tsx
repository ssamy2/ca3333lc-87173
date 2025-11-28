import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import BottomNav from './BottomNav';
import Chart from '@/pages/Chart';
import ProfileSettingsPage from '@/pages/ProfileSettingsPage';
import { fetchNFTGifts, fetchSingleGiftPrice } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import AppLoader from './AppLoader';
import SubscribePrompt from './SubscribePrompt';
import TelegramAuthError from './TelegramAuthError';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/i18n/translations';
import { useLaunchParams } from '@/hooks/useLaunchParams';
import { useNavigate } from 'react-router-dom';

// Import new modular components
import HeroSection from './home/HeroSection';
import SearchBox from './home/SearchBox';
import UserInfoHeader from './home/UserInfoHeader';
import NFTGrid from './home/NFTGrid';
import GiftView from './home/GiftView';

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

const TelegramApp: React.FC = () => {
  const { isAuthenticated, isSubscribed, isLoading: authLoading, authError } = useAuth();
  const { language } = useLanguage();
  const launchParams = useLaunchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [username, setUsername] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [searchedUserProfile, setSearchedUserProfile] = useState<UserProfile | null>(null);
  const [nftData, setNftData] = useState<NFTData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'chart' | 'settings'>('home');
  const [searchMode, setSearchMode] = useState<'user' | 'gift'>('user');
  const [giftUrl, setGiftUrl] = useState('');
  const [singleGift, setSingleGift] = useState<any | null>(null);
  const [hasSkippedSubscribe, setHasSkippedSubscribe] = useState(false);
  const [showSubscribePopup, setShowSubscribePopup] = useState(false);
  const [autoSearchTriggered, setAutoSearchTriggered] = useState(false);
  
  // Translation helper
  const t = useCallback((key: keyof typeof import('@/i18n/translations').translations.en) => 
    getTranslation(language, key), [language]);

  // Initialize Telegram WebApp - ONCE
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      webApp.ready();
      webApp.expand();
      
      // Additional configuration
      const webAppAny = webApp as any;
      if (webAppAny.disableVerticalSwipes) webAppAny.disableVerticalSwipes();
      if (webAppAny.setHeaderColor) webAppAny.setHeaderColor('#2481cc');
      if (webAppAny.setBackgroundColor) webAppAny.setBackgroundColor('#f0f8ff');
    }

    // Detect Telegram user
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (telegramUser) {
      const detectedUsername = telegramUser.username || 'user';
      setCurrentUser(detectedUsername);
      setUsername(detectedUsername);
    } else {
      setCurrentUser('demo_user');
      setUsername('demo_user');
    }

    // Load search history
    const history = localStorage.getItem('nft_search_history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []); // Empty dependency - run ONCE

  // Handle Launch Parameters - with guard
  useEffect(() => {
    if (!isAuthenticated || autoSearchTriggered) return;

    if (launchParams.adminAccess) {
      navigate('/admin');
      setAutoSearchTriggered(true);
      return;
    }

    if (launchParams.adminAds || launchParams.startapp === 'admin_ads') {
      navigate('/admin/ads');
      setAutoSearchTriggered(true);
      return;
    }

    if (launchParams.searchUser) {
      setUsername(launchParams.searchUser);
      setSearchMode('user');
      setTimeout(() => {
        fetchNFTs(launchParams.searchUser!);
        setAutoSearchTriggered(true);
      }, 500);
    } else if (launchParams.searchGift) {
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
          setError('Failed to fetch gift data');
          setAutoSearchTriggered(true);
        }
      }, 500);
    }
  }, [isAuthenticated, launchParams, autoSearchTriggered, navigate, toast]);

  // Show subscription popup
  useEffect(() => {
    if (isAuthenticated && !isSubscribed && !hasSkippedSubscribe) {
      const timer = setTimeout(() => {
        setShowSubscribePopup(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isSubscribed, hasSkippedSubscribe]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // History management
  const saveToHistory = useCallback((searchTerm: string) => {
    const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 8);
    setSearchHistory(newHistory);
    localStorage.setItem('nft_search_history', JSON.stringify(newHistory));
  }, [searchHistory]);

  const removeFromHistory = useCallback((searchTerm: string) => {
    const newHistory = searchHistory.filter(h => h !== searchTerm);
    setSearchHistory(newHistory);
    localStorage.setItem('nft_search_history', JSON.stringify(newHistory));
  }, [searchHistory]);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('nft_search_history');
    toast({
      title: "History Cleared",
      description: "Search history has been deleted",
    });
  }, [toast]);

  // API Error Handler
  const handleAPIMessage = useCallback((message: string, waitTime?: number) => {
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
  }, []);

  // Fetch NFTs
  const fetchNFTs = useCallback(async (searchUsername: string) => {
    if (!searchUsername.trim()) return;

    setLoading(true);
    setError(null);
    setNftData(null);
    setSearchedUserProfile(null);

    try {
      // Fetch NFT data
      const data = await fetchNFTGifts(searchUsername);

      if (data.success && data.data) {
        // Extract profile from NFT response data
        const profile: UserProfile = {
          name: data.data.name || data.data.owner || searchUsername,
          photo_base64: data.data.profile_image || null
        };
        
        setNftData(data.data);
        setSearchedUserProfile(profile);
        saveToHistory(searchUsername);
        const giftCount = data.data.nfts?.length || data.data.visible_nfts || 0;
        toast({
          title: "Success!",
          description: `Found ${giftCount} NFT gifts for ${data.data.owner}`,
        });
      } else {
        setError("Failed to fetch NFT data");
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'NETWORK_ERROR') {
          setError('NETWORK_ERROR');
        } else if (err.message === 'RATE_LIMIT_EXCEEDED') {
          setError('RATE_LIMIT_EXCEEDED');
          setCountdown(60);
        } else if (err.message === 'USER_NOT_FOUND') {
          setError('user_not_found');
        } else {
          setError(err.message);
        }
      } else {
        setError('NETWORK_ERROR');
      }
      
      toast({
        title: "Request Error",
        description: "An error occurred while fetching data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, handleAPIMessage, saveToHistory]);

  // Handle Gift Search
  const handleGiftSearch = useCallback(async () => {
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
  }, [giftUrl, countdown, toast]);

  // Handle Search
  const handleSearch = useCallback(() => {
    if (searchMode === 'user') {
      if (username.trim() && countdown === 0) {
        fetchNFTs(username.trim());
      }
    } else {
      handleGiftSearch();
    }
  }, [searchMode, username, countdown, fetchNFTs, handleGiftSearch]);

  // Format TON
  const formatTON = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  // Handle search mode change
  const handleSearchModeChange = useCallback((mode: 'user' | 'gift') => {
    setSearchMode(mode);
    setError(null);
    if (mode === 'user') {
      setSingleGift(null);
    } else {
      setNftData(null);
    }
  }, []);

  // Check authentication
  if (authLoading) {
    return <AppLoader onComplete={() => {}} />;
  }

  if (authError) {
    return <TelegramAuthError />;
  }

  if (!isAuthenticated) {
    return <AppLoader onComplete={() => {}} />;
  }

  // Main render - NO early returns for tabs
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Home Content */}
      {activeTab === 'home' && (
        <div className="w-full p-4 space-y-6">
          {/* Hero Section */}
          {!nftData && !singleGift && !loading && !error && (
            <HeroSection t={t} />
          )}

          {/* Search Section */}
          <SearchBox
            searchMode={searchMode}
            username={username}
            giftUrl={giftUrl}
            currentUser={currentUser}
            loading={loading}
            countdown={countdown}
            searchHistory={searchHistory}
            onSearchModeChange={handleSearchModeChange}
            onUsernameChange={setUsername}
            onGiftUrlChange={setGiftUrl}
            onSearch={handleSearch}
            onHistorySelect={setUsername}
            onHistoryRemove={removeFromHistory}
            onHistoryClear={clearHistory}
            t={t}
          />

          {/* Loading State */}
          {loading && <LoadingState />}
          
          {/* Error State */}
          {error && !loading && (
            <ErrorState 
              error={error} 
              onRetry={handleSearch} 
              canRetry={countdown === 0}
            />
          )}

          {/* Single Gift Display */}
          {singleGift && !loading && !error && (
            <GiftView gift={singleGift} t={t} />
          )}

          {/* NFT Data Display */}
          {nftData && !loading && !error && (
            <div className="space-y-5 animate-bounce-in">
              <UserInfoHeader
                nftData={nftData}
                searchedUserProfile={searchedUserProfile}
                formatTON={formatTON}
              />
              
              {nftData.nfts && Array.isArray(nftData.nfts) && (
                <NFTGrid nfts={nftData.nfts} />
              )}
            </div>
          )}

          {/* Footer Note */}
          {(nftData || singleGift) && !loading && (
            <div className="telegram-card p-4 border border-border/30 bg-muted/30">
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                ℹ️ {t('footerNote')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Chart Tab */}
      {activeTab === 'chart' && <Chart />}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <ProfileSettingsPage onBack={() => setActiveTab('home')} />
      )}

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Subscription Popup */}
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