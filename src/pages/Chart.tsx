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
        .filter(item => marketData[item.name || item.gift_name])
        .map(item => {
          const giftName = item.name || item.gift_name;
          const marketImage = marketData[giftName]?.image_url;
          const imageUrl = marketImage || item.image || `https://www.channelsseller.site/api/image/${item.short_name}`;

          return {
            id: item.short_name || item.id,
            name: giftName,
            short_name: item.short_name,
            image: imageUrl,
            image_url: imageUrl,
            price_ton: item.price_ton,
            price_usd: item.price_usd,
            priceTon: item.price_ton,
            priceUsd: item.price_usd,
            change_24h: item.change_24h || item.change_24h_ton_percent || 0,
            change_7d: item.change_7d || item.weekly_change_percent_ton || 0,
            change_30d: item.change_30d || item.monthly_change_percent_ton || 0,
            'change_24h_ton_%': item.change_24h || item.change_24h_ton_percent || 0,
            'change_7d_ton_%': item.change_7d || item.weekly_change_percent_ton || 0,
            'change_30d_ton_%': item.change_30d || item.monthly_change_percent_ton || 0,
            change_24h_ton_percent: item.change_24h || item.change_24h_ton_percent || 0,
            tonPrice24hAgo: item.tonPrice24hAgo || item.daily_past_price_ton || item.price_ton,
            tonPriceWeekAgo: item.tonPriceWeekAgo || item.weekly_past_price_ton || item.price_ton,
            tonPriceMonthAgo: item.tonPriceMonthAgo || item.monthly_past_price_ton || item.price_ton,
            available_periods: ['24h', '7d', '30d'],
            is_black_market: true,
            supply: marketData[giftName]?.upgradedSupply || 0,
            upgradedSupply: marketData[giftName]?.upgradedSupply || 0
          };
        });

      // Sort
      if (sortMode === 'priceUp') {
        blackEntries.sort((a, b) => a.change_24h - b.change_24h);
      } else if (sortMode === 'priceDown') {
        blackEntries.sort((a, b) => b.change_24h - a.change_24h);
      } else {
        blackEntries.sort((a, b) => b.price_ton - a.price_ton);
      }

      return blackEntries;
    }

    if (!marketData) return [];
    let entries = Object.entries(marketData).map(([name, data]: [string, any]) => {
      const count = data.quantity || data.count || 1;
      const priceTon = data.price_ton || 0;
      const priceUsd = data.price_usd || 0;
      const isRegular = name.startsWith('[Regular]') || data.is_unupgraded === true;

      return {
        id: data.id || name,
        name: name,
        short_name: data.short_name || '',
        image: data.image || data.image_url || '',
        price_ton: priceTon,
        price_usd: priceUsd,
        change_24h: currency === 'ton' ? (data['change_24h_ton_%'] || 0) : (data['change_24h_usd_%'] || 0),
        change_7d: currency === 'ton' ? (data['change_7d_ton_%'] || 0) : (data['change_7d_usd_%'] || 0),
        change_30d: currency === 'ton' ? (data['change_30d_ton_%'] || 0) : (data['change_30d_usd_%'] || 0),
        supply: data.supply || 0,
        is_black_market: false,
        is_unupgraded: isRegular
      };
    });

    if (dataSource === 'regular') {
      entries = entries.filter(item => item.is_unupgraded);
    }

    // Sort
    if (sortMode === 'priceUp') {
      entries.sort((a, b) => a.change_24h - b.change_24h);
    } else if (sortMode === 'priceDown') {
      entries.sort((a, b) => b.change_24h - a.change_24h);
    } else {
      entries.sort((a, b) => Math.abs(b.change_24h) - Math.abs(a.change_24h));
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
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="p-4 space-y-4">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between gap-4">
            {/* View Toggle */}
            <div className="flex gap-1 bg-secondary/30 p-1 rounded-lg">
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

            {/* Favorites Button - Mobile Only */}
            <button
              onClick={() => window.location.href = '/favorites'}
              className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl shadow-lg shadow-pink-500/20 hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-200"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">{language === 'ar' ? 'المفضلة' : 'Favorites'}</span>
            </button>

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
            {filteredData.map((item) => {
              return (
                <GiftCard
                  key={item.name}
                  name={item.name}
                  imageUrl={item.image}
                  shortName={item.short_name}
                  price={currency === 'ton' ? item.price_ton : item.price_usd}
                  change={item.change_24h}
                  isBlackMode={item.is_black_market}
                  isUnupgraded={item.is_unupgraded}
                  giftId={item.id}
                  currency={currency}
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
