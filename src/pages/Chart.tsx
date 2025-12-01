// @ts-nocheck
import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, LayoutGrid, List, BarChart3, TrendingUp, TrendingDown, DollarSign, Download, RefreshCw } from 'lucide-react';
import TonIcon from '@/components/TonIcon';
import { Link } from 'react-router-dom';
import TreemapHeatmap from '@/components/TreemapHeatmap';
import GiftCard from '@/components/GiftCard';
import BottomNav from '@/components/BottomNav';
import { useMarketData } from '@/hooks/useMarketData';
import { useBlackFloorData } from '@/hooks/useBlackFloorData';
import MarketTable from '@/components/MarketTable';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/i18n/translations';

interface NFTMarketData {
  priceTon: number;
  priceUsd: number;
  tonPrice24hAgo?: number;
  usdPrice24hAgo?: number;
  tonPriceWeekAgo?: number;
  usdPriceWeekAgo?: number;
  tonPriceMonthAgo?: number;
  usdPriceMonthAgo?: number;
  'change_24h_ton_%': number;
  'change_24h_usd_%': number;
  market_cap_ton?: string;
  market_cap_usd?: string;
  fdv_ton?: string;
  fdv_usd?: string;
  price_ton: number;
  price_usd: number;
  image_url: string;
  upgradedSupply?: number;
}

interface MarketData {
  [key: string]: NFTMarketData;
}

interface BlackFloorItem {
  gift_name: string;
  short_name: string;
  black_price: number;
  recorded_at: string;
  change_24h_ton_percent?: number;
  change_1w_ton_percent?: number;
  change_1m_ton_percent?: number;
  change_3m_ton_percent?: number;
  change_1y_ton_percent?: number;
  oldest_available_date?: string;
  available_periods?: string[];
}

interface GiftHistoricalData {
  week_chart?: Array<{
    date: string;
    time: string;
    priceTon: number;
    priceUsd: number;
  }>;
}

type ViewMode = 'grid' | 'list' | 'heatmap';
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

const Chart = () => {
  const { language } = useLanguage();
  // Use React Query hooks for data fetching with caching
  const { data: marketData = {}, isLoading: marketLoading } = useMarketData();
  const { data: blackFloorData = [], isLoading: blackLoading } = useBlackFloorData();
  
  const loading = marketLoading || blackLoading;
  
  // Translation helper
  const t = (key: keyof typeof import('@/i18n/translations').translations.en) => 
    getTranslation(language, key);
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currency, setCurrency] = useState<Currency>('ton');
  const [topFilterGrid, setTopFilterGrid] = useState<TopFilter>('all'); // For grid/list - show all by default
  const [topFilterHeatmap, setTopFilterHeatmap] = useState<TopFilter>('all'); // For heatmap - show all by default
  const [dataSourceGrid, setDataSourceGrid] = useState<DataSource>('market'); // For grid/list
  const [dataSourceHeatmap, setDataSourceHeatmap] = useState<DataSource>('market'); // For heatmap - separate state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [chartType, setChartType] = useState<ChartType>('change');
  const [timeGap, setTimeGap] = useState<TimeGap>('24h');
  const [sortMode, setSortMode] = useState<'default' | 'priceUp' | 'priceDown'>('default');
  
  // Get current dataSource based on view mode
  const dataSource = viewMode === 'heatmap' ? dataSourceHeatmap : dataSourceGrid;
  const setDataSource = viewMode === 'heatmap' ? setDataSourceHeatmap : setDataSourceGrid;
  
  // Add ref for TreemapHeatmap
  const treemapRef = React.useRef<any>(null);

  // Force TON currency when switching to Black or Regular mode
  React.useEffect(() => {
    if (dataSource === 'black' || dataSource === 'regular') {
      setCurrency('ton');
    }
  }, [dataSource]);

  // Memoize filtered data to prevent recalculation on every render
  const filteredData = useMemo(() => {
    const getFilteredData = () => {
    // Determine which filter to use based on view mode
    const currentTopFilter = viewMode === 'heatmap' ? topFilterHeatmap : topFilterGrid;
    
    if (dataSource === 'black') {
      // Convert black floor data to market data format
      // IMPORTANT: Only show gifts that exist in market data (already released)
      if (!marketData || !blackFloorData || blackFloorData.length === 0) {
        return [];
      }
      
      let blackEntries: [string, NFTMarketData & { 
        short_name?: string; 
        change_24h_ton_percent?: number;
        change_1w_ton_percent?: number;
        change_1m_ton_percent?: number;
        change_3m_ton_percent?: number;
        change_1y_ton_percent?: number;
        available_periods?: string[];
        tonPriceWeekAgo?: number;
        tonPriceMonthAgo?: number;
      }][] = blackFloorData
        .filter(item => {
          const existsInMarket = marketData[item.gift_name];
          return existsInMarket;
        })
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
          change_1w_ton_percent: item.change_1w_ton_percent || 0,
          change_1m_ton_percent: item.change_1m_ton_percent || 0,
          change_3m_ton_percent: item.change_3m_ton_percent || 0,
          change_1y_ton_percent: item.change_1y_ton_percent || 0,
          available_periods: item.available_periods || [],
          // Past prices for heatmap change calculations
          tonPrice24hAgo: item.daily_past_price_ton ?? item.black_price,
          tonPriceWeekAgo: item.weekly_past_price_ton ?? item.black_price,
          tonPriceMonthAgo: item.monthly_past_price_ton ?? item.black_price,
          upgradedSupply: marketData[item.gift_name]?.upgradedSupply || 0,
        }
      ];
        });

      // Sort - zeros always at end
      if (sortMode === 'priceUp') {
        blackEntries.sort((a, b) => {
          const changeA = a[1].change_24h_ton_percent || 0;
          const changeB = b[1].change_24h_ton_percent || 0;
          
          if (changeA === 0 && changeB !== 0) return 1;
          if (changeA !== 0 && changeB === 0) return -1;
          if (changeA === 0 && changeB === 0) return 0;
          
          return changeB - changeA;
        });
      } else if (sortMode === 'priceDown') {
        blackEntries.sort((a, b) => {
          const changeA = a[1].change_24h_ton_percent || 0;
          const changeB = b[1].change_24h_ton_percent || 0;
          
          if (changeA === 0 && changeB !== 0) return 1;
          if (changeA !== 0 && changeB === 0) return -1;
          if (changeA === 0 && changeB === 0) return 0;
          
          return changeA - changeB;
        });
      } else {
        blackEntries.sort((a, b) => (b[1].priceTon || b[1].price_ton) - (a[1].priceTon || a[1].price_ton));
      }

      if (currentTopFilter === 'top50') {
        blackEntries = blackEntries.slice(0, 50);
      } else if (currentTopFilter === 'top35') {
        blackEntries = blackEntries.slice(0, 35);
      } else if (currentTopFilter === 'top25') {
        blackEntries = blackEntries.slice(0, 25);
      }

      return blackEntries;
    }

    if (!marketData) return [];
    let entries = Object.entries(marketData);
    
    // Filter based on dataSource
    if (dataSource === 'regular') {
      // Show only non-upgraded gifts
      entries = entries.filter(([name, data]) => {
        const isRegular = name.startsWith('[Regular]') || (data as any).is_unupgraded === true;
        return isRegular;
      });
    } else if (dataSource === 'market') {
      // Show all gifts (upgraded + regular) together
      // No filtering needed
    }
    // For 'black' mode, it's handled above

    // Sort based on chart type
    if (chartType === 'marketcap') {
      // Sort by market cap (descending)
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
      // Sort based on sortMode
      if (sortMode === 'priceUp') {
        // Price Up: positive (descending) ΓåÆ zero ΓåÆ negative
        entries.sort((a, b) => {
          const changeA = currency === 'ton' ? a[1]['change_24h_ton_%'] : a[1]['change_24h_usd_%'];
          const changeB = currency === 'ton' ? b[1]['change_24h_ton_%'] : b[1]['change_24h_usd_%'];
          
          // Zero changes always go to the end
          if (changeA === 0 && changeB !== 0) return 1;
          if (changeA !== 0 && changeB === 0) return -1;
          if (changeA === 0 && changeB === 0) return 0;
          
          if (changeA > 0 && changeB <= 0) return -1;
          if (changeA <= 0 && changeB > 0) return 1;
          if (changeA > 0 && changeB > 0) return changeB - changeA;
          
          if (changeA < 0 && changeB < 0) return changeA - changeB;
          
          return 0;
        });
      } else if (sortMode === 'priceDown') {
        // Price Down: negative (descending by abs value) ΓåÆ zero ΓåÆ positive
        entries.sort((a, b) => {
          const changeA = currency === 'ton' ? a[1]['change_24h_ton_%'] : a[1]['change_24h_usd_%'];
          const changeB = currency === 'ton' ? b[1]['change_24h_ton_%'] : b[1]['change_24h_usd_%'];
          
          // Zero changes always go to the end
          if (changeA === 0 && changeB !== 0) return 1;
          if (changeA !== 0 && changeB === 0) return -1;
          if (changeA === 0 && changeB === 0) return 0;
          
          if (changeA < 0 && changeB >= 0) return -1;
          if (changeA >= 0 && changeB < 0) return 1;
          if (changeA < 0 && changeB < 0) return changeA - changeB;
          
          if (changeA > 0 && changeB > 0) return changeA - changeB;
          
          return 0;
        });
      } else {
        // Default: sort by absolute change (biggest changes first), zeros at the end
        entries.sort((a, b) => {
          const changeA = currency === 'ton' ? a[1]['change_24h_ton_%'] : a[1]['change_24h_usd_%'];
          const changeB = currency === 'ton' ? b[1]['change_24h_ton_%'] : b[1]['change_24h_usd_%'];
          
          // Zero changes go to the end
          if (changeA === 0 && changeB !== 0) return 1;
          if (changeA !== 0 && changeB === 0) return -1;
          if (changeA === 0 && changeB === 0) return 0;
          
          return Math.abs(changeB) - Math.abs(changeA);
        });
      }
    }

    // Apply top filter
    if (currentTopFilter === 'top50') {
      entries = entries.slice(0, 50);
    } else if (currentTopFilter === 'top35') {
      entries = entries.slice(0, 35);
    } else if (currentTopFilter === 'top25') {
      entries = entries.slice(0, 25);
    }

    return entries;
  };
    return getFilteredData();
  }, [viewMode, topFilterHeatmap, topFilterGrid, dataSource, dataSourceGrid, dataSourceHeatmap, marketData, blackFloorData, sortMode, chartType, currency]);

  // Memoize gift items
  const giftItems = useMemo((): GiftItem[] => {
    const entries = filteredData;
    
    return entries.map(([name, data]) => {
        // Use historical prices directly from market data API
        const currentPriceTon = data.priceTon || data.price_ton;
        const currentPriceUsd = data.priceUsd || data.price_usd;
        
        // Get historical prices from API response
        const tonPrice24hAgo = data.tonPrice24hAgo || currentPriceTon;
        const usdPrice24hAgo = data.usdPrice24hAgo || currentPriceUsd;
        const tonPriceWeekAgo = data.tonPriceWeekAgo || currentPriceTon;
        const usdPriceWeekAgo = data.usdPriceWeekAgo || currentPriceUsd;
        const tonPriceMonthAgo = data.tonPriceMonthAgo || currentPriceTon;
        const usdPriceMonthAgo = data.usdPriceMonthAgo || currentPriceUsd;
        
        return {
          name,
          image: data.image_url || '',
          priceTon: currentPriceTon,
          priceUsd: currentPriceUsd,
          tonPrice24hAgo,
          usdPrice24hAgo,
          tonPriceWeekAgo,
          usdPriceWeekAgo,
          tonPriceMonthAgo,
          usdPriceMonthAgo,
          marketCapTon: data.market_cap_ton,
          marketCapUsd: data.market_cap_usd,
          upgradedSupply: data.upgradedSupply || 1000000,
          preSale: false
        };
      });
  }, [filteredData]);



  // Helper: convert gift name to API camelCase slug (e.g., "Plush Pepe" -> "plushPepe")
  const toCamelFromName = (name: string) => {
    const cleaned = name
      .replace(/[^A-Za-z0-9\s]/g, ' ') // remove punctuation like apostrophes
      .replace(/\s+/g, ' ') // collapse spaces
      .trim();
    const parts = cleaned.split(' ');
    return parts
      .map((p, i) => (i === 0 ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()))
      .join('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className={`min-h-screen pb-20 ${dataSource === 'black' ? 'bg-[#0B0B0D]' : 'bg-background'}`}>
      <BottomNav activeTab="chart" onTabChange={(tab) => {
        if (tab === 'home') {
          window.location.href = '/';
        }
      }} />
      <div className={`p-4 space-y-4 ${dataSource === 'black' ? 'font-inter' : ''}`}>
        {/* View Mode Toggle - Circular Buttons */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'glassBlue' : 'glass'}
            size="circleSm"
          >
            <List className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => setViewMode('grid')}
            variant={viewMode === 'grid' ? 'glassBlue' : 'glass'}
            size="circleSm"
          >
            <LayoutGrid className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => setViewMode('heatmap')}
            variant={viewMode === 'heatmap' ? 'glassBlue' : 'glass'}
            size="circleSm"
          >
            <BarChart3 className="w-5 h-5" />
          </Button>
        </div>

        {/* Sort Mode - Price Up/Down & Data Source (for Grid and List only) */}
        {(viewMode === 'grid' || viewMode === 'list') && (
          <div className="space-y-3">
            <div className="flex gap-3 justify-center">
              <Button
                variant={sortMode === 'priceUp' ? 'glass' : 'glassDark'}
                size="pillSm"
                onClick={() => setSortMode(sortMode === 'priceUp' ? 'default' : 'priceUp')}
                className="min-w-[100px] transition-all duration-300"
              >
                <TrendingUp className={`h-4 w-4 ${sortMode === 'priceUp' ? 'text-green-400' : 'text-green-500/50'}`} />
                <span className={sortMode === 'priceUp' ? 'text-green-400' : 'text-green-500/50'}>{t('priceUp')}</span>
              </Button>
              <Button
                variant={sortMode === 'priceDown' ? 'glass' : 'glassDark'}
                size="pillSm"
                onClick={() => setSortMode(sortMode === 'priceDown' ? 'default' : 'priceDown')}
                className="min-w-[100px] transition-all duration-300"
              >
                <TrendingDown className={`h-4 w-4 ${sortMode === 'priceDown' ? 'text-red-400' : 'text-red-500/50'}`} />
                <span className={sortMode === 'priceDown' ? 'text-red-400' : 'text-red-500/50'}>{t('priceDown')}</span>
              </Button>
            </div>
            
            {/* Data Source Toggle */}
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => setDataSourceGrid('market')}
                variant={dataSourceGrid === 'market' ? 'glass' : 'glassDark'}
                size="pill"
                className="flex-1 font-medium"
              >
                {language === 'ar' ? 'الكل' : 'All'}
              </Button>
              <Button
                onClick={() => setDataSourceGrid('black')}
                variant={dataSourceGrid === 'black' ? 'glass' : 'glassDark'}
                size="pill"
                className="flex-1 font-medium"
              >
                {language === 'ar' ? 'السوق السوداء' : 'BG: Black'}
              </Button>
              <Button
                onClick={() => setDataSourceGrid('regular')}
                variant={dataSourceGrid === 'regular' ? 'glass' : 'glassDark'}
                size="pill"
                className="flex-1 font-medium text-amber-400"
              >
                {language === 'ar' ? 'غير مطور' : 'NON-UPGRADE'}
              </Button>
            </div>
          </div>
        )}

        {viewMode === 'heatmap' && (
          <div className="space-y-3">

            {/* Chart Type & Data Source */}
            <div className="flex gap-2">
              <Button
                onClick={() => setChartType('change')}
                variant={chartType === 'change' ? 'glass' : 'glassDark'}
                size="pill"
                className="flex-1 font-medium"
              >
                {t('change')}
              </Button>
              <Button
                onClick={() => setChartType('marketcap')}
                variant={chartType === 'marketcap' ? 'glass' : 'glassDark'}
                size="pill"
                className="flex-1 font-medium"
              >
                {t('marketCap')}
              </Button>
            </div>

            {/* Time Period */}
            {chartType === 'change' && (
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => setTimeGap('24h')}
                  variant={timeGap === '24h' ? 'glassBlue' : 'glass'}
                  size="circle"
                  className="font-semibold"
                >
                  24H
                </Button>
                <Button
                  onClick={() => setTimeGap('1w')}
                  variant={timeGap === '1w' ? 'glassBlue' : 'glass'}
                  size="circle"
                  className="font-semibold"
                >
                  1w
                </Button>
                <Button
                  onClick={() => setTimeGap('1m')}
                  variant={timeGap === '1m' ? 'glassBlue' : 'glass'}
                  size="circle"
                  className="font-semibold"
                >
                  1m
                </Button>
              </div>
            )}

            {/* Top Filter (Heatmap Only) */}
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => setTopFilterHeatmap('all')}
                variant={topFilterHeatmap === 'all' ? 'glassBlue' : 'glass'}
                size="pillSm"
                className="font-semibold"
              >
                All
              </Button>
              <Button
                onClick={() => setTopFilterHeatmap('top50')}
                variant={topFilterHeatmap === 'top50' ? 'glassBlue' : 'glass'}
                size="pillSm"
                className="font-semibold"
              >
                Top 50
              </Button>
              <Button
                onClick={() => setTopFilterHeatmap('top35')}
                variant={topFilterHeatmap === 'top35' ? 'glassBlue' : 'glass'}
                size="pillSm"
                className="font-semibold"
              >
                Top 30
              </Button>
              <Button
                onClick={() => setTopFilterHeatmap('top25')}
                variant={topFilterHeatmap === 'top25' ? 'glassBlue' : 'glass'}
                size="pillSm"
                className="font-semibold"
              >
                Top 15
              </Button>
            </div>

            {/* Data Source */}
            <div className="flex gap-2">
              <Button
                onClick={() => setDataSource('market')}
                variant={dataSource === 'market' ? 'glass' : 'glassDark'}
                size="pill"
                className="flex-1 font-medium"
              >
                {language === 'ar' ? 'مطور' : 'Upgraded'}
              </Button>
              <Button
                onClick={() => setDataSource('regular')}
                variant={dataSource === 'regular' ? 'glass' : 'glassDark'}
                size="pill"
                className="flex-1 font-medium text-amber-400"
              >
                {language === 'ar' ? 'عادي' : 'Regular'}
              </Button>
              <Button
                onClick={() => setDataSource('black')}
                variant={dataSource === 'black' ? 'glass' : 'glassDark'}
                size="pill"
                className="flex-1 font-medium"
              >
                Black
              </Button>
            </div>

            {/* Currency - Only show if not Black or Regular mode */}
            {dataSource === 'market' && (
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrency('ton')}
                  variant={currency === 'ton' ? 'glass' : 'glassDark'}
                  size="pill"
                  className="flex-1 font-medium flex items-center justify-center gap-2"
                >
                  <TonIcon className="w-4 h-4" />
                  TON
                </Button>
                <Button
                  onClick={() => setCurrency('usd')}
                  variant={currency === 'usd' ? 'glass' : 'glassDark'}
                  size="pill"
                  className="flex-1 font-medium flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  USD
                </Button>
              </div>
            )}

            {/* Download Button */}
            <Button
              onClick={() => treemapRef.current?.downloadImage()}
              variant="glassBlue"
              size="lg"
              className="w-full rounded-2xl font-semibold text-base h-14 shadow-[0_8px_32px_rgba(33,150,243,0.5)]"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Heatmap
            </Button>
          </div>
        )}


        {/* Content */}
        {viewMode === 'grid' && (
          <div 
            className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-3 md:gap-4 px-2"
            style={dataSource === 'black' ? {
              backgroundImage: `
                radial-gradient(circle at 50% 0%, rgba(91,46,221,0.06) 0%, transparent 60%),
                repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(17,18,20,0.06) 40px, rgba(17,18,20,0.06) 41px),
                repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(17,18,20,0.06) 40px, rgba(17,18,20,0.06) 41px)
              `,
              gridAutoRows: '1fr'
            } : {
              gridAutoRows: '1fr'
            }}
          >
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

        {viewMode === 'heatmap' && (
          <TreemapHeatmap 
            ref={treemapRef}
            data={giftItems} 
            chartType={chartType}
            timeGap={timeGap}
            currency={currency}
            isRegularMode={dataSourceHeatmap === 'regular'}
          />
        )}
      </div>
    </div>
  );
};

export default Chart;
