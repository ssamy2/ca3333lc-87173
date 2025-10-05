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
    // Exactly 2 solid colors (no shades)
    return change >= 0 ? '#16a34a' : '#dc2626';
  };

  const getSizeForChange = (change: number) => {
    const absChange = Math.abs(change);
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // حساب الحجم بشكل متناسب مع نسبة التغيير للموبايل
      if (absChange >= 10) return 100;
      if (absChange >= 8) return 90;
      if (absChange >= 6) return 80;
      if (absChange >= 4) return 70;
      if (absChange >= 2) return 60;
      if (absChange >= 1) return 55;
      return 50;
    }
    
    // حساب الحجم بشكل متناسب مع نسبة التغيير للديسكتوب
    if (absChange >= 15) return 200;
    if (absChange >= 12) return 180;
    if (absChange >= 10) return 160;
    if (absChange >= 8) return 140;
    if (absChange >= 6) return 120;
    if (absChange >= 4) return 100;
    if (absChange >= 2) return 85;
    if (absChange >= 1) return 75;
    return 65;
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
                  return 'bg-[#1a2332] hover:shadow-lg hover:shadow-gray-500/20';
                }
                if (isPositive) {
                  return 'bg-gradient-to-br from-green-900/40 to-green-950/60 hover:shadow-lg hover:shadow-green-500/30';
                }
                return 'bg-gradient-to-br from-red-900/40 to-red-950/60 hover:shadow-lg hover:shadow-red-500/30';
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
                      isPositive ? 'text-green-400' : 'text-red-400'
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
              className="relative bg-[#0a0f1a] inline-block"
              style={{ 
                transform: window.innerWidth >= 768 ? `scale(${zoomLevel})` : 'scale(1)', 
                transformOrigin: 'top left',
                minWidth: window.innerWidth < 768 ? '100%' : 'auto',
              }}
            >
              <div className="flex flex-wrap" style={{ lineHeight: 0, gap: 0 }}>
                {filteredData.map(([name, data], index) => {
                  const change = currency === 'ton' ? data['change_24h_ton_%'] : data['change_24h_usd_%'];
                  const price = currency === 'ton' ? data.price_ton : data.price_usd;
                  const size = getSizeForChange(change);
                  const color = getColorForChange(change);
                  const isMobile = window.innerWidth < 768;
                  
                  // Insert watermark at random position (but consistent)
                  const watermarkPosition = Math.floor(filteredData.length * 0.4);
                  const shouldShowWatermark = index === watermarkPosition;
                  const watermarkSize = isMobile ? 70 : 140;

                  return (
                    <React.Fragment key={`item-${name}-${index}`}>
                      {shouldShowWatermark && (
                        <div
                          className="inline-flex items-center justify-center text-white/80 font-bold"
                          style={{
                            backgroundColor: '#0a0f1a',
                            width: `${watermarkSize}px`,
                            height: `${watermarkSize}px`,
                            fontSize: isMobile ? '8px' : '13px',
                            padding: isMobile ? '4px' : '8px',
                            margin: 0,
                            border: 0,
                            boxSizing: 'border-box',
                            textAlign: 'center',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          }}
                        >
                          @Nova_calculator_bot
                        </div>
                      )}
                      <div
                        className="inline-flex flex-col items-center justify-center text-white"
                        style={{
                          backgroundColor: color,
                          width: `${size}px`,
                          height: `${size}px`,
                          padding: size >= 160 ? '12px' : size >= 120 ? '10px' : size >= 80 ? '6px' : size >= 60 ? '4px' : '3px',
                          margin: 0,
                          border: 0,
                          boxSizing: 'border-box',
                          gap: size >= 160 ? '6px' : size >= 120 ? '5px' : size >= 80 ? '4px' : '2px',
                          overflow: 'hidden',
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        <img
                          src={imageCache.get(data.image_url) || data.image_url}
                          alt={name}
                          className="object-contain"
                          style={{
                            width: size >= 160 ? '42px' : size >= 140 ? '36px' : size >= 80 ? '30px' : size >= 60 ? '20px' : '16px',
                            height: size >= 160 ? '42px' : size >= 140 ? '36px' : size >= 80 ? '30px' : size >= 60 ? '20px' : '16px',
                            flexShrink: 0,
                            marginBottom: isMobile ? '1px' : '2px',
                          }}
                        />
                        <div 
                          className="font-bold text-center"
                          style={{ 
                            fontSize: size >= 160 ? '13px' : size >= 140 ? '12px' : size >= 80 ? '10px' : size >= 60 ? '7px' : '6px',
                            fontWeight: size >= 140 ? 700 : 800,
                            lineHeight: '1.1',
                            overflow: 'visible',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                            textShadow: '0 2px 3px rgba(0,0,0,0.6)',
                            whiteSpace: 'nowrap',
                            letterSpacing: isMobile ? '0.2px' : '0.5px',
                            WebkitFontSmoothing: 'antialiased',
                            textRendering: 'optimizeLegibility',
                          }}
                        >
                          {name}
                        </div>
                        <div 
                          className="font-bold"
                          style={{ 
                            fontSize: size >= 160 ? '18px' : size >= 140 ? '16px' : size >= 80 ? '14px' : size >= 60 ? '10px' : '8px',
                            fontWeight: 900,
                            lineHeight: '1',
                            textShadow: '0 2px 3px rgba(0,0,0,0.6)',
                            whiteSpace: 'nowrap',
                            letterSpacing: isMobile ? '0.2px' : '0.5px',
                            marginTop: isMobile ? '1px' : '2px',
                            WebkitFontSmoothing: 'antialiased',
                            textRendering: 'optimizeLegibility',
                          }}
                        >
                          {change >= 0 ? '+' : ''}
                          {change.toFixed(2)}%
                        </div>
                        {size >= 60 && (
                          <div 
                            className="flex items-center"
                            style={{ 
                              fontSize: size >= 160 ? '11px' : size >= 140 ? '10px' : size >= 80 ? '9px' : '7px',
                              fontWeight: size >= 140 ? 700 : 800,
                              lineHeight: '1',
                              gap: size >= 160 ? '3px' : '2px',
                              textShadow: '0 2px 3px rgba(0,0,0,0.6)',
                              whiteSpace: 'nowrap',
                              letterSpacing: isMobile ? '0.2px' : '0.5px',
                              marginTop: isMobile ? '1px' : '2px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              WebkitFontSmoothing: 'antialiased',
                              textRendering: 'optimizeLegibility',
                            }}
                          >
                            <TonIcon className={size >= 140 ? "w-3 h-3 flex-shrink-0" : size >= 60 ? "w-2 h-2 flex-shrink-0" : "w-1.5 h-1.5 flex-shrink-0"} />
                            <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                              {price.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chart;