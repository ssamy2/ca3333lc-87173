import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Download, Search, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import TonIcon from '@/components/TonIcon';

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
type SortBy = 'change' | 'market_cap';
type Currency = 'ton' | 'usd';
type TimeFrame = '1m' | '1w' | '24h';
type TopFilter = 'all' | 'top50' | 'top35' | 'top25';

const Chart = () => {
  const [marketData, setMarketData] = useState<MarketData>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('change');
  const [currency, setCurrency] = useState<Currency>('ton');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('24h');
  const [topFilter, setTopFilter] = useState<TopFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://channelsseller.site/api/market-data');
      const data = await response.json();
      setMarketData(data);
    } catch (error) {
      console.error('Error fetching market data:', error);
      toast.error('Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    let entries = Object.entries(marketData);

    // Apply search filter
    if (searchQuery) {
      entries = entries.filter(([name]) =>
        name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by change
    entries.sort((a, b) => {
      const changeA = currency === 'ton' ? a[1]['change_24h_ton_%'] : a[1]['change_24h_usd_%'];
      const changeB = currency === 'ton' ? b[1]['change_24h_ton_%'] : b[1]['change_24h_usd_%'];
      return changeB - changeA;
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
    if (!element) return;

    try {
      toast.loading('Generating image...');
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#1a1f2e',
        scale: 2,
      });

      const base64Image = canvas.toDataURL('image/png').split(',')[1];

      // Get Telegram user ID
      const tg = (window as any).Telegram?.WebApp;
      const userId = tg?.initDataUnsafe?.user?.id;

      if (!userId) {
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

      if (response.ok) {
        toast.success('Image sent successfully!');
      } else {
        toast.error('Failed to send image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
    }
  };

  const getColorForChange = (change: number) => {
    if (change > 10) return 'rgb(0, 180, 0)';
    if (change > 5) return 'rgb(50, 200, 50)';
    if (change > 0) return 'rgb(100, 220, 100)';
    if (change > -5) return 'rgb(220, 100, 100)';
    if (change > -10) return 'rgb(200, 50, 50)';
    return 'rgb(180, 0, 0)';
  };

  const getSizeForChange = (change: number, total: number) => {
    const absChange = Math.abs(change);
    const maxChange = Math.max(...Object.values(marketData).map(d => 
      Math.abs(currency === 'ton' ? d['change_24h_ton_%'] : d['change_24h_usd_%'])
    ));
    
    const minSize = 80;
    const maxSize = 200;
    const size = minSize + (absChange / maxChange) * (maxSize - minSize);
    
    return size;
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
            {/* Sort & Currency */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex gap-1">
                <Button
                  onClick={() => setSortBy('change')}
                  variant={sortBy === 'change' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                >
                  Change
                </Button>
              </div>
              <div className="flex gap-1">
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
            </div>

            {/* Time Frame */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => setTimeFrame('1m')}
                variant={timeFrame === '1m' ? 'default' : 'outline'}
                size="sm"
              >
                1m
              </Button>
              <Button
                onClick={() => setTimeFrame('1w')}
                variant={timeFrame === '1w' ? 'default' : 'outline'}
                size="sm"
              >
                1w
              </Button>
              <Button
                onClick={() => setTimeFrame('24h')}
                variant={timeFrame === '24h' ? 'default' : 'outline'}
                size="sm"
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
              <Button
                onClick={() => setSearchQuery('')}
                variant="outline"
                size="sm"
              >
                <Search className="w-4 h-4" />
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
            className="relative bg-card/30 backdrop-blur rounded-lg p-4 overflow-auto"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
          >
            <div className="flex flex-wrap gap-1">
              {filteredData.map(([name, data]) => {
                const change = currency === 'ton' ? data['change_24h_ton_%'] : data['change_24h_usd_%'];
                const price = currency === 'ton' ? data.price_ton : data.price_usd;
                const size = getSizeForChange(change, filteredData.length);
                const color = getColorForChange(change);

                return (
                  <div
                    key={name}
                    className="flex flex-col items-center justify-center p-2 rounded text-white"
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
                      className="w-8 h-8 object-contain mb-1"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="text-xs font-bold text-center line-clamp-2">
                      {name}
                    </div>
                    <div className="text-xs font-semibold">
                      {change >= 0 ? '+' : ''}
                      {change.toFixed(2)}%
                    </div>
                    <div className="text-xs flex items-center gap-1">
                      <TonIcon className="w-3 h-3" />
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