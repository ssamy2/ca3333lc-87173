import { useState, useEffect, useRef } from 'react';
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

// Store loaded images to prevent reloading
const imageCache = new Map<string, string>();

const Chart = () => {
  const [marketData, setMarketData] = useState<MarketData>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currency, setCurrency] = useState<Currency>('ton');
  const [topFilter, setTopFilter] = useState<TopFilter>('all');
  const [zoomLevel, setZoomLevel] = useState(1);
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
      
      // Cache images on first load
      if (isInitialLoad) {
        Object.values(data).forEach((nft: any) => {
          if (nft.image_url && !imageCache.has(nft.image_url)) {
            const img = new Image();
            img.src = nft.image_url;
            imageCache.set(nft.image_url, nft.image_url);
          }
        });
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
      // Wait a bit for rendering to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        backgroundColor: '#1a1f2e',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 0,
      });

      // Draw watermark on canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        
        const text = '@Nova_calculator_bot';
        const x = Math.random() * (canvas.width - 250) + 20;
        const y = Math.random() * (canvas.height - 50) + 30;
        
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
      }

      const base64Image = canvas.toDataURL('image/png').split(',')[1];

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
        toast.success('Image sent successfully!');
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
    // Colors matching the reference image
    if (change >= 0) {
      if (change > 10) return '#00c853';  // Bright green
      if (change > 7) return '#1de9b6';   // Teal green
      if (change > 5) return '#22c55e';   // Medium green
      if (change > 3) return '#4ade80';   // Light green
      if (change > 1) return '#86efac';   // Very light green
      return '#bbf7d0';                    // Pale green
    } else {
      if (change < -10) return '#d32f2f'; // Deep red
      if (change < -7) return '#e53935';  // Bright red
      if (change < -5) return '#ef4444';  // Medium red
      if (change < -3) return '#f87171';  // Light red
      if (change < -1) return '#fca5a5';  // Very light red
      return '#fecaca';                    // Pale red
    }
  };

  const getSizeForChange = (change: number) => {
    // Tighter size range for better consistency: 80-140px
    const absChange = Math.abs(change);
    
    if (absChange > 10) return 140;
    if (absChange > 7) return 125;
    if (absChange > 5) return 110;
    if (absChange > 3) return 100;
    if (absChange > 1) return 90;
    return 80;
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredData.map(([name, data]) => {
              const change = currency === 'ton' ? data['change_24h_ton_%'] : data['change_24h_usd_%'];
              const price = currency === 'ton' ? data.price_ton : data.price_usd;
              const isPositive = change >= 0;

              return (
                <Card
                  key={name}
                  className="p-4 flex flex-col items-center gap-2 bg-card/50 backdrop-blur hover:bg-card/70 transition-all"
                >
                  <img
                    src={data.image_url}
                    alt={name}
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  <div className="flex items-center gap-1">
                    <TonIcon className="w-4 h-4" />
                    <span className="font-bold text-foreground">
                      {price.toFixed(2)}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isPositive ? 'text-green-500' : 'text-red-500'
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
          <div
            id="heatmap-container"
            className="relative bg-[#0a0f1a] rounded-lg overflow-hidden"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
          >
            <div className="flex flex-wrap gap-0 justify-start items-start">
              {filteredData.map(([name, data]) => {
                const change = currency === 'ton' ? data['change_24h_ton_%'] : data['change_24h_usd_%'];
                const price = currency === 'ton' ? data.price_ton : data.price_usd;
                const size = getSizeForChange(change);
                const color = getColorForChange(change);

                return (
                  <div
                    key={name}
                    className="flex flex-col items-center justify-center p-1 text-white transition-all hover:opacity-90 border border-black/20"
                    style={{
                      backgroundColor: color,
                      width: `${size}px`,
                      height: `${size}px`,
                      minWidth: '80px',
                      minHeight: '80px',
                    }}
                  >
                    <img
                      src={data.image_url}
                      alt={name}
                      className="object-contain mb-0.5"
                      style={{
                        width: `${size * 0.32}px`,
                        height: `${size * 0.32}px`,
                        maxWidth: '42px',
                        maxHeight: '42px',
                      }}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div 
                      className="font-bold text-center line-clamp-1 px-0.5 leading-tight"
                      style={{ fontSize: `${Math.max(9, size * 0.088)}px` }}
                    >
                      {name}
                    </div>
                    <div 
                      className="font-bold mt-0.5"
                      style={{ fontSize: `${Math.max(11, size * 0.115)}px` }}
                    >
                      {change >= 0 ? '+' : ''}
                      {change.toFixed(2)}%
                    </div>
                    <div 
                      className="flex items-center gap-0.5"
                      style={{ fontSize: `${Math.max(8, size * 0.08)}px` }}
                    >
                      <TonIcon className="w-2.5 h-2.5" />
                      {price.toFixed(2)}
                    </div>
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