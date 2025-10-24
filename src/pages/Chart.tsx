// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Download, RotateCcw, LayoutGrid, List, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import TonIcon from '@/components/TonIcon';
import { getCachedData, setCachedData } from '@/services/marketCache';
import { Link } from 'react-router-dom';
import HeatmapTreemap from '@/components/HeatmapTreemap';

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

type ViewMode = 'grid' | 'list' | 'heatmap';
type Currency = 'ton' | 'usd';
type TopFilter = 'all' | 'top50' | 'top35' | 'top25';

// Store loaded images as base64 strings to prevent reloading
const imageCache = new Map<string, string>();
let imagesPreloaded = false;

const Chart = () => {
  const [marketData, setMarketData] = useState<MarketData>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currency, setCurrency] = useState<Currency>('ton');
  const [topFilter, setTopFilter] = useState<TopFilter>('all');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [imageLoading, setImageLoading] = useState<Set<string>>(new Set());
  const updateIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    fetchMarketData(true);
    
    // Auto-update every 5 seconds
    updateIntervalRef.current = window.setInterval(() => {
      fetchMarketData(false);
    }, 5000);

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
      
      // Preload images only once (first time ever) and convert to base64
      if (!imagesPreloaded) {
        Object.values(data).forEach((nft: any) => {
          if (nft.image_url && !imageCache.has(nft.image_url)) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              // Convert to base64
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                try {
                  const base64 = canvas.toDataURL('image/png');
                  imageCache.set(nft.image_url, base64);
                } catch (e) {
                  console.error('Failed to convert image to base64:', e);
                  // Fallback to original URL
                  imageCache.set(nft.image_url, nft.image_url);
                }
              }
            };
            img.src = nft.image_url;
          }
        });
        imagesPreloaded = true;
      }
      
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

  const getFilteredData = () => {
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
      // Wait for all images to be fully loaded and converted to base64
      const treemapData = getTreemapData();
      const imagePromises = treemapData
        .filter(item => item.imageUrl && !imageCache.has(item.imageUrl))
        .map(item => {
          return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                try {
                  const base64 = canvas.toDataURL('image/png');
                  imageCache.set(item.imageUrl, base64);
                } catch (e) {
                  console.error('Failed to convert image:', e);
                  imageCache.set(item.imageUrl, item.imageUrl);
                }
              }
              resolve(null);
            };
            img.onerror = () => resolve(null);
            img.src = item.imageUrl;
          });
        });

      await Promise.all(imagePromises);

      // Wait a bit more to ensure SVG is fully rendered
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.dismiss(loadingToast);
      const generatingToast = toast.loading('Generating image...');

      const canvas = await html2canvas(element, {
        backgroundColor: '#0a0f1a',
        scale: 4, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Force all images in cloned document to use base64
          const images = clonedDoc.querySelectorAll('image');
          images.forEach((img: any) => {
            const href = img.getAttribute('href') || img.getAttribute('xlink:href');
            if (href && imageCache.has(href)) {
              img.setAttribute('href', imageCache.get(href)!);
              img.setAttribute('xlink:href', imageCache.get(href)!);
            }
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
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Market Charts</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 justify-center">
          <Button
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            className="rounded-full"
          >
            <List className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => setViewMode('grid')}
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            className="rounded-full"
          >
            <LayoutGrid className="w-5 h-5" />
          </Button>
          <Button
            onClick={() => setViewMode('heatmap')}
            variant={viewMode === 'heatmap' ? 'default' : 'outline'}
            size="icon"
            className="rounded-full"
          >
            <BarChart3 className="w-5 h-5" />
          </Button>
        </div>

        {/* Filters */}
        {viewMode === 'heatmap' && (
          <div className="space-y-3">
            {/* Currency */}
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrency('ton')}
                variant={currency === 'ton' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
              >
                TON
              </Button>
              <Button
                onClick={() => setCurrency('usd')}
                variant={currency === 'usd' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
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
              >
                All
              </Button>
              <Button
                onClick={() => setTopFilter('top50')}
                variant={topFilter === 'top50' ? 'default' : 'outline'}
                size="sm"
              >
                Top 50
              </Button>
              <Button
                onClick={() => setTopFilter('top35')}
                variant={topFilter === 'top35' ? 'default' : 'outline'}
                size="sm"
              >
                Top 35
              </Button>
              <Button
                onClick={() => setTopFilter('top25')}
                variant={topFilter === 'top25' ? 'default' : 'outline'}
                size="sm"
              >
                Top 25
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => setZoomLevel(1)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Zoom
              </Button>
            </div>

            {/* Download Button */}
            <Button
              onClick={downloadAsImage}
              variant="default"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Get it as a photo
            </Button>
          </div>
        )}

        {/* Content */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-4 gap-2">
            {filteredData.map(([name, data]) => {
              const change = currency === 'ton' ? data['change_24h_ton_%'] : data['change_24h_usd_%'];
              const price = currency === 'ton' ? data.price_ton : data.price_usd;
              const isPositive = change >= 0;
              const isNeutral = change === 0;

              const getCardStyle = () => {
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
                    <img
                      src={imageCache.get(data.image_url) || data.image_url}
                      alt={name}
                      className="w-12 h-12 object-contain"
                    />
                    <div className="flex items-center gap-1">
                      <TonIcon className="w-3 h-3" />
                      <span className="font-bold text-foreground text-sm">
                        {price.toFixed(2)}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isPositive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {change.toFixed(2)}%
                    </span>
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
                        <img
                          src={imageCache.get(data.image_url) || data.image_url}
                          alt={name}
                          className="w-12 h-12 object-contain rounded-full"
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
                        <span
                          className={`text-sm font-medium ${
                            isPositive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {change.toFixed(2)}%
                        </span>
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
              aspectRatio: '16 / 9',
              maxHeight: window.innerWidth < 768 ? '600px' : '768px',
            }}
          >
            {/* Watermark Overlay */}
            <div 
              className="absolute bottom-4 right-4 text-muted-foreground/40 text-xs font-medium pointer-events-none z-10"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              @Nova_calculator_bot
            </div>
            
            <HeatmapTreemap data={getTreemapData()} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Chart;
