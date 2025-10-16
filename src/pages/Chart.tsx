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

  const getSizeForChange = (change: number) => {
    const absChange = Math.abs(change);
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // Mobile sizes - larger and more granular
      if (absChange >= 15) return 180;
      if (absChange >= 12) return 160;
      if (absChange >= 10) return 145;
      if (absChange >= 8) return 130;
      if (absChange >= 6) return 115;
      if (absChange >= 5) return 100;
      if (absChange >= 4) return 90;
      if (absChange >= 3) return 80;
      if (absChange >= 2) return 70;
      if (absChange >= 1) return 60;
      return 55;
    }
    
    // Desktop sizes - more granular
    if (absChange >= 18) return 250;
    if (absChange >= 15) return 220;
    if (absChange >= 12) return 190;
    if (absChange >= 10) return 170;
    if (absChange >= 8) return 150;
    if (absChange >= 6) return 130;
    if (absChange >= 5) return 115;
    if (absChange >= 4) return 100;
    if (absChange >= 3) return 90;
    if (absChange >= 2) return 80;
    if (absChange >= 1) return 70;
    return 60;
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
                width: window.innerWidth < 768 ? window.innerWidth : 1200,
                height: window.innerWidth < 768 ? 1200 : 1000,
                display: 'flex',
                flexWrap: 'wrap',
                alignContent: 'flex-start',
                justifyContent: 'flex-start',
                gap: window.innerWidth < 768 ? 3 : 2,
                padding: window.innerWidth < 768 ? 0 : 4,
              }}
            >
              {/* Watermark Overlay */}
              <div 
                className="absolute bottom-4 right-4 text-muted-foreground/40 text-xs font-medium pointer-events-none z-10"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
              >
                @Nova_calculator_bot
              </div>
              
              {filteredData.map(([name, data], index) => {
                const change = currency === 'ton' ? data['change_24h_ton_%'] : data['change_24h_usd_%'];
                const price = currency === 'ton' ? data.price_ton : data.price_usd;
                const size = getSizeForChange(change);
                const color = getColorForChange(change);
                const isMobile = window.innerWidth < 768;
                
                // Determine font sizes and padding based on block size
                const getFontSizes = () => {
                  if (isMobile) {
                    // Mobile font sizes - more readable
                    if (size >= 160) return { name: 12, percentage: 18, price: 10, icon: 38, padding: 10 };
                    if (size >= 140) return { name: 11, percentage: 16, price: 9, icon: 34, padding: 9 };
                    if (size >= 120) return { name: 10, percentage: 14, price: 9, icon: 30, padding: 8 };
                    if (size >= 100) return { name: 9, percentage: 13, price: 8, icon: 26, padding: 7 };
                    if (size >= 85) return { name: 8, percentage: 12, price: 8, icon: 22, padding: 6 };
                    if (size >= 70) return { name: 7, percentage: 11, price: 0, icon: 18, padding: 5 };
                    if (size >= 60) return { name: 6, percentage: 10, price: 0, icon: 16, padding: 4 };
                    return { name: 5, percentage: 9, price: 0, icon: 14, padding: 3 };
                  }
                  
                  // Desktop font sizes
                  if (size >= 200) return { name: 14, percentage: 20, price: 11, icon: 42, padding: 12 };
                  if (size >= 170) return { name: 13, percentage: 18, price: 10, icon: 38, padding: 11 };
                  if (size >= 150) return { name: 12, percentage: 16, price: 10, icon: 34, padding: 10 };
                  if (size >= 130) return { name: 11, percentage: 15, price: 9, icon: 30, padding: 9 };
                  if (size >= 110) return { name: 10, percentage: 14, price: 8, icon: 26, padding: 8 };
                  if (size >= 90) return { name: 9, percentage: 12, price: 8, icon: 22, padding: 7 };
                  if (size >= 75) return { name: 8, percentage: 11, price: 7, icon: 20, padding: 6 };
                  if (size >= 65) return { name: 7, percentage: 10, price: 0, icon: 18, padding: 5 };
                  if (size >= 55) return { name: 6, percentage: 9, price: 0, icon: 14, padding: 4 };
                  return { name: 5, percentage: 8, price: 0, icon: 12, padding: 3 };
                };

                const sizes = getFontSizes();
                const showPrice = sizes.price > 0;

                return (
                  <div
                    key={`${name}-${index}`}
                    className="flex flex-col items-center justify-center text-white flex-shrink-0"
                    style={{
                      width: size,
                      height: size,
                      backgroundColor: color,
                      padding: sizes.padding,
                      boxSizing: 'border-box',
                      gap: size >= 120 ? 6 : size >= 90 ? 4 : size >= 70 ? 3 : 2,
                      overflow: 'hidden',
                      transition: 'opacity 0.2s',
                      border: '1px solid rgba(0,0,0,0.15)',
                      borderRadius: 4,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    {/* Image */}
                    <img
                      src={imageCache.get(data.image_url) || data.image_url}
                      alt={name}
                      className="object-contain flex-shrink-0"
                      style={{
                        width: sizes.icon,
                        height: sizes.icon,
                        maxWidth: size >= 100 ? '75%' : '80%',
                        maxHeight: size >= 100 ? '40%' : '35%',
                      }}
                    />
                    
                    {/* Name */}
                    {size >= 55 && (
                      <div 
                        className="font-bold text-center leading-tight"
                        style={{ 
                          fontSize: sizes.name,
                          textShadow: '0 2px 3px rgba(0,0,0,0.6)',
                          whiteSpace: size >= 130 ? 'normal' : 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                          WebkitFontSmoothing: 'antialiased',
                          lineHeight: 1.2,
                        }}
                      >
                        {name}
                      </div>
                    )}
                    
                    {/* Percentage */}
                    <div 
                      className="font-bold"
                      style={{ 
                        fontSize: sizes.percentage,
                        fontWeight: 900,
                        textShadow: '0 2px 3px rgba(0,0,0,0.6)',
                        whiteSpace: 'nowrap',
                        WebkitFontSmoothing: 'antialiased',
                        lineHeight: 1,
                      }}
                    >
                      {change >= 0 ? '+' : ''}
                      {change.toFixed(2)}%
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
                        <span>{price.toFixed(2)}</span>
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
