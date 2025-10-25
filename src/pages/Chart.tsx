// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Download, RotateCcw, LayoutGrid, List, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import TonIcon from '@/components/TonIcon';
import { getCachedData, setCachedData } from '@/services/marketCache';
import { imageCache } from '@/services/imageCache';
import { Link } from 'react-router-dom';
import HeatmapTreemap from '@/components/HeatmapTreemap';
import GiftImage from '@/components/GiftImage';
import BottomNav from '@/components/BottomNav';

interface NFTMarketData {
  price_ton: number;
  price_usd: number;
  'change_24h_ton_%': number;
  'change_24h_usd_%': number;
  image_url: string;
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

type ViewMode = 'grid' | 'list' | 'heatmap';
type Currency = 'ton' | 'usd';
type TopFilter = 'all' | 'top50' | 'top35' | 'top25';
type DataSource = 'market' | 'black';

const Chart = () => {
  const [marketData, setMarketData] = useState<MarketData>({});
  const [blackFloorData, setBlackFloorData] = useState<BlackFloorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currency, setCurrency] = useState<Currency>('ton');
  const [topFilter, setTopFilter] = useState<TopFilter>('all');
  const [dataSource, setDataSource] = useState<DataSource>('market');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [imageLoading, setImageLoading] = useState<Set<string>>(new Set());
  const updateIntervalRef = useRef<number | null>(null);
  const [watermarkPosition] = useState({ 
    top: Math.random() * 70 + 10, 
    left: Math.random() * 70 + 10 
  });

  // Initial data load - runs once on mount
  useEffect(() => {
    imageCache.clearExpiredCache();
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
              price_ton: item.black_price,
              price_usd: item.black_price * 2.16, // Approximate conversion
              'change_24h_ton_%': (item as any).change_24h_ton_percent || 0,
              'change_24h_usd_%': (item as any).change_24h_ton_percent || 0,
              image_url: imageUrl,
              short_name: item.short_name,
              change_24h_ton_percent: (item as any).change_24h_ton_percent || 0,
            }
          ];
        });

      // Sort by price (highest first)
      blackEntries.sort((a, b) => b[1].price_ton - a[1].price_ton);

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

  const getTreemapData = () => {
    const entries = getFilteredData();
    
    return entries
      .filter(([_, data]) => {
        const change = currency === 'ton' ? data['change_24h_ton_%'] : data['change_24h_usd_%'];
        // Filter out items with changes smaller than 1%
        return Math.abs(change) >= 1;
      })
      .map(([name, data]) => {
        const change = currency === 'ton' ? data['change_24h_ton_%'] : data['change_24h_usd_%'];
        const price = currency === 'ton' ? data.price_ton : data.price_usd;
        
        return {
          name,
          size: Math.abs(change), // Use absolute change for area
          change,
          price,
          imageUrl: data.image_url,
          color: getColorForChange(change),
        };
      });
  };

  const downloadAsImage = async () => {
    const element = document.getElementById('heatmap-container');
    if (!element) {
      toast.error('Heatmap not found');
      return;
    }

    const loadingToast = toast.loading('Preparing images...');

    try {
      // Preload any missing images using the cache service
      const treemapData = getTreemapData();
      const imageUrls = treemapData
        .map(item => item.imageUrl)
        .filter((url): url is string => !!url);
      
      // Only preload uncached images (most should already be cached)
      await imageCache.preloadUncachedImages(imageUrls);

      // Wait longer to ensure SVG is fully rendered
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.dismiss(loadingToast);
      const generatingToast = toast.loading('Generating image...');

      const canvas = await html2canvas(element, {
        backgroundColor: '#09090b',
        scale: 4,
        logging: true,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        imageTimeout: 30000,
        removeContainer: false,
        onclone: (clonedDoc) => {
          // Force all images in cloned document to use base64 from cache
          const images = clonedDoc.querySelectorAll('image');
          images.forEach((img: any) => {
            const href = img.getAttribute('href') || img.getAttribute('xlink:href');
            if (href) {
              const cachedImage = imageCache.getImageFromCache(href);
              if (cachedImage) {
                img.setAttribute('href', cachedImage);
                img.setAttribute('xlink:href', cachedImage);
              }
            }
          });
          
          // Make sure SVG is visible in cloned document
          const svgElements = clonedDoc.querySelectorAll('svg');
          svgElements.forEach((svg: any) => {
            svg.style.backgroundColor = 'transparent';
          });
        },
      });

      const base64Image = canvas.toDataURL('image/png', 1.0).split(',')[1];

      // Get Telegram user ID
      const tg = (window as any).Telegram?.WebApp;
      const userId = tg?.initDataUnsafe?.user?.id;

      if (!userId) {
        toast.dismiss(generatingToast);
        toast.error('Could not get Telegram user ID');
        return;
      }

      // Send to API
      const response = await fetch('https://channelsseller.site/api/send-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId.toString(),
          image: base64Image,
        }),
      });

      toast.dismiss(generatingToast);

      if (response.ok) {
        setShowSuccessScreen(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to send image');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
    }
  };

  const getColorForChange = (change: number) => {
    // Use bright, vivid colors for better visibility
    return change >= 0 ? '#22C55E' : '#EF4444';
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

  // Treemap is rendered via HeatmapTreemap component

  const handleImageError = (imageUrl: string) => {
    setImageErrors(prev => new Set([...prev, imageUrl]));
    setImageLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageUrl);
      return newSet;
    });
  };

  const handleImageLoad = (imageUrl: string) => {
    setImageLoading(prev => {
      const newSet = new Set(prev);
      newSet.delete(imageUrl);
      return newSet;
    });
  };

  const filteredData = getFilteredData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Success screen after sending image
  if (showSuccessScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <Card className="w-full max-w-md p-8 text-center space-y-6">
          {/* Telegram Logo */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-4xl">
              ✈️
            </div>
          </div>
          
          {/* Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Success!</h2>
            <p className="text-muted-foreground">
              Your image will arrive soon via DM
            </p>
          </div>
          
          {/* OK Button */}
          <Button
            onClick={() => setShowSuccessScreen(false)}
            className="w-full"
            size="lg"
          >
            OK
          </Button>
        </Card>
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
                  className="flex-1 h-8 text-xs"
                >
                  TON
                </Button>
                <Button
                  onClick={() => setCurrency('usd')}
                  variant={currency === 'usd' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                >
                  USD
                </Button>
              </div>

              {/* Top Filter */}
              <div className="grid grid-cols-4 gap-2">
                <Button
                  onClick={() => setTopFilter('all')}
                  variant={topFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                >
                  All
                </Button>
                <Button
                  onClick={() => setTopFilter('top50')}
                  variant={topFilter === 'top50' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                >
                  Top 50
                </Button>
                <Button
                  onClick={() => setTopFilter('top35')}
                  variant={topFilter === 'top35' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                >
                  Top 35
                </Button>
                <Button
                  onClick={() => setTopFilter('top25')}
                  variant={topFilter === 'top25' ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                >
                  Top 25
                </Button>
              </div>
            </>
          )}
        </div>

        {viewMode === 'heatmap' && (
          <div className="space-y-2">

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => setZoomLevel(1)}
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1.5" />
                Reset Zoom
              </Button>
            </div>

            {/* Download Button */}
            <Button
              onClick={downloadAsImage}
              variant="default"
              size="sm"
              className="w-full h-9"
            >
              <Download className="w-4 h-4 mr-2" />
              Get it as a photo
            </Button>
          </div>
        )}

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
              const price = currency === 'ton' ? data.price_ton : data.price_usd;
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
              const price = currency === 'ton' ? data.price_ton : data.price_usd;
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
          <div 
            id="heatmap-container" 
            className="relative bg-card"
            style={{ 
              width: '100%',
              height: window.innerWidth < 768 ? 'calc(100vh - 380px)' : 'auto',
              minHeight: window.innerWidth < 768 ? '450px' : '500px',
              aspectRatio: window.innerWidth < 768 ? '4 / 5' : '16 / 9',
            }}
          >
            {/* Watermark Overlay */}
            <div 
              className="absolute text-white/40 text-xs font-medium pointer-events-none z-10"
              style={{ 
                top: `${watermarkPosition.top}%`,
                left: `${watermarkPosition.left}%`,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)'
              }}
            >
              @Nova_calculator_bot
            </div>
            
            <HeatmapTreemap data={getTreemapData()} currency={currency} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Chart;
