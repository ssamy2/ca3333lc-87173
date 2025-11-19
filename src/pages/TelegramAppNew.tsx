import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/i18n/translations';
import { useTelegramInit } from '@/hooks/useTelegramInit';
import { useLaunchParams } from '@/hooks/useLaunchParams';
import { useNFTSearch } from '@/hooks/useNFTSearch';
import { useGiftSearch } from '@/hooks/useGiftSearch';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useRateLimit } from '@/hooks/useRateLimit';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useUserProfile } from '@/hooks/useUserProfile';
import { HeroSection } from '@/components/search/HeroSection';
import { ModeToggle } from '@/components/search/ModeToggle';
import { SearchBox } from '@/components/search/SearchBox';
import { HistoryList } from '@/components/search/HistoryList';
import { RateLimitNotice } from '@/components/search/RateLimitNotice';
import { UserHeader } from '@/components/nft/UserHeader';
import { NFTGrid } from '@/components/nft/NFTGrid';
import { TotalValueCard } from '@/components/nft/TotalValueCard';
import { GiftDetailsView } from '@/components/gift/GiftDetailsView';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import AppLoader from '@/components/AppLoader';
import TelegramAuthError from '@/components/TelegramAuthError';
import BottomNav from '@/components/BottomNav';
import Chart from '@/pages/Chart';
import ProfileSettingsPage from '@/pages/ProfileSettingsPage';
import SubscribePrompt from '@/components/SubscribePrompt';
import novaLogo from '@/assets/nova-logo-new.png';

const TelegramAppNew: React.FC = () => {
  const { isAuthenticated, isSubscribed, isLoading: authLoading, authError } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const launchParams = useLaunchParams();
  
  useTelegramInit();
  const user = useUserProfile();
  const { nftData, userProfile, loading: nftLoading, error: nftError, searchNFTs, clearResults: clearNFT } = useNFTSearch();
  const { gift, loading: giftLoading, error: giftError, searchGift, clearGift } = useGiftSearch();
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();
  const { countdown, isLimited, startCountdown } = useRateLimit();
  
  const [activeTab, setActiveTab] = useState<'home' | 'chart' | 'settings'>('home');
  const [searchMode, setSearchMode] = useState<'user' | 'gift'>('user');
  const [username, setUsername] = useState(user.username);
  const [giftUrl, setGiftUrl] = useState('');
  const [showSubscribePopup, setShowSubscribePopup] = useState(false);
  const [hasSkippedSubscribe, setHasSkippedSubscribe] = useState(false);
  const [autoSearchTriggered, setAutoSearchTriggered] = useState(false);

  const t = (key: keyof typeof import('@/i18n/translations').translations.en) => 
    getTranslation(language, key);

  const handleRefresh = useCallback(() => {
    if (user.username && !isLimited) {
      searchNFTs(user.username);
    }
  }, [user.username, isLimited, searchNFTs]);

  const { pullDistance } = usePullToRefresh(handleRefresh);

  const handleNFTSearch = useCallback(async () => {
    if (!username.trim() || isLimited) return;

    const result = await searchNFTs(username.trim());
    if (result.success) {
      addToHistory(username.trim());
      toast({
        title: t('success'),
        description: `Found ${result.data?.nfts?.length || 0} NFT gifts`,
      });
    } else if (result.error?.includes('RATE_LIMIT')) {
      startCountdown(60);
    }
  }, [username, isLimited, searchNFTs, addToHistory, toast, t, startCountdown]);

  const handleGiftSearchAction = useCallback(async () => {
    if (!giftUrl.trim() || isLimited) return;

    const result = await searchGift(giftUrl.trim());
    if (result.success) {
      toast({
        title: t('success'),
        description: `Found gift: ${result.data?.gift_name}`,
      });
    }
  }, [giftUrl, isLimited, searchGift, toast, t]);

  const handleSearch = useCallback(() => {
    if (searchMode === 'user') {
      handleNFTSearch();
    } else {
      handleGiftSearchAction();
    }
  }, [searchMode, handleNFTSearch, handleGiftSearchAction]);

  const handleModeChange = useCallback((mode: 'user' | 'gift') => {
    setSearchMode(mode);
    clearNFT();
    clearGift();
  }, [clearNFT, clearGift]);

  useEffect(() => {
    if (!isAuthenticated || autoSearchTriggered) return;

    if (launchParams.adminAccess) {
      navigate('/admin');
      setAutoSearchTriggered(true);
    } else if (launchParams.adminAds) {
      navigate('/admin/ads');
      setAutoSearchTriggered(true);
    } else if (launchParams.searchUser) {
      setUsername(launchParams.searchUser);
      setSearchMode('user');
      setTimeout(() => {
        searchNFTs(launchParams.searchUser!);
        setAutoSearchTriggered(true);
      }, 500);
    } else if (launchParams.searchGift) {
      setGiftUrl(launchParams.searchGift);
      setSearchMode('gift');
      setTimeout(() => {
        searchGift(launchParams.searchGift!);
        setAutoSearchTriggered(true);
      }, 500);
    }
  }, [isAuthenticated, launchParams, autoSearchTriggered, navigate, searchNFTs, searchGift]);

  useEffect(() => {
    if (isAuthenticated && !isSubscribed && !hasSkippedSubscribe) {
      const timer = setTimeout(() => setShowSubscribePopup(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isSubscribed, hasSkippedSubscribe]);

  if (activeTab === 'chart') {
    return (
      <>
        <Chart />
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

  if (authLoading) return <AppLoader onComplete={() => {}} />;
  if (authError) return <TelegramAuthError />;
  if (!isAuthenticated) return <AppLoader onComplete={() => {}} />;

  const loading = nftLoading || giftLoading;
  const error = nftError || giftError;

  return (
    <div className="min-h-screen bg-background relative pb-20">
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
        {!nftData && !gift && !loading && !error && (
          <HeroSection
            title={t('heroTitle')}
            description={t('heroDescription')}
            example={t('heroExample')}
          />
        )}

        <div className="telegram-card p-5 border border-border/50 shadow-[var(--shadow-card)] space-y-4">
          <ModeToggle
            mode={searchMode}
            onModeChange={handleModeChange}
            userLabel={t('userProfile')}
            giftLabel={t('singleGift')}
          />

          <SearchBox
            mode={searchMode}
            value={searchMode === 'user' ? username : giftUrl}
            placeholder={searchMode === 'user' ? (user.username ? `@${user.username}` : t('enterUsername')) : t('enterGiftUrl')}
            disabled={loading || isLimited}
            onChange={searchMode === 'user' ? setUsername : setGiftUrl}
            onSearch={handleSearch}
          />

          {searchMode === 'user' && (
            <HistoryList
              history={history}
              onSelect={setUsername}
              onRemove={removeFromHistory}
              onClearAll={clearHistory}
              recentLabel={t('recentSearches')}
              clearLabel={t('clearAll')}
            />
          )}

          <RateLimitNotice
            countdown={countdown}
            limitedLabel={t('rateLimited')}
            waitLabel={t('pleaseWait')}
          />
        </div>

        {loading && <LoadingState />}
        {error && !loading && <ErrorState error={error} onRetry={handleSearch} canRetry={!isLimited} />}

        {nftData && !loading && (
          <div className="space-y-4">
            <UserHeader
              username={nftData.owner}
              fullName={userProfile?.name}
              photoUrl={user.photoUrl}
              onRefresh={handleRefresh}
              disabled={isLimited}
            />
            <TotalValueCard nfts={nftData.nfts} totalLabel={t('totalValue')} />
            <NFTGrid nfts={nftData.nfts} />
          </div>
        )}

        {gift && !loading && (
          <GiftDetailsView
            gift={gift}
            modelLabel={t('model')}
            backdropLabel={t('backdrop')}
            priceTonLabel={t('priceTon')}
            priceUsdLabel={t('priceUsd')}
            rarityLabel={t('rarity')}
          />
        )}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

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

export default TelegramAppNew;
