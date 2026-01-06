/**
 * CryptoGiftCenter - Binance-Style Crypto Market
 * @novachartsbot - Premium Trading Design
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, Loader2, RefreshCw, Bitcoin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  CryptoMarketData, 
  fetchTopCryptos, 
  formatPrice,
  formatPercentage,
  formatMarketCap
} from '@/services/cryptoService';

type FilterMode = 'all' | 'gain' | 'lose' | 'price';

const CryptoGiftCenter: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [coins, setCoins] = useState<CryptoMarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const loadMarketData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch top 24 coins (to make room for TON)
      const data = await fetchTopCryptos(24);
      
      // Fetch TON separately
      let tonData: CryptoMarketData | null = null;
      try {
        const tonResponse = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=the-open-network&sparkline=false');
        if (tonResponse.ok) {
          const tonArray = await tonResponse.json();
          if (tonArray && tonArray.length > 0) {
            tonData = tonArray[0];
          }
        }
      } catch (tonError) {
        console.error('[CryptoGiftCenter] TON fetch error:', tonError);
      }
      
      // Insert TON at position 4 (index 3)
      let finalData: CryptoMarketData[];
      if (tonData) {
        finalData = [
          ...data.slice(0, 3),  // First 3 coins
          tonData,              // TON at position 4
          ...data.slice(3, 24)  // Remaining coins (total 25)
        ];
      } else {
        // If TON fetch failed, just use the 24 coins
        finalData = data;
      }
      
      setCoins(finalData);
    } catch (err) {
      console.error('[CryptoGiftCenter] Error:', err);
      setError(isRTL ? 'فشل في تحميل البيانات' : 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isRTL]);

  useEffect(() => {
    loadMarketData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadMarketData(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [loadMarketData]);

  const filteredCoins = useMemo(() => {
    let result = [...coins];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(coin =>
        coin.name.toLowerCase().includes(query) ||
        coin.symbol.toLowerCase().includes(query)
      );
    }
    
    if (filterMode === 'gain') {
      result = result.sort((a, b) => 
        (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
      );
    } else if (filterMode === 'lose') {
      result = result.sort((a, b) => 
        (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0)
      );
    } else if (filterMode === 'price') {
      result = result.sort((a, b) => b.current_price - a.current_price);
    }
    
    return result;
  }, [coins, searchQuery, filterMode]);

  const handleCoinClick = (coin: CryptoMarketData) => {
    navigate(`/crypto/${coin.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className={cn("flex items-center gap-3 mb-6", isRTL && "flex-row-reverse")}>
          <div className="p-2.5 bg-amber-500/10 rounded-xl ring-1 ring-amber-500/20">
            <Bitcoin className="w-6 h-6 text-amber-500" />
          </div>
          <div className={cn("flex-1", isRTL && "text-right")}>
            <h1 className="text-xl font-bold text-foreground">
              {isRTL ? 'العملات الرقمية' : 'Crypto Market'}
            </h1>
            <p className="text-xs text-muted-foreground">@novachartsbot</p>
          </div>
          <button
            onClick={() => loadMarketData(true)}
            disabled={refreshing}
            className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
          </button>
        </div>

        <div className={cn("flex gap-2 overflow-x-auto pb-2 mb-4", isRTL && "flex-row-reverse")}>
          <button
            onClick={() => setFilterMode('gain')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
              filterMode === 'gain'
                ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            {isRTL ? 'أعلى ربح' : 'Top Gain'}
          </button>
          <button
            onClick={() => setFilterMode('lose')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
              filterMode === 'lose'
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            {isRTL ? 'أعلى خسارة' : 'Top Lose'}
          </button>
          <button
            onClick={() => setFilterMode('price')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
              filterMode === 'price'
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}
          >
            <Bitcoin className="w-3.5 h-3.5" />
            {isRTL ? 'أعلى سعر' : 'Highest Price'}
          </button>
          {filterMode !== 'all' && (
            <button
              onClick={() => setFilterMode('all')}
              className="px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all bg-muted/30 text-muted-foreground hover:bg-muted/50"
            >
              {isRTL ? 'الكل' : 'All'}
            </button>
          )}
        </div>

        <div className="relative mb-4">
          <Search className={cn(
            "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground",
            isRTL ? "right-3" : "left-3"
          )} />
          <Input
            placeholder={isRTL ? "بحث عن عملة..." : "Search coins..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "bg-muted/20 border-border/50 h-11",
              isRTL ? "pr-10 text-right" : "pl-10"
            )}
          />
        </div>

        {error && (
          <div className="text-center py-10">
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => loadMarketData()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
            >
              {isRTL ? 'إعادة المحاولة' : 'Try Again'}
            </button>
          </div>
        )}

        <div className="space-y-2">
          {filteredCoins.map((coin, index) => {
            const changePercent = coin.price_change_percentage_24h || 0;
            const isPositive = changePercent >= 0;
            const displayRank = filterMode === 'all' ? index + 1 : (coin.market_cap_rank || index + 1);
            
            return (
              <button
                key={coin.id}
                onClick={() => handleCoinClick(coin)}
                className={cn(
                  "w-full glass-effect rounded-xl p-3 transition-all duration-200",
                  "hover:bg-muted/30 hover:scale-[1.01] active:scale-[0.99]",
                  "border border-transparent hover:border-primary/20"
                )}
              >
                <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                  <div className="relative flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-5 text-center font-mono">
                      {displayRank}
                    </span>
                    <img
                      src={coin.image_base64 || coin.image}
                      alt={coin.name}
                      className="w-10 h-10 rounded-full bg-muted"
                      loading="lazy"
                    />
                  </div>

                  <div className={cn("flex-1 min-w-0", isRTL ? "text-right" : "text-left")}>
                    <h3 className="font-semibold text-foreground truncate text-sm">
                      {coin.name}
                    </h3>
                    <div className={cn(
                      "flex items-center gap-1.5 text-[10px] text-muted-foreground",
                      isRTL && "flex-row-reverse justify-end"
                    )}>
                      <span className="uppercase font-medium">{coin.symbol}</span>
                      <span>•</span>
                      <span>{formatMarketCap(coin.market_cap)}</span>
                    </div>
                  </div>

                  <div className={cn("text-right min-w-[100px]", isRTL && "text-left")}>
                    <div className="font-bold text-foreground text-sm font-mono">
                      {formatPrice(coin.current_price)}
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-xs font-medium justify-end",
                      isPositive ? "text-green-500" : "text-red-500",
                      isRTL && "flex-row-reverse justify-start"
                    )}>
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{formatPercentage(changePercent)}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredCoins.length === 0 && searchQuery && (
            <div className="text-center py-10 text-muted-foreground">
              {isRTL ? 'لا توجد عملات مطابقة' : 'No matching coins found'}
            </div>
          )}
        </div>

        <div className="text-center py-6 mt-4">
          <span className="text-[10px] text-muted-foreground/50">
            Powered by @novachartsbot • Data from CoinGecko
          </span>
        </div>
      </div>
    </div>
  );
};

export default CryptoGiftCenter;
