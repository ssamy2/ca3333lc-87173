// @ts-nocheck
import React, { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ArrowLeft } from 'lucide-react';
import TonIcon from '@/components/TonIcon';
import { useNavigate } from 'react-router-dom';
import TreemapHeatmap from '@/components/TreemapHeatmap';
import { useMarketData } from '@/hooks/useMarketData';
import { useBlackFloorData } from '@/hooks/useBlackFloorData';
import { useLanguage } from '@/contexts/LanguageContext';
import { MarketItem } from '@/types/MarketData';

type Currency = 'ton' | 'usd';
type TopFilter = 'all' | 'top50' | 'top35' | 'top25';
type DataSource = 'all' | 'upgraded' | 'regular' | 'black';
type ChartType = 'change' | 'marketcap';
type TimeGap = '24h' | '1w' | '1m';

const HeatmapPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: marketData = {}, isLoading: marketLoading } = useMarketData();
  const { data: blackFloorData = [], isLoading: blackLoading } = useBlackFloorData();

  const loading = marketLoading || blackLoading;

  const [currency, setCurrency] = useState<Currency>('ton');
  const [topFilter, setTopFilter] = useState<TopFilter>('top25');
  const [dataSource, setDataSource] = useState<DataSource>('upgraded');
  const [chartType, setChartType] = useState<ChartType>('change');
  const [timeGap, setTimeGap] = useState<TimeGap>('24h');

  const treemapRef = useRef<any>(null);

  const t = {
    ar: {
      heatmap: 'خريطة الحرارة',
      back: 'رجوع',
      download: 'تحميل',
      change: 'التغير',
      marketCap: 'القيمة السوقية',
      upgraded: 'مطور',
      regular: 'عادي',
      all: 'الكل'
    },
    en: {
      heatmap: 'Heatmap',
      back: 'Back',
      download: 'Download',
      change: 'Change',
      marketCap: 'Market Cap',
      upgraded: 'Upgraded',
      regular: 'Regular',
      all: 'All'
    }
  };

  const text = t[language] || t.en;

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

          return [
            giftName,
            {
              priceTon: item.price_ton,
              priceUsd: item.price_usd,
              price_ton: item.price_ton,
              price_usd: item.price_usd,
              'change_24h_ton_%': item.change_24h || item.change_24h_ton_percent || 0,
              'change_24h_usd_%': item.change_24h_usd_percent || item.change_24h || 0,
              'change_7d_ton_%': item.change_7d || item.weekly_change_percent_ton || 0,
              'change_30d_ton_%': item.change_30d || item.monthly_change_percent_ton || 0,
              image_url: imageUrl,
              tonPrice24hAgo: item.tonPrice24hAgo || item.daily_past_price_ton || item.price_ton,
              tonPriceWeekAgo: item.tonPriceWeekAgo || item.weekly_past_price_ton || item.price_ton,
              tonPriceMonthAgo: item.tonPriceMonthAgo || item.monthly_past_price_ton || item.price_ton,
              upgradedSupply: marketData[giftName]?.upgradedSupply || 0,
            }
          ];
        });

      blackEntries.sort((a, b) => (b[1].priceTon || b[1].price_ton) - (a[1].priceTon || a[1].price_ton));

      if (topFilter === 'top50') blackEntries = blackEntries.slice(0, 50);
      else if (topFilter === 'top35') blackEntries = blackEntries.slice(0, 35);
      else if (topFilter === 'top25') blackEntries = blackEntries.slice(0, 25);

      return blackEntries;
    }

    if (!marketData) return [];
    let entries = Object.entries(marketData);

    // Filter based on data source
    if (dataSource === 'upgraded') {
      // Show only upgraded gifts (not starting with [Regular])
      entries = entries.filter(([name, data]) => {
        return !name.startsWith('[Regular]') && (data as any).is_unupgraded !== true;
      });
    } else if (dataSource === 'regular') {
      // Show only regular gifts
      entries = entries.filter(([name, data]) => {
        return name.startsWith('[Regular]') || (data as any).is_unupgraded === true;
      });
    }
    // 'all' shows everything

    if (chartType === 'marketcap') {
      entries.sort((a, b) => {
        const parseMarketCap = (str: string): number => {
          const num = parseFloat(str.replace(/[KM,]/g, ''));
          if (str.includes('M')) return num * 1000000;
          if (str.includes('K')) return num * 1000;
          return num;
        };

        const marketCapA = currency === 'ton'
          ? parseMarketCap(a[1].market_cap_ton || '0')
          : parseMarketCap(a[1].market_cap_usd || '0');
        const marketCapB = currency === 'ton'
          ? parseMarketCap(b[1].market_cap_ton || '0')
          : parseMarketCap(b[1].market_cap_usd || '0');

        return marketCapB - marketCapA;
      });
    } else {
      entries.sort((a, b) => {
        const changeA = currency === 'ton' ? a[1]['change_24h_ton_%'] : a[1]['change_24h_usd_%'];
        const changeB = currency === 'ton' ? b[1]['change_24h_ton_%'] : b[1]['change_24h_usd_%'];

        if (changeA === 0 && changeB !== 0) return 1;
        if (changeA !== 0 && changeB === 0) return -1;
        if (changeA === 0 && changeB === 0) return 0;

        return Math.abs(changeB) - Math.abs(changeA);
      });
    }

    if (topFilter === 'top50') entries = entries.slice(0, 50);
    else if (topFilter === 'top35') entries = entries.slice(0, 35);
    else if (topFilter === 'top25') entries = entries.slice(0, 25);

    return entries;
  }, [topFilter, dataSource, marketData, blackFloorData, chartType, currency]);

  const giftItems = useMemo((): MarketItem[] => {
    const items = filteredData.map(([name, data]) => {
      const currentPriceTon = data.priceTon || data.price_ton;
      const currentPriceUsd = data.priceUsd || data.price_usd;
      const isRegular = name.startsWith('[Regular]') || (data as any).is_unupgraded === true;

      return {
        id: (data as any).id || name,
        name,
        short_name: (data as any).short_name || '',
        image: data.image_url || '',
        price_ton: currentPriceTon,
        price_usd: currentPriceUsd,
        change_24h: data['change_24h_ton_%'] || 0,
        change_7d: data['change_7d_ton_%'] || 0,
        change_30d: data['change_30d_ton_%'] || 0,
        market_cap_ton: data.market_cap_ton ? parseFloat(data.market_cap_ton.replace(/[KM,]/g, '')) * (data.market_cap_ton.includes('M') ? 1000000 : data.market_cap_ton.includes('K') ? 1000 : 1) : undefined,
        market_cap_usd: data.market_cap_usd ? parseFloat(data.market_cap_usd.replace(/[KM,]/g, '')) * (data.market_cap_usd.includes('M') ? 1000000 : data.market_cap_usd.includes('K') ? 1000 : 1) : undefined,
        supply: data.upgradedSupply || 1000000,
        is_black_market: dataSource === 'black',
        is_unupgraded: isRegular
      };
    });

    console.log(`📊 [Heatmap] Total items: ${items.length}, Source: ${dataSource}`);
    return items;
  }, [filteredData, dataSource]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header - using design system styling */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">{text.back}</span>
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{text.heatmap}</h1>
          <Button
            onClick={() => treemapRef.current?.downloadImage()}
            size="sm"
            className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3 max-w-7xl mx-auto">
        {/* Chart Type - using design system buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('change')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${chartType === 'change'
              ? 'bg-primary text-primary-foreground shadow-[var(--shadow-primary)]'
              : 'bg-card text-muted-foreground hover:text-foreground border border-border/50 hover:border-primary/30'
              }`}
          >
            {text.change}
          </button>
          <button
            onClick={() => setChartType('marketcap')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${chartType === 'marketcap'
              ? 'bg-primary text-primary-foreground shadow-[var(--shadow-primary)]'
              : 'bg-card text-muted-foreground hover:text-foreground border border-border/50 hover:border-primary/30'
              }`}
          >
            {text.marketCap}
          </button>
        </div>

        {/* Time Period - using accent colors */}
        {chartType === 'change' && (
          <div className="flex gap-2 justify-center">
            {(['24h', '1w', '1m'] as TimeGap[]).map((time) => (
              <button
                key={time}
                onClick={() => setTimeGap(time)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${timeGap === time
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
                  }`}
              >
                {time.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Top Filter - using success color for active state */}
        <div className="flex gap-2 justify-center">
          {[
            { value: 'all', label: text.all },
            { value: 'top50', label: 'Top 50' },
            { value: 'top35', label: 'Top 30' },
            { value: 'top25', label: 'Top 15' }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setTopFilter(filter.value as TopFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${topFilter === filter.value
                ? 'bg-[hsl(var(--success))] text-white shadow-sm'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Data Source - using design system colors */}
        <div className="flex gap-2">
          <button
            onClick={() => setDataSource('all')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${dataSource === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
              }`}
          >
            {text.all}
          </button>
          <button
            onClick={() => setDataSource('upgraded')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${dataSource === 'upgraded'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
              }`}
          >
            {text.upgraded}
          </button>
          <button
            onClick={() => setDataSource('regular')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${dataSource === 'regular'
              ? 'bg-[hsl(var(--warning))] text-white shadow-sm'
              : 'bg-card text-[hsl(var(--warning))]/60 hover:text-[hsl(var(--warning))] border border-border/50'
              }`}
          >
            {text.regular}
          </button>
          <button
            onClick={() => setDataSource('black')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${dataSource === 'black'
              ? 'bg-secondary text-secondary-foreground shadow-sm'
              : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
              }`}
          >
            Black
          </button>
        </div>

        {/* Currency - using design system colors */}
        {(dataSource === 'all' || dataSource === 'upgraded') && (
          <div className="flex gap-2">
            <button
              onClick={() => setCurrency('ton')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${currency === 'ton'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
                }`}
            >
              <TonIcon className="w-4 h-4" />
              TON
            </button>
            <button
              onClick={() => setCurrency('usd')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${currency === 'usd'
                ? 'bg-[hsl(var(--success))] text-white shadow-sm'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
                }`}
            >
              $ USD
            </button>
          </div>
        )}

        {/* Heatmap - with consistent rounded corners */}
        <div className="rounded-2xl overflow-hidden border border-border/30 shadow-[var(--shadow-card)]">
          <TreemapHeatmap
            ref={treemapRef}
            data={giftItems}
            chartType={chartType}
            timeGap={timeGap}
            currency={currency}
            isRegularMode={dataSource === 'regular'}
            isAllMode={dataSource === 'all'}
          />
        </div>
      </div>
    </div>
  );
};

export default HeatmapPage;
