import { useState } from 'react';
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

type TabType = 'market' | 'portfolio' | 'leaderboard';

const TradingPage = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [activeTab, setActiveTab] = useState<TabType>('market');

  // Data hooks
  const { data: giftsData, isLoading: giftsLoading } = useTradingGifts();
  const { data: portfolioData, isLoading: portfolioLoading } = usePortfolio();
  const { data: leaderboardData, isLoading: leaderboardLoading } = useLeaderboard();

  // Mutation hooks
  const buyMutation = useBuyGift();
  const sellMutation = useSellGift();
  const resetMutation = useResetAccount();

  // Handlers
  const handleBuy = async (giftName: string, quantity: number) => {
    try {
      const result = await buyMutation.mutateAsync({ giftName, quantity });
      toast.success(
        isRTL 
          ? `تم شراء ${quantity} ${giftName} بنجاح!` 
          : `Successfully bought ${quantity} ${giftName}!`
      );
    } catch (error: any) {
      toast.error(error.message || (isRTL ? 'فشل في الشراء' : 'Failed to buy'));
    }
  };

  const handleSell = async (holdingId: number) => {
    try {
      const result = await sellMutation.mutateAsync(holdingId);
      const pnlText = result.data.pnl_percent >= 0 
        ? `+${result.data.pnl_percent.toFixed(2)}%` 
        : `${result.data.pnl_percent.toFixed(2)}%`;
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

  // Calculate USD balance estimate (assuming 1 TON = ~5.2 USD as an approximation)
  const tonToUsdRate = 5.2;
  const balanceTon = portfolioData?.data?.balance_ton ?? 10000;
  const balanceUsd = balanceTon * tonToUsdRate;

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
