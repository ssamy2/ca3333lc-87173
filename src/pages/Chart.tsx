import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Download, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import TonIcon from '@/components/TonIcon';
import { getCachedData, setCachedData } from '@/services/marketCache';

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

type ViewMode = 'grid' | 'heatmap';
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
  const updateIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchMarketData(true);
    
    // Auto-update every 5 seconds
    updateIntervalRef.current = setInterval(() => {
      fetchMarketData(false);
    }, 5000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
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

  const downloadAsImage = async () => {
    const element = document.getElementById('heatmap-container');
    if (!element) {
      toast.error('Heatmap not found');
      return;
    }

    const loadingToast = toast.loading('Generating image...');

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#0a0f1a',
        scale: 3,
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 0,
      });

      const base64Image = canvas.toDataURL('image/png', 1.0).split(',')[1];

      // Get Telegram user ID
      const tg = (window as any).Telegram?.WebApp;
      const userId = tg?.initDataUnsafe?.user?.id;

      if (!userId) {
        toast.dismiss(loadingToast);
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

      toast.dismiss(loadingToast);

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
    // Use CSS variables that adapt to light/dark mode
    const style = getComputedStyle(document.documentElement);
    const success = style.getPropertyValue('--success').trim();
    const destructive = style.getPropertyValue('--destructive').trim();
    return change >= 0 ? `hsl(${success})` : `hsl(${destructive})`;
  };

  // Treemap layout algorithm
  interface TreemapNode {
    name: string;
    value: number;
    change: number;
    price: number;
    imageUrl: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }

  const squarify = (
    data: Array<{ name: string; value: number; change: number; price: number; imageUrl: string }>,
    x: number,
    y: number,
    width: number,
    height: number
  ): TreemapNode[] => {
    if (data.length === 0) return [];

    // Sort by value (largest first)
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    
    const result: TreemapNode[] = [];
    let currentX = x;
    let currentY = y;
    let remainingWidth = width;
    let remainingHeight = height;
    let totalValue = sortedData.reduce((sum, item) => sum + item.value, 0);

    sortedData.forEach((item, index) => {
      const ratio = item.value / totalValue;
      
      // Decide whether to slice horizontally or vertically
      const useHorizontal = remainingWidth >= remainingHeight;
      
      let itemWidth: number;
      let itemHeight: number;

      if (useHorizontal) {
        itemWidth = remainingWidth * ratio;
        itemHeight = remainingHeight;
        
        result.push({
          ...item,
          x: currentX,
          y: currentY,
          width: itemWidth,
          height: itemHeight,
        });

        currentX += itemWidth;
        remainingWidth -= itemWidth;
      } else {
        itemWidth = remainingWidth;
        itemHeight = remainingHeight * ratio;
        
        result.push({
          ...item,
          x: currentX,
          y: currentY,
          width: itemWidth,
          height: itemHeight,
        });

        currentY += itemHeight;
        remainingHeight -= itemHeight;
      }

      totalValue -= item.value;
    });

    return result;
  };

  const calculateTreemap = (): TreemapNode[] => {
    const isMobile = window.innerWidth < 768;
    const containerWidth = isMobile ? window.innerWidth - 32 : 1200;
    const containerHeight = isMobile ? 800 : 1000;

    // Prepare data with absolute values for area calculation
    const treeData = filteredData.map(([name, data]) => {
      const change = currency === 'ton' ? data['change_24h_ton_%'] : data['change_24h_usd_%'];
      const price = currency === 'ton' ? data.price_ton : data.price_usd;
      return {
        name,
        value: Math.abs(change), // Use absolute value for size
        change,
        price,
        imageUrl: data.image_url,
      };
    });

    return squarify(treeData, 0, 0, containerWidth, containerHeight);
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
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode('grid')}
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            className="flex-1"
          >
            Grid View
          </Button>
          <Button
            onClick={() => setViewMode('heatmap')}
            variant={viewMode === 'heatmap' ? 'default' : 'outline'}
            className="flex-1"
          >
            Heatmap View
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
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-4 gap-2">
            {filteredData.map(([name, data]) => {
              const change = currency === 'ton' ? data['change_24h_ton_%'] : data['change_24h_usd_%'];
              const price = currency === 'ton' ? data.price_ton : data.price_usd;
              const isPositive = change >= 0;
              const isNeutral = change === 0;

              // Get background and shadow based on change
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
                <Card
                  key={name}
                  className={`p-3 flex flex-col items-center gap-2 backdrop-blur transition-all duration-300 hover:scale-105 ${getCardStyle()}`}
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
              );
            })}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div
              id="heatmap-container"
              className="relative bg-card"
              style={{ 
                width: window.innerWidth < 768 ? window.innerWidth - 32 : 1200,
                height: window.innerWidth < 768 ? 800 : 1000,
              }}
            >
              {/* Watermark Overlay */}
              <div 
                className="absolute bottom-4 right-4 text-muted-foreground/40 text-xs font-medium pointer-events-none z-10"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
              >
                @Nova_calculator_bot
              </div>
              
              {calculateTreemap().map((node, index) => {
                const color = getColorForChange(node.change);
                const isMobile = window.innerWidth < 768;
                const minSize = Math.min(node.width, node.height);
                
                // Determine font sizes and padding based on block size
                const getFontSizes = () => {
                  if (minSize >= 150) return { name: 14, percentage: 18, price: 11, icon: 40, padding: 12 };
                  if (minSize >= 120) return { name: 12, percentage: 16, price: 10, icon: 36, padding: 10 };
                  if (minSize >= 90) return { name: 11, percentage: 14, price: 9, icon: 30, padding: 8 };
                  if (minSize >= 70) return { name: 10, percentage: 12, price: 8, icon: 24, padding: 6 };
                  if (minSize >= 50) return { name: 8, percentage: 11, price: 7, icon: 20, padding: 5 };
                  if (minSize >= 35) return { name: 7, percentage: 9, price: 0, icon: 16, padding: 4 };
                  return { name: 6, percentage: 8, price: 0, icon: 14, padding: 3 };
                };

                const sizes = getFontSizes();
                const showPrice = sizes.price > 0;

                return (
                  <div
                    key={`${node.name}-${index}`}
                    className="absolute flex flex-col items-center justify-center text-white"
                    style={{
                      left: node.x,
                      top: node.y,
                      width: node.width,
                      height: node.height,
                      backgroundColor: color,
                      padding: sizes.padding,
                      boxSizing: 'border-box',
                      gap: minSize >= 70 ? 4 : minSize >= 50 ? 3 : 2,
                      overflow: 'hidden',
                      transition: 'opacity 0.2s',
                      border: '1px solid rgba(0,0,0,0.1)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    {/* Image */}
                    <img
                      src={imageCache.get(node.imageUrl) || node.imageUrl}
                      alt={node.name}
                      className="object-contain flex-shrink-0"
                      style={{
                        width: sizes.icon,
                        height: sizes.icon,
                        maxWidth: '80%',
                        maxHeight: '30%',
                      }}
                    />
                    
                    {/* Name */}
                    <div 
                      className="font-bold text-center leading-tight"
                      style={{ 
                        fontSize: sizes.name,
                        textShadow: '0 2px 3px rgba(0,0,0,0.6)',
                        whiteSpace: minSize >= 90 ? 'normal' : 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                        WebkitFontSmoothing: 'antialiased',
                      }}
                    >
                      {node.name}
                    </div>
                    
                    {/* Percentage */}
                    <div 
                      className="font-bold"
                      style={{ 
                        fontSize: sizes.percentage,
                        fontWeight: 900,
                        textShadow: '0 2px 3px rgba(0,0,0,0.6)',
                        whiteSpace: 'nowrap',
                        WebkitFontSmoothing: 'antialiased',
                      }}
                    >
                      {node.change >= 0 ? '+' : ''}
                      {node.change.toFixed(2)}%
                    </div>
                    
                    {/* Price (only for larger blocks) */}
                    {showPrice && (
                      <div 
                        className="flex items-center gap-1"
                        style={{ 
                          fontSize: sizes.price,
                          fontWeight: 700,
                          textShadow: '0 2px 3px rgba(0,0,0,0.6)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div style={{ width: sizes.price + 2, height: sizes.price + 2 }}>
                          <TonIcon className="flex-shrink-0 w-full h-full" />
                        </div>
                        <span>{node.price.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chart;
