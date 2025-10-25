// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, LayoutGrid, List, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import TonIcon from '@/components/TonIcon';
import { getCachedData, setCachedData } from '@/services/marketCache';
import { Link } from 'react-router-dom';
import TreemapHeatmap from '@/components/TreemapHeatmap';
import GiftImage from '@/components/GiftImage';
import BottomNav from '@/components/BottomNav';

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
type ChartType = 'change';
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
  const [marketData, setMarketData] = useState<MarketData>({});
  const [blackFloorData, setBlackFloorData] = useState<BlackFloorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currency, setCurrency] = useState<Currency>('ton');
  const [topFilter, setTopFilter] = useState<TopFilter>('all');
  const [dataSource, setDataSource] = useState<DataSource>('market');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [chartType, setChartType] = useState<ChartType>('change');
  const [timeGap, setTimeGap] = useState<TimeGap>('24h');
  const updateIntervalRef = useRef<number | null>(null);

  // Initial data load - runs once on mount
  useEffect(() => {
    fetchMarketData(true);
    fetchBlackFloorData(true);
  }, []);

  // Auto-refresh - runs independently
  useEffect(() => {
    updateIntervalRef.current = window.setInterval(() => {
      fetchMarketData(false);
      fetchBlackFloorData(false);
    }, 30000);

    return () => {
      if (updateIntervalRef.current) {
        window.clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  const fetchMarketData = async (isInitialLoad: boolean) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }

      // Check cache first
      const cached = getCachedData('market-data');
      if (cached && isInitialLoad) {
        setMarketData(cached);
        setLoading(false);
        return;
      }

      const response = await fetch('https://channelsseller.site/api/market-data');
      const data = await response.json();
      
      setMarketData(data);
      setCachedData('market-data', data);
    } catch (error) {
      console.error('Error fetching market data:', error);
      if (isInitialLoad) {
        toast.error('Failed to fetch market data');
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const fetchBlackFloorData = async (isInitialLoad: boolean) => {
    try {
      const cached = getCachedData('black-floor-data');
      if (cached && isInitialLoad) {
        setBlackFloorData(cached);
        return;
      }

      const response = await fetch('https://channelsseller.site/api/black-floor');
      const data: BlackFloorItem[] = await response.json();
      
      // Filter to get only the latest record for each gift (by recorded_at)
      const latestRecords = new Map<string, BlackFloorItem>();
      
      data.forEach(item => {
        const existing = latestRecords.get(item.gift_name);
        if (!existing || new Date(item.recorded_at) > new Date(existing.recorded_at)) {
          latestRecords.set(item.gift_name, item);
        }
      });
      
      const filteredData = Array.from(latestRecords.values());
      
      // Calculate daily change for each gift
      const dataWithChange = filteredData.map(item => {
        // Find price from 24 hours ago
        const dayAgo = new Date(new Date(item.recorded_at).getTime() - 24 * 60 * 60 * 1000);
        const oldRecords = data.filter(d => 
          d.gift_name === item.gift_name && 
          new Date(d.recorded_at) <= dayAgo
        );
        
        let change_24h = 0;
        if (oldRecords.length > 0) {
          // Get the closest record to 24h ago
          const oldestRecord = oldRecords.sort((a, b) => 
            Math.abs(new Date(a.recorded_at).getTime() - dayAgo.getTime()) - 
            Math.abs(new Date(b.recorded_at).getTime() - dayAgo.getTime())
          )[0];
          
          const oldPrice = oldestRecord.black_price;
          const currentPrice = item.black_price;
          
          if (oldPrice > 0) {
            change_24h = ((currentPrice - oldPrice) / oldPrice) * 100;
          }
        }
        
        return {
          ...item,
          change_24h_ton_percent: change_24h
        };
      });
      
      setBlackFloorData(dataWithChange);
      setCachedData('black-floor-data', dataWithChange);
    } catch (error) {
      console.error('Error fetching black floor data:', error);
      if (isInitialLoad) {
        toast.error('Failed to fetch black floor data');
      }
    }
  };


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

    // Sort by absolute change (biggest changes first regardless of sign)
    entries.sort((a, b) => {
      const changeA = currency === 'ton' ? a[1]['change_24h_ton_%'] : a[1]['change_24h_usd_%'];
      const changeB = currency === 'ton' ? b[1]['change_24h_ton_%'] : b[1]['change_24h_usd_%'];
      return Math.abs(changeB) - Math.abs(changeA);
    });

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

              {/* Time Gap */}
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
            className="grid grid-cols-4 gap-[24px] mx-[28px]"
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
                    className={`p-3 flex flex-col items-center gap-2 backdrop-blur transition-all duration-300 hover:scale-105 cursor-pointer ${getCardStyle()}`}
                  >
                    <GiftImage
                      imageUrl={data.image_url}
                      name={name}
                      shortName={(data as any).short_name}
                      size="md"
                      isBlackMode={dataSource === 'black'}
                      style={dataSource === 'black' ? { filter: 'saturate(0.8)' } : undefined}
                    />
                    <div className="flex items-center gap-1 justify-center">
                      <TonIcon className={`w-3 h-3 ${dataSource === 'black' ? 'opacity-90' : ''}`} />
                      <span 
                        className={`font-semibold text-sm ${dataSource === 'black' ? 'text-[#B87333] text-[22px] font-[600]' : 'text-foreground'}`}
                      >
                        {price.toFixed(2)}
                      </span>
                    </div>
                    {!isNeutral && (
                      <span
                        className={`text-xs font-medium ${
                          isPositive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {change.toFixed(2)}%
                      </span>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-2">
            {filteredData.map(([name, data]) => {
              const change = currency === 'ton' ? data['change_24h_ton_%'] : data['change_24h_usd_%'];
              const price = currency === 'ton' ? (data.priceTon || data.price_ton) : (data.priceUsd || data.price_usd);
              const isPositive = change >= 0;
              const isNeutral = change === 0;

              return (
                <Link 
                  key={name}
                  to={`/gift/${encodeURIComponent(name)}`}
                  className="no-underline"
                >
                  <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      {/* Left: Image */}
                      <div className="flex-shrink-0">
                        <GiftImage
                          imageUrl={data.image_url}
                          name={name}
                          shortName={(data as any).short_name}
                          size="md"
                          className="rounded-full"
                          isBlackMode={dataSource === 'black'}
                        />
                      </div>

                      {/* Middle: Name */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-base truncate">
                          {name}
                        </h3>
                      </div>

                      {/* Right: Price and Change */}
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <TonIcon className="w-4 h-4" />
                          <span className="font-bold text-foreground text-lg">
                            {price.toFixed(2)}
                          </span>
                        </div>
                        {!isNeutral && (
                          <span
                            className={`text-sm font-medium ${
                              isPositive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {change.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
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
