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

type Currency = 'ton' | 'usd';
type TopFilter = 'all' | 'top50' | 'top35' | 'top25';
type DataSource = 'market' | 'black' | 'regular';
type ChartType = 'change' | 'marketcap';
type TimeGap = '24h' | '1w' | '1m';

interface GiftItem {
  name: string;
  image: string;
  priceTon: number;
  priceUsd: number;
  tonPrice24hAgo?: number;
  usdPrice24hAgo?: number;
  tonPriceWeekAgo?: number;
  usdPriceWeekAgo?: number;
  tonPriceMonthAgo?: number;
  usdPriceMonthAgo?: number;
  marketCapTon?: string;
  marketCapUsd?: string;
  upgradedSupply: number;
  preSale?: boolean;
}

const HeatmapPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: marketData = {}, isLoading: marketLoading } = useMarketData();
  const { data: blackFloorData = [], isLoading: blackLoading } = useBlackFloorData();
  
  const loading = marketLoading || blackLoading;
  
  const [currency, setCurrency] = useState<Currency>('ton');
  const [topFilter, setTopFilter] = useState<TopFilter>('all');
  const [dataSource, setDataSource] = useState<DataSource>('market');
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
              tonPrice24hAgo: item.daily_past_price_ton ?? item.black_price,
              tonPriceWeekAgo: item.weekly_past_price_ton ?? item.black_price,
              tonPriceMonthAgo: item.monthly_past_price_ton ?? item.black_price,
              upgradedSupply: marketData[item.gift_name]?.upgradedSupply || 0,
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
    
    if (dataSource === 'regular') {
      entries = entries.filter(([name, data]) => {
        return name.startsWith('[Regular]') || (data as any).is_unupgraded === true;
      });
    }

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

  const giftItems = useMemo((): GiftItem[] => {
    return filteredData.map(([name, data]) => {
      const currentPriceTon = data.priceTon || data.price_ton;
      const currentPriceUsd = data.priceUsd || data.price_usd;
      
      return {
        name,
        image: data.image_url || '',
        priceTon: currentPriceTon,
        priceUsd: currentPriceUsd,
        tonPrice24hAgo: data.tonPrice24hAgo || currentPriceTon,
        usdPrice24hAgo: data.usdPrice24hAgo || currentPriceUsd,
        tonPriceWeekAgo: data.tonPriceWeekAgo || currentPriceTon,
        usdPriceWeekAgo: data.usdPriceWeekAgo || currentPriceUsd,
        tonPriceMonthAgo: data.tonPriceMonthAgo || currentPriceTon,
        usdPriceMonthAgo: data.usdPriceMonthAgo || currentPriceUsd,
        marketCapTon: data.market_cap_ton,
        marketCapUsd: data.market_cap_usd,
        upgradedSupply: data.upgradedSupply || 1000000,
        preSale: false
      };
    });
  }, [filteredData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">{text.back}</span>
          </button>
          <h1 className="text-lg font-bold text-white">{text.heatmap}</h1>
          <Button
            onClick={() => treemapRef.current?.downloadImage()}
            size="sm"
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Chart Type */}
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('change')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              chartType === 'change'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            {text.change}
          </button>
          <button
            onClick={() => setChartType('marketcap')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              chartType === 'marketcap'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            {text.marketCap}
          </button>
        </div>

        {/* Time Period */}
        {chartType === 'change' && (
          <div className="flex gap-2 justify-center">
            {(['24h', '1w', '1m'] as TimeGap[]).map((time) => (
              <button
                key={time}
                onClick={() => setTimeGap(time)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  timeGap === time
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {time.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Top Filter */}
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                topFilter === filter.value
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Data Source */}
        <div className="flex gap-2">
          <button
            onClick={() => setDataSource('market')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              dataSource === 'market'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            {text.upgraded}
          </button>
          <button
            onClick={() => setDataSource('regular')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              dataSource === 'regular'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-800/50 text-amber-400/60 hover:text-amber-400 border border-white/10'
            }`}
          >
            {text.regular}
          </button>
          <button
            onClick={() => setDataSource('black')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              dataSource === 'black'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            Black
          </button>
        </div>

        {/* Currency */}
        {dataSource === 'market' && (
          <div className="flex gap-2">
            <button
              onClick={() => setCurrency('ton')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                currency === 'ton'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              <TonIcon className="w-4 h-4" />
              TON
            </button>
            <button
              onClick={() => setCurrency('usd')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                currency === 'usd'
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              $ USD
            </button>
          </div>
        )}

        {/* Heatmap */}
        <div className="rounded-2xl overflow-hidden">
          <TreemapHeatmap 
            ref={treemapRef}
            data={giftItems} 
            chartType={chartType}
            timeGap={timeGap}
            currency={currency}
            isRegularMode={dataSource === 'regular'}
          />
        </div>
      </div>
    </div>
  );
};

export default HeatmapPage;
