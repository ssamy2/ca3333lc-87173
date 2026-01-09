import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Search, RefreshCw, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import TonIcon from '@/components/TonIcon';
import { DEV_MODE } from '@/config/devMode';

interface PriceComparisonItem {
  name: string;
  getgems_price: number;
  portal_price: number;
  tgmrkt_price: number;
  price_difference: number;
  percentage_diff: number;
  rank: number;
  image_url: string | null;
}

interface PriceComparisonResponse {
  success: boolean;
  count: number;
  last_updated: string | null;
  comparisons: PriceComparisonItem[];
}

type SortField = 'rank' | 'price_difference' | 'percentage_diff' | 'getgems_price' | 'portal_price' | 'tgmrkt_price';
type SortOrder = 'asc' | 'desc';

const PriceComparisonPage: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState<PriceComparisonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const t = {
    ar: {
      title: 'مقارنة الأسعار',
      subtitle: 'مقارنة أسعار الهدايا بين الأسواق',
      back: 'رجوع',
      loading: 'جاري التحميل...',
      error: 'حدث خطأ في تحميل البيانات',
      retry: 'إعادة المحاولة',
      search: 'بحث عن هدية...',
      gift: 'الهدية',
      portal: 'Portal',
      mrkt: 'Mrkt',
      getgems: 'GetGems',
      difference: 'الفرق',
      noResults: 'لا توجد نتائج',
      lastUpdated: 'آخر تحديث',
      profit: 'ربح',
      items: 'عنصر'
    },
    en: {
      title: 'Price Comparison',
      subtitle: 'Compare gift prices across markets',
      back: 'Back',
      loading: 'Loading...',
      error: 'Error loading data',
      retry: 'Retry',
      search: 'Search for a gift...',
      gift: 'Gift',
      portal: 'Portal',
      mrkt: 'Mrkt',
      getgems: 'GetGems',
      difference: 'Diff',
      noResults: 'No results found',
      lastUpdated: 'Last updated',
      profit: 'Profit',
      items: 'items'
    }
  };

  const text = t[language] || t.en;
  const isRTL = language === 'ar';

  const buildApiUrl = (path: string): string => {
    const baseUrl = DEV_MODE ? 'http://localhost:5002' : 'https://www.channelsseller.site';
    return `${baseUrl}${path}`;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(buildApiUrl('/api/price-comparison'), {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const result: PriceComparisonResponse = await response.json();
      
      if (result.success) {
        setData(result.comparisons);
        setLastUpdated(result.last_updated);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'rank' ? 'asc' : 'desc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = data.filter(item => 
        item.name.toLowerCase().includes(query)
      );
    }
    
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'price_difference':
          comparison = a.price_difference - b.price_difference;
          break;
        case 'percentage_diff':
          comparison = a.percentage_diff - b.percentage_diff;
          break;
        case 'getgems_price':
          comparison = a.getgems_price - b.getgems_price;
          break;
        case 'portal_price':
          comparison = a.portal_price - b.portal_price;
          break;
        case 'tgmrkt_price':
          comparison = a.tgmrkt_price - b.tgmrkt_price;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, searchQuery, sortField, sortOrder]);

  const getLowestPrice = (item: PriceComparisonItem) => {
    const prices = [
      { market: 'portal', price: item.portal_price },
      { market: 'mrkt', price: item.tgmrkt_price },
      { market: 'getgems', price: item.getgems_price }
    ];
    return prices.reduce((min, p) => p.price < min.price ? p : min, prices[0]);
  };

  const getHighestPrice = (item: PriceComparisonItem) => {
    const prices = [
      { market: 'portal', price: item.portal_price },
      { market: 'mrkt', price: item.tgmrkt_price },
      { market: 'getgems', price: item.getgems_price }
    ];
    return prices.reduce((max, p) => p.price > max.price ? p : max, prices[0]);
  };

  const MarketBadge = ({ market, price, isLowest, isHighest }: { market: string; price: number; isLowest: boolean; isHighest: boolean }) => {
    const marketColors: Record<string, string> = {
      portal: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      mrkt: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      getgems: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };

    const marketLabels: Record<string, string> = {
      portal: 'Portal',
      mrkt: 'Mrkt',
      getgems: 'GetGems'
    };

    return (
      <div className={cn(
        'flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border',
        marketColors[market],
        isLowest && 'ring-2 ring-green-500/50',
        isHighest && 'ring-2 ring-red-500/50'
      )}>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
          {marketLabels[market]}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold">{price.toFixed(2)}</span>
          <TonIcon className="w-3 h-3" />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground">{text.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center p-6">
          <p className="text-destructive">{text.error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            {text.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className={cn(
          "flex items-center gap-4 p-4 max-w-6xl mx-auto",
          isRTL && "flex-row-reverse"
        )}>
          <button
            onClick={() => navigate(-1)}
            className={cn(
              "p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors",
              isRTL && "rotate-180"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className={cn("flex-1", isRTL && "text-right")}>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {text.title}
            </h1>
            <p className="text-xs text-muted-foreground">{text.subtitle}</p>
          </div>

          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4 max-w-6xl mx-auto">
          <div className={cn(
            "relative flex items-center",
            isRTL && "flex-row-reverse"
          )}>
            <Search className={cn(
              "absolute w-4 h-4 text-muted-foreground",
              isRTL ? "right-3" : "left-3"
            )} />
            <input
              type="text"
              placeholder={text.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full py-2.5 px-10 bg-secondary/50 border border-border/50 rounded-xl",
                "text-sm placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                "transition-all duration-200",
                isRTL && "text-right"
              )}
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className={cn(
          "px-4 pb-3 max-w-6xl mx-auto flex items-center gap-4 text-xs text-muted-foreground",
          isRTL && "flex-row-reverse"
        )}>
          <span>{filteredAndSortedData.length} {text.items}</span>
          {lastUpdated && (
            <span className="opacity-60">
              {text.lastUpdated}: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-6xl mx-auto">
        {filteredAndSortedData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {text.noResults}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedData.map((item) => {
              const lowest = getLowestPrice(item);
              const highest = getHighestPrice(item);
              
              return (
                <div
                  key={item.name}
                  className={cn(
                    "bg-card border border-border/50 rounded-2xl p-4",
                    "hover:border-primary/30 transition-all duration-200"
                  )}
                >
                  {/* Gift Info Row */}
                  <div className={cn(
                    "flex items-center gap-3 mb-3",
                    isRTL && "flex-row-reverse"
                  )}>
                    {/* Gift Image */}
                    <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url.startsWith('/') ? buildApiUrl(item.image_url) : item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-lg">🎁</span>
                      )}
                    </div>

                    {/* Gift Name */}
                    <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                      <h3 className="font-bold text-foreground truncate">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">#{item.rank}</p>
                    </div>

                    {/* Profit Difference */}
                    <div className={cn(
                      "flex flex-col items-end gap-0.5",
                      isRTL && "items-start"
                    )}>
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-lg",
                        item.percentage_diff >= 5 
                          ? "bg-green-500/20 text-green-400" 
                          : "bg-yellow-500/20 text-yellow-400"
                      )}>
                        {item.percentage_diff >= 5 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span className="text-sm font-bold">+{item.percentage_diff.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>+{item.price_difference.toFixed(2)}</span>
                        <TonIcon className="w-3 h-3" />
                      </div>
                    </div>
                  </div>

                  {/* Market Prices Row */}
                  <div className={cn(
                    "grid grid-cols-3 gap-2",
                    isRTL && "direction-rtl"
                  )}>
                    <MarketBadge 
                      market="portal" 
                      price={item.portal_price} 
                      isLowest={lowest.market === 'portal'}
                      isHighest={highest.market === 'portal'}
                    />
                    <MarketBadge 
                      market="mrkt" 
                      price={item.tgmrkt_price} 
                      isLowest={lowest.market === 'mrkt'}
                      isHighest={highest.market === 'mrkt'}
                    />
                    <MarketBadge 
                      market="getgems" 
                      price={item.getgems_price} 
                      isLowest={lowest.market === 'getgems'}
                      isHighest={highest.market === 'getgems'}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceComparisonPage;
