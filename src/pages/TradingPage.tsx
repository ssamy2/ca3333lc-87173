import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { TradingHeader } from '@/components/trading/TradingHeader';
import { TradingTabs } from '@/components/trading/TradingTabs';
import { MarketTab } from '@/components/trading/MarketTab';
import { PortfolioTab } from '@/components/trading/PortfolioTab';
import { LeaderboardTab } from '@/components/trading/LeaderboardTab';
import {
  useTradingGifts,
  usePortfolio,
  useLeaderboard,
  useBuyGift,
  useSellGift,
  useResetAccount,
} from '@/hooks/useTradingData';
import { useMarketData } from '@/hooks/useMarketData';

type TabType = 'market' | 'portfolio' | 'leaderboard';

const TradingPage = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [activeTab, setActiveTab] = useState<TabType>('market');

  // Data hooks
  const { data: giftsData, isLoading: giftsLoading } = useTradingGifts();
  const { data: portfolioData, isLoading: portfolioLoading } = usePortfolio();
  const { data: leaderboardData, isLoading: leaderboardLoading } = useLeaderboard();
  const { data: marketData } = useMarketData();

  // Calculate real TON/USD rate from market data
  const tonToUsdRate = useMemo(() => {
    if (!marketData) return 1.81; // Default fallback
    
    // Get first available gift's price ratio to calculate TON/USD rate
    const gifts = Object.values(marketData);
    if (gifts.length === 0) return 1.81;
    
    // Find a gift with valid prices
    for (const gift of gifts) {
      const tonPrice = gift.priceTon || gift.price_ton;
      const usdPrice = gift.priceUsd || gift.price_usd;
      if (tonPrice > 0 && usdPrice > 0) {
        return usdPrice / tonPrice;
      }
    }
    return 1.81;
  }, [marketData]);

  // Mutation hooks
  const buyMutation = useBuyGift();
  const sellMutation = useSellGift();
  const resetMutation = useResetAccount();

  // Handlers
  const handleBuy = async (giftName: string, quantity: number, modelId?: string, modelName?: string, modelImageUrl?: string) => {
    try {
      const result = await buyMutation.mutateAsync({ giftName, quantity, modelNumber: modelId ? parseInt(modelId) : undefined, modelName, modelImageUrl });
      toast.success(
        isRTL 
          ? `تم شراء ${quantity} ${giftName} بنجاح!` 
          : `Successfully bought ${quantity} ${giftName}!`
      );
    } catch (error: any) {
      toast.error(error.message || (isRTL ? 'فشل في الشراء' : 'Failed to buy'));
    }
  };

  const handleSell = async (holdingId: number, quantity?: number) => {
    try {
      const result = await sellMutation.mutateAsync({ holdingId, quantity });
      const pnlPercent = result?.data?.pnl_percent ?? 0;
      const pnlText = pnlPercent >= 0 
        ? `+${pnlPercent.toFixed(2)}%` 
        : `${pnlPercent.toFixed(2)}%`;
      toast.success(
        isRTL 
          ? `تم البيع بنجاح! (${pnlText})` 
          : `Sold successfully! (${pnlText})`
      );
    } catch (error: any) {
      toast.error(error.message || (isRTL ? 'فشل في البيع' : 'Failed to sell'));
    }
  };

  const handleReset = async () => {
    try {
      await resetMutation.mutateAsync();
      toast.success(
        isRTL 
          ? 'تم إعادة تعيين الحساب بنجاح!' 
          : 'Account reset successfully!'
      );
    } catch (error: any) {
      toast.error(error.message || (isRTL ? 'فشل في إعادة التعيين' : 'Failed to reset'));
    }
  };

  // Calculate USD balance using real TON rate with safe fallbacks
  const balanceTon = portfolioData?.data?.balance_ton ?? 10000;
  const balanceUsd = (balanceTon || 0) * (tonToUsdRate || 1.81);

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Header with Balance */}
        <TradingHeader
          balanceTon={balanceTon}
          balanceUsd={balanceUsd}
          onReset={handleReset}
          isResetting={resetMutation.isPending}
          isRTL={isRTL}
        />

        {/* Sub Tabs */}
        <TradingTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isRTL={isRTL}
        />

        {/* Tab Content */}
        {activeTab === 'market' && (
          <MarketTab
            gifts={giftsData?.gifts ?? {}}
            isLoading={giftsLoading}
            isRTL={isRTL}
            onBuy={handleBuy}
            isBuying={buyMutation.isPending}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioTab
            portfolio={portfolioData?.data ?? null}
            isLoading={portfolioLoading}
            isRTL={isRTL}
            onSell={handleSell}
            isSelling={sellMutation.isPending}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardTab
            leaderboard={leaderboardData?.data ?? null}
            isLoading={leaderboardLoading}
            isRTL={isRTL}
          />
        )}
      </div>
    </div>
  );
};

export default TradingPage;
