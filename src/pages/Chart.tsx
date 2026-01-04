/**
 * ============================================================================
 * NOVA CHART PAGE - Premium Market Overview
 * Protocol: CODE_DIRECT_REFACTOR_IMAGE_CACHE_2026
 * ============================================================================
 */

// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { Loader2, LayoutGrid, List, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import TonIcon from '@/components/TonIcon';
import GiftCard from '@/components/GiftCard';
import { useMarketData } from '@/hooks/useMarketData';
import { useBlackFloorData } from '@/hooks/useBlackFloorData';
import MarketTable from '@/components/MarketTable';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/i18n/translations';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';
type Currency = 'ton' | 'usd';
type DataSource = 'market' | 'black' | 'regular';

const Chart = () => {
  const { language } = useLanguage();
  const { data: marketData = {}, isLoading: marketLoading } = useMarketData();
  const { data: blackFloorData = [], isLoading: blackLoading } = useBlackFloorData();
  
  const loading = marketLoading || blackLoading;
  
  const t = (key: keyof typeof import('@/i18n/translations').translations.en) => 
    getTranslation(language, key);
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currency, setCurrency] = useState<Currency>('ton');
  const [dataSource, setDataSource] = useState<DataSource>('market');
  const [sortMode, setSortMode] = useState<'default' | 'priceUp' | 'priceDown'>('default');

  // Force TON currency when switching to Black or Regular mode
  React.useEffect(() => {
    if (dataSource === 'black' || dataSource === 'regular') {
      setCurrency('ton');
    }
  }, [dataSource]);

  const filteredData = useMemo(() => {
    if (dataSource === 'black') {
      if (!marketData || !blackFloorData || blackFloorData.length === 0) {
        return [];
      }
      
      let blackEntries = blackFloorData
        .filter(item => marketData[item.gift_name])
        .map(item => {
          const marketImage = marketData[item.gift_name]?.image_url;
          const imageUrl = marketImage || `https://www.channelsseller.site/api/image/${item.short_name}`;
          
          return [
            item.gift_name,
            {
              priceTon: item.black_price,
              priceUsd: item.black_price * 2.16,
              price_ton: item.black_price,
              price_usd: item.black_price * 2.16,
              'change_24h_ton_%': item.change_24h_ton_percent || 0,
              'change_24h_usd_%': item.change_24h_ton_percent || 0,
              image_url: imageUrl,
              short_name: item.short_name,
              change_24h_ton_percent: item.change_24h_ton_percent || 0,
            }
          ];
        });

      // Sort
      if (sortMode === 'priceUp') {
        blackEntries.sort((a, b) => {
          const changeA = a[1].change_24h_ton_percent || 0;
          const changeB = b[1].change_24h_ton_percent || 0;
          if (changeA === 0 && changeB !== 0) return 1;
          if (changeA !== 0 && changeB === 0) return -1;
          return changeB - changeA;
        });
      } else if (sortMode === 'priceDown') {
        blackEntries.sort((a, b) => {
          const changeA = a[1].change_24h_ton_percent || 0;
          const changeB = b[1].change_24h_ton_percent || 0;
          if (changeA === 0 && changeB !== 0) return 1;
          if (changeA !== 0 && changeB === 0) return -1;
          return changeA - changeB;
        });
      } else {
        blackEntries.sort((a, b) => (b[1].priceTon || b[1].price_ton) - (a[1].priceTon || a[1].price_ton));
      }

      return blackEntries;
    }

    if (!marketData) return [];
    let entries = Object.entries(marketData);
    
    if (dataSource === 'regular') {
      entries = entries.filter(([name, data]) => {
        return name.startsWith('[Regular]') || (data as any).is_unupgraded === true;
      });
    }

    // Sort
    if (sortMode === 'priceUp') {
      entries.sort((a, b) => {
        const changeA = currency === 'ton' ? a[1]['change_24h_ton_%'] : a[1]['change_24h_usd_%'];
        const changeB = currency === 'ton' ? b[1]['change_24h_ton_%'] : b[1]['change_24h_usd_%'];
        if (changeA === 0 && changeB !== 0) return 1;
        if (changeA !== 0 && changeB === 0) return -1;
        if (changeA > 0 && changeB <= 0) return -1;
        if (changeA <= 0 && changeB > 0) return 1;
        return changeB - changeA;
      });
    } else if (sortMode === 'priceDown') {
      entries.sort((a, b) => {
        const changeA = currency === 'ton' ? a[1]['change_24h_ton_%'] : a[1]['change_24h_usd_%'];
        const changeB = currency === 'ton' ? b[1]['change_24h_ton_%'] : b[1]['change_24h_usd_%'];
        if (changeA === 0 && changeB !== 0) return 1;
        if (changeA !== 0 && changeB === 0) return -1;
        if (changeA < 0 && changeB >= 0) return -1;
        if (changeA >= 0 && changeB < 0) return 1;
        return changeA - changeB;
      });
    } else {
      entries.sort((a, b) => {
        const changeA = currency === 'ton' ? a[1]['change_24h_ton_%'] : a[1]['change_24h_usd_%'];
        const changeB = currency === 'ton' ? b[1]['change_24h_ton_%'] : b[1]['change_24h_usd_%'];
        if (changeA === 0 && changeB !== 0) return 1;
        if (changeA !== 0 && changeB === 0) return -1;
        return Math.abs(changeB) - Math.abs(changeA);
      });
    }

    return entries;
  }, [dataSource, marketData, blackFloorData, sortMode, currency]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground font-medium">Loading market data...</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen pb-24 transition-colors duration-300",
      dataSource === 'black' ? 'bg-[hsl(var(--black-bg))]' : 'bg-background'
    )}>
      {/* Header Controls */}
      <div className={cn(
        "sticky top-0 z-40 backdrop-blur-xl border-b",
        dataSource === 'black' 
          ? 'bg-[hsl(var(--black-bg))]/90 border-white/5' 
          : 'bg-background/80 border-border/30'
      )}>
        <div className="p-4 space-y-3">
          {/* View Mode & Sort */}
          <div className="flex items-center justify-between gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-secondary/50 rounded-xl p-1 border border-border/30">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2.5 rounded-lg transition-all duration-200",
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2.5 rounded-lg transition-all duration-200",
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setSortMode(sortMode === 'priceUp' ? 'default' : 'priceUp')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                  sortMode === 'priceUp'
                    ? 'bg-success/20 text-success border border-success/30 shadow-lg shadow-success/10'
                    : 'bg-secondary/50 text-muted-foreground hover:text-success border border-border/30'
                )}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                {t('priceUp')}
              </button>
              <button
                onClick={() => setSortMode(sortMode === 'priceDown' ? 'default' : 'priceDown')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                  sortMode === 'priceDown'
                    ? 'bg-destructive/20 text-destructive border border-destructive/30 shadow-lg shadow-destructive/10'
                    : 'bg-secondary/50 text-muted-foreground hover:text-destructive border border-border/30'
                )}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                {t('priceDown')}
              </button>
            </div>
          </div>

          {/* Data Source */}
          <div className="flex gap-2">
            <button
              onClick={() => setDataSource('market')}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                dataSource === 'market'
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-secondary/50 text-muted-foreground hover:text-foreground border border-border/30'
              )}
            >
              {language === 'ar' ? 'الكل' : 'All Gifts'}
            </button>
            <button
              onClick={() => setDataSource('black')}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                dataSource === 'black'
                  ? 'bg-gradient-to-r from-zinc-800 to-zinc-900 text-white border border-white/10 shadow-lg'
                  : 'bg-secondary/50 text-muted-foreground hover:text-foreground border border-border/30'
              )}
            >
              {language === 'ar' ? 'خلفية سوداء' : 'BG: Black'}
            </button>
            <button
              onClick={() => setDataSource('regular')}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                dataSource === 'regular'
                  ? 'bg-gradient-to-r from-warning to-warning/80 text-white shadow-lg shadow-warning/20'
                  : 'bg-secondary/50 text-warning/60 hover:text-warning border border-border/30'
              )}
            >
              {language === 'ar' ? 'غير مطور' : 'Regular'}
            </button>
          </div>

          {/* Currency Toggle - Only for market mode */}
          {dataSource === 'market' && (
            <div className="flex gap-2">
              <button
                onClick={() => setCurrency('ton')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2",
                  currency === 'ton'
                    ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-secondary/50 text-muted-foreground hover:text-foreground border border-border/30'
                )}
              >
                <TonIcon className="w-4 h-4" />
                TON
              </button>
              <button
                onClick={() => setCurrency('usd')}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  currency === 'usd'
                    ? 'bg-gradient-to-r from-success to-success/80 text-white shadow-lg shadow-success/20'
                    : 'bg-secondary/50 text-muted-foreground hover:text-foreground border border-border/30'
                )}
              >
                $ USD
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {viewMode === 'grid' && (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3">
            {filteredData.map(([name, data]) => {
              const change = currency === 'ton' ? data['change_24h_ton_%'] : data['change_24h_usd_%'];
              const price = currency === 'ton' ? (data.priceTon || data.price_ton) : (data.priceUsd || data.price_usd);
              const isUnupgraded = name.startsWith('[Regular]') || (data as any).is_unupgraded === true;

              return (
                <GiftCard
                  key={name}
                  name={name}
                  imageUrl={data.image_url}
                  shortName={(data as any).short_name}
                  price={price}
                  change={change}
                  isBlackMode={dataSource === 'black'}
                  isUnupgraded={isUnupgraded}
                  giftId={(data as any).id}
                />
              );
            })}
          </div>
        )}

        {viewMode === 'list' && (
          <MarketTable 
            data={filteredData} 
            isBlackMode={dataSource === 'black'} 
          />
        )}
      </div>
    </div>
  );
};

export default Chart;
