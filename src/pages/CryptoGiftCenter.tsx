/**
 * CryptoGiftCenter - Premium Crypto Trading View
 * @novachartsbot - Crypto Gift Center
 * 
 * Features:
 * - Top 20 cryptocurrencies display
 * - Gift-card style coin cards
 * - Interactive Chart.js charts
 * - Multi-timeframe selectors
 * - Base64 localStorage image caching
 * - Responsive: Mobile (vertical list) / Desktop (5-column grid)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, TrendingUp, Search, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import CryptoGiftCard from '@/components/crypto/CryptoGiftCard';
import CryptoChart from '@/components/crypto/CryptoChart';
import { 
  CryptoMarketData, 
  fetchTopCryptos, 
  formatMarketCap,
  formatPercentage 
} from '@/services/cryptoService';

const CryptoGiftCenter: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { theme } = useTheme();
  
  const [coins, setCoins] = useState<CryptoMarketData[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<CryptoMarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch market data
  const loadMarketData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchTopCryptos(20);
      setCoins(data);
      
      // Auto-select first coin if none selected
      if (!selectedCoin && data.length > 0) {
        setSelectedCoin(data[0]);
      }
    } catch (err) {
      console.error('[CryptoGiftCenter] Error loading data:', err);
      setError(language === 'ar' 
        ? 'فشل في تحميل البيانات. حاول مرة أخرى.' 
        : 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCoin, language]);

  // Initial load
  useEffect(() => {
    loadMarketData();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadMarketData(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [loadMarketData]);

  // Filter coins by search
  const filteredCoins = useMemo(() => {
    if (!searchQuery.trim()) return coins;
    
    const query = searchQuery.toLowerCase();
    return coins.filter(coin => 
      coin.name.toLowerCase().includes(query) ||
      coin.symbol.toLowerCase().includes(query)
    );
  }, [coins, searchQuery]);

  // Calculate market summary
  const marketSummary = useMemo(() => {
    if (coins.length === 0) return null;

    const totalMarketCap = coins.reduce((sum, coin) => sum + coin.market_cap, 0);
    const totalVolume = coins.reduce((sum, coin) => sum + coin.total_volume, 0);
    const avgChange = coins.reduce((sum, coin) => sum + (coin.price_change_percentage_24h || 0), 0) / coins.length;
    const gainers = coins.filter(c => (c.price_change_percentage_24h || 0) > 0).length;

    return {
      totalMarketCap,
      totalVolume,
      avgChange,
      gainers,
      losers: coins.length - gainers
    };
  }, [coins]);

  const handleCoinSelect = (coin: CryptoMarketData) => {
    setSelectedCoin(coin);
    // Scroll to chart on mobile
    if (window.innerWidth < 768) {
      setTimeout(() => {
        document.getElementById('crypto-chart')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 p-4 max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {language === 'ar' ? 'مركز هدايا الكريبتو' : 'Crypto Gift Center'}
            </h1>
            <p className="text-xs text-muted-foreground">
              @novachartsbot
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadMarketData(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            {!refreshing && (language === 'ar' ? 'تحديث' : 'Refresh')}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Market Summary */}
        {marketSummary && !loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={cn(
              "p-3 rounded-xl",
              "bg-card/80 dark:bg-card/60 backdrop-blur-sm",
              "border border-border/30"
            )}>
              <p className="text-[10px] text-muted-foreground mb-1">
                {language === 'ar' ? 'إجمالي القيمة السوقية' : 'Total Market Cap'}
              </p>
              <p className="font-bold text-foreground text-sm">
                {formatMarketCap(marketSummary.totalMarketCap)}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-xl",
              "bg-card/80 dark:bg-card/60 backdrop-blur-sm",
              "border border-border/30"
            )}>
              <p className="text-[10px] text-muted-foreground mb-1">
                {language === 'ar' ? 'حجم التداول 24س' : '24h Volume'}
              </p>
              <p className="font-bold text-foreground text-sm">
                {formatMarketCap(marketSummary.totalVolume)}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-xl",
              "bg-card/80 dark:bg-card/60 backdrop-blur-sm",
              "border border-border/30"
            )}>
              <p className="text-[10px] text-muted-foreground mb-1">
                {language === 'ar' ? 'متوسط التغيير' : 'Avg. Change'}
              </p>
              <p className={cn(
                "font-bold text-sm",
                marketSummary.avgChange >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {formatPercentage(marketSummary.avgChange)}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-xl",
              "bg-card/80 dark:bg-card/60 backdrop-blur-sm",
              "border border-border/30"
            )}>
              <p className="text-[10px] text-muted-foreground mb-1">
                {language === 'ar' ? 'الرابحون/الخاسرون' : 'Gainers/Losers'}
              </p>
              <p className="font-bold text-foreground text-sm">
                <span className="text-green-500">{marketSummary.gainers}</span>
                {' / '}
                <span className="text-red-500">{marketSummary.losers}</span>
              </p>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={language === 'ar' ? 'ابحث عن عملة...' : 'Search coins...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground text-sm">
              {language === 'ar' ? 'جاري تحميل البيانات...' : 'Loading market data...'}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-10 h-10 text-destructive mb-4" />
            <p className="text-muted-foreground text-sm mb-4">{error}</p>
            <Button onClick={() => loadMarketData()} variant="outline">
              {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
            </Button>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section - Full width on mobile, 2/3 on desktop */}
            <div id="crypto-chart" className="lg:col-span-2 order-1 lg:order-2">
              {selectedCoin ? (
                <CryptoChart
                  coinId={selectedCoin.id}
                  coinName={selectedCoin.name}
                  coinSymbol={selectedCoin.symbol}
                  currentPrice={selectedCoin.current_price}
                  priceChange24h={selectedCoin.price_change_percentage_24h || 0}
                />
              ) : (
                <div className={cn(
                  "flex items-center justify-center h-[400px]",
                  "bg-card/80 dark:bg-card/60 backdrop-blur-xl",
                  "rounded-2xl border border-border/30"
                )}>
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'اختر عملة لعرض الرسم البياني' : 'Select a coin to view chart'}
                  </p>
                </div>
              )}
            </div>

            {/* Coins Grid - 1/3 on desktop */}
            <div className="order-2 lg:order-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {language === 'ar' ? 'أفضل 20 عملة' : 'Top 20 Coins'}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {filteredCoins.length} {language === 'ar' ? 'عملة' : 'coins'}
                </span>
              </div>

              {/* Mobile: Vertical List / Desktop: Scrollable Grid */}
              <div className={cn(
                "grid gap-3",
                "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-1",
                "lg:max-h-[600px] lg:overflow-y-auto lg:pr-2",
                "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
              )}>
                {filteredCoins.map((coin) => (
                  <CryptoGiftCard
                    key={coin.id}
                    coin={coin}
                    onClick={handleCoinSelect}
                    isSelected={selectedCoin?.id === coin.id}
                  />
                ))}
              </div>

              {filteredCoins.length === 0 && searchQuery && (
                <div className="text-center py-10">
                  <p className="text-muted-foreground text-sm">
                    {language === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Desktop: Full Width Grid View */}
        {!loading && !error && coins.length > 0 && (
          <div className="hidden xl:block mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">
                {language === 'ar' ? 'عرض الشبكة' : 'Grid View'}
              </h2>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {filteredCoins.slice(0, 20).map((coin) => (
                <CryptoGiftCard
                  key={`grid-${coin.id}`}
                  coin={coin}
                  onClick={handleCoinSelect}
                  isSelected={selectedCoin?.id === coin.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Watermark */}
        <div className="text-center py-6">
          <span className="text-xs text-muted-foreground/50">
            Powered by @novachartsbot • Data from CoinGecko
          </span>
        </div>
      </div>
    </div>
  );
};

export default CryptoGiftCenter;
