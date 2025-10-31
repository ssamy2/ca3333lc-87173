// @ts-nocheck
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, LayoutGrid, List, BarChart3 } from 'lucide-react';
import TonIcon from '@/components/TonIcon';
import { Link } from 'react-router-dom';
import TreemapHeatmap from '@/components/TreemapHeatmap';
import GiftImage from '@/components/GiftImage';
import BottomNav from '@/components/BottomNav';
import { useMarketData } from '@/hooks/useMarketData';
import { useBlackFloorData } from '@/hooks/useBlackFloorData';
import MarketTable from '@/components/MarketTable';

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
type DataSource = 'market' | 'black';
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
  // Use React Query hooks for data fetching with caching
  const { data: marketData = {}, isLoading: marketLoading } = useMarketData();
  const { data: blackFloorData = [], isLoading: blackLoading } = useBlackFloorData();
  
  const loading = marketLoading || blackLoading;
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currency, setCurrency] = useState<Currency>('ton');
  const [topFilter, setTopFilter] = useState<TopFilter>('all');
  const [dataSource, setDataSource] = useState<DataSource>('market');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [chartType, setChartType] = useState<ChartType>('change');
  const [timeGap, setTimeGap] = useState<TimeGap>('24h');


  const getFilteredData = () => {
    if (dataSource === 'black') {
      // Convert black floor data to market data format
      // IMPORTANT: Only show gifts that exist in market data (already released)
      let blackEntries: [string, NFTMarketData & { short_name?: string; change_24h_ton_percent?: number }][] = blackFloorData
        .filter(item => {
          // Only include if gift exists in market data
          const existsInMarket = marketData[item.gift_name];
          if (!existsInMarket) {
            console.log(`[Chart] Black gift "${item.gift_name}" not in market data - skipping`);
          }
          return existsInMarket;
        })
        .map(item => {
          const marketImage = marketData[item.gift_name]?.image_url;
          
          // Use market image if available, otherwise use short_name endpoint
          const imageUrl = marketImage || `https://channelsseller.site/api/image/${item.short_name}`;
          
          console.log(`[Chart] Black gift "${item.gift_name}" - Using ${marketImage ? 'market image' : 'short_name'} (${item.short_name})`);
          
          return [
            item.gift_name,
            {
              priceTon: item.black_price,
              priceUsd: item.black_price * 2.16,
              price_ton: item.black_price,
              price_usd: item.black_price * 2.16,
              'change_24h_ton_%': (item as any).change_24h_ton_percent || 0,
              'change_24h_usd_%': (item as any).change_24h_ton_percent || 0,
              image_url: imageUrl,
              short_name: item.short_name,
              change_24h_ton_percent: (item as any).change_24h_ton_percent || 0,
            }
          ];
        });

      // Sort by price (highest first)
      blackEntries.sort((a, b) => (b[1].priceTon || b[1].price_ton) - (a[1].priceTon || a[1].price_ton));

      // Apply top filter
      if (topFilter === 'top50') {
        blackEntries = blackEntries.slice(0, 50);
      } else if (topFilter === 'top35') {
        blackEntries = blackEntries.slice(0, 35);
      } else if (topFilter === 'top25') {
        blackEntries = blackEntries.slice(0, 25);
      }

      return blackEntries;
    }

    // Market data
    let entries = Object.entries(marketData);

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
      // Sort by absolute change (biggest changes first regardless of sign)
      entries.sort((a, b) => {
        const changeA = currency === 'ton' ? a[1]['change_24h_ton_%'] : a[1]['change_24h_usd_%'];
        const changeB = currency === 'ton' ? b[1]['change_24h_ton_%'] : b[1]['change_24h_usd_%'];
        return Math.abs(changeB) - Math.abs(changeA);
      });
    }

    // Apply top filter
    if (topFilter === 'top50') {
      entries = entries.slice(0, 50);
    } else if (topFilter === 'top35') {
      entries = entries.slice(0, 35);
    } else if (topFilter === 'top25') {
      entries = entries.slice(0, 25);
    }

    return entries;
  };

  const getGiftItems = (): GiftItem[] => {
    const entries = getFilteredData();
    
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
  };



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

  const filteredData = getFilteredData();

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
      <div className={`p-2 space-y-2 ${dataSource === 'black' ? 'font-inter' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className={`text-xl font-bold ${dataSource === 'black' ? 'text-[#C9A14B] text-[48px]' : 'text-foreground'}`}>
            {dataSource === 'black' ? 'BLACK GIFTS' : 'Market Charts'}
          </h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className={`text-xs ${dataSource === 'black' ? 'text-white/60' : 'text-muted-foreground'}`}>Live</span>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 justify-center">
          <Button
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            className="rounded-full h-9 w-9"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setViewMode('grid')}
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            className="rounded-full h-9 w-9"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setViewMode('heatmap')}
            variant={viewMode === 'heatmap' ? 'default' : 'outline'}
            size="icon"
            className="rounded-full h-9 w-9"
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          {/* Data Source Filter */}
          <div className="flex gap-2">
            <Button
              onClick={() => setDataSource('market')}
              variant={dataSource === 'market' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 h-8 text-xs"
            >
              All
            </Button>
            <Button
              onClick={() => setDataSource('black')}
              variant={dataSource === 'black' ? 'default' : 'outline'}
              size="sm"
              className={`flex-1 h-8 text-xs ${dataSource === 'black' ? 'bg-[#0B0B0D] text-white hover:bg-[#0B0B0D]/90' : 'bg-black text-white hover:bg-black/80'}`}
            >
              Black
            </Button>
          </div>

          {viewMode === 'heatmap' && (
            <>
              {/* Chart Type */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setChartType('change')}
                  variant={chartType === 'change' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-10 text-sm rounded-xl"
                >
                  Change
                </Button>
                <Button
                  onClick={() => setChartType('marketcap')}
                  variant={chartType === 'marketcap' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-10 text-sm rounded-xl"
                >
                  Market Cap
                </Button>
              </div>

              {/* Currency */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrency('ton')}
                  variant={currency === 'ton' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-10 text-sm rounded-xl"
                >
                  TON
                </Button>
                <Button
                  onClick={() => setCurrency('usd')}
                  variant={currency === 'usd' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-10 text-sm rounded-xl"
                >
                  USD
                </Button>
              </div>

              {chartType === 'change' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setTimeGap('1m')}
                    variant={timeGap === '1m' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 h-10 text-sm rounded-xl"
                  >
                    1m
                  </Button>
                  <Button
                    onClick={() => setTimeGap('1w')}
                    variant={timeGap === '1w' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 h-10 text-sm rounded-xl"
                  >
                    1w
                  </Button>
                  <Button
                    onClick={() => setTimeGap('24h')}
                    variant={timeGap === '24h' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 h-10 text-sm rounded-xl"
                  >
                    24h
                  </Button>
                </div>
              )}

              {/* Top Filter */}
              <div className="grid grid-cols-4 gap-2">
                <Button
                  onClick={() => setTopFilter('all')}
                  variant={topFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="h-10 text-sm rounded-xl"
                >
                  All
                </Button>
                <Button
                  onClick={() => setTopFilter('top50')}
                  variant={topFilter === 'top50' ? 'default' : 'outline'}
                  size="sm"
                  className="h-10 text-sm rounded-xl"
                >
                  Top 50
                </Button>
                <Button
                  onClick={() => setTopFilter('top35')}
                  variant={topFilter === 'top35' ? 'default' : 'outline'}
                  size="sm"
                  className="h-10 text-sm rounded-xl"
                >
                  Top 35
                </Button>
                <Button
                  onClick={() => setTopFilter('top25')}
                  variant={topFilter === 'top25' ? 'default' : 'outline'}
                  size="sm"
                  className="h-10 text-sm rounded-xl"
                >
                  Top 25
                </Button>
              </div>
            </>
          )}
        </div>


        {/* Content */}
        {viewMode === 'grid' && (
          <div 
            className="grid grid-cols-4 gap-3 mx-2"
            style={dataSource === 'black' ? {
              backgroundImage: `
                radial-gradient(circle at 50% 0%, rgba(91,46,221,0.06) 0%, transparent 60%),
                repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(17,18,20,0.06) 40px, rgba(17,18,20,0.06) 41px),
                repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(17,18,20,0.06) 40px, rgba(17,18,20,0.06) 41px)
              `
            } : undefined}
          >
            {filteredData.map(([name, data]) => {
              const change = currency === 'ton' ? data['change_24h_ton_%'] : data['change_24h_usd_%'];
              const price = currency === 'ton' ? (data.priceTon || data.price_ton) : (data.priceUsd || data.price_usd);
              const isPositive = change >= 0;
              const isNeutral = change === 0;

              const getCardStyle = () => {
                if (dataSource === 'black') {
                  return 'bg-[#0B0B0D] border border-white/[0.02] shadow-[0_6px_18px_rgba(91,46,221,0.12),0_4px_12px_rgba(0,0,0,0.45),inset_0_2px_6px_rgba(91,46,221,0.04)]';
                }
                if (isNeutral) {
                  return 'bg-secondary/80 hover:shadow-lg hover:shadow-muted/20';
                }
                if (isPositive) {
                  return 'bg-[hsl(var(--success))]/20 hover:shadow-lg hover:shadow-[hsl(var(--success))]/30 border-[hsl(var(--success))]/30';
                }
                return 'bg-[hsl(var(--destructive))]/20 hover:shadow-lg hover:shadow-[hsl(var(--destructive))]/30 border-[hsl(var(--destructive))]/30';
              };

              return (
                <Link 
                  key={name}
                  to={`/gift/${encodeURIComponent(name)}`}
                  className="no-underline"
                >
                  <Card
                    className={`p-1.5 md:p-4 flex flex-col items-center justify-between aspect-square backdrop-blur transition-all duration-300 hover:scale-105 cursor-pointer ${getCardStyle()}`}
                  >
                    <div className="w-full flex-1 flex items-center justify-center min-h-0">
                      <GiftImage
                        imageUrl={data.image_url}
                        name={name}
                        shortName={(data as any).short_name}
                        size="sm"
                        isBlackMode={dataSource === 'black'}
                        style={dataSource === 'black' ? { filter: 'saturate(0.8)' } : undefined}
                      />
                    </div>
                    <div className="w-full flex flex-col items-center gap-0.5 md:gap-2">
                      <div className="flex items-center gap-0.5 md:gap-1.5 justify-center">
                        <TonIcon className={`w-2.5 h-2.5 md:w-4 md:h-4 ${dataSource === 'black' ? 'opacity-90' : ''}`} />
                        <span 
                          className={`font-semibold text-[11px] md:text-lg ${dataSource === 'black' ? 'text-[#B87333] md:text-xl font-[600]' : 'text-foreground'}`}
                        >
                          {price.toFixed(2)}
                        </span>
                      </div>
                      {!isNeutral && (
                        <span
                          className={`text-[9px] md:text-sm font-medium ${
                            isPositive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {change.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
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
            data={getGiftItems()} 
            chartType={chartType}
            timeGap={timeGap}
            currency={currency}
          />
        )}
      </div>
    </div>
  );
};

export default Chart;
