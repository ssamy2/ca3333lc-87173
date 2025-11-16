import React, { useState } from 'react';
import TonIcon from '@/components/TonIcon';
import GiftImage from '@/components/GiftImage';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';

interface MarketTableItem {
  name: string;
  image_url: string;
  price_ton: number;
  market_cap_ton?: string;
  upgradedSupply?: number;
  short_name?: string;
  'change_24h_ton_%': number;
  tonPrice24hAgo?: number;
  tonPriceWeekAgo?: number;
  tonPriceMonthAgo?: number;
  priceTon?: number;
  change_24h_ton_percent?: number;
  change_1w_ton_percent?: number;
  change_1m_ton_percent?: number;
  change_3m_ton_percent?: number;
  change_1y_ton_percent?: number;
  available_periods?: string[];
}

interface MarketTableProps {
  data: Array<[string, MarketTableItem]>;
  isBlackMode?: boolean;
}

const MarketTable: React.FC<MarketTableProps> = ({ data, isBlackMode = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter data based on search
  const filteredData = searchQuery.trim()
    ? data.filter(([name]) => name.toLowerCase().includes(searchQuery.toLowerCase()))
    : data;
  const calculateChange = (currentPrice: number, oldPrice?: number): number => {
    if (!oldPrice || oldPrice === 0) return 0;
    return ((currentPrice - oldPrice) / oldPrice) * 100;
  };

  const formatSupply = (supply?: number): string => {
    if (!supply) return '0';
    if (supply >= 1000000) return (supply / 1000000).toFixed(1) + 'M';
    if (supply >= 1000) return (supply / 1000).toFixed(1) + 'K';
    return supply.toString();
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search gifts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-10 py-3 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-secondary/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground min-w-[20px]">#</span>
          <span className="text-xs font-semibold text-muted-foreground ml-8">Gift</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="text-xs font-semibold text-muted-foreground">Price</span>
          <span className="text-xs font-semibold text-muted-foreground min-w-[45px] text-right">24h</span>
        </div>
      </div>

      {/* Gift Items */}
      <div className="space-y-2">
      {filteredData.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No gifts found</p>
        </div>
      ) : (
        filteredData.map(([name, item], index) => {
        const currentPrice = item.priceTon || item.price_ton;
        
        // For black mode, use the pre-calculated changes
        const change24h = isBlackMode && item.change_24h_ton_percent !== undefined
          ? item.change_24h_ton_percent
          : item['change_24h_ton_%'] || 0;
        
        // Check if data is available
        const has24h = isBlackMode ? (item.available_periods?.includes('24h') ?? false) : true;

        return (
          <Link 
            key={name}
            to={`/gift/${encodeURIComponent(name)}`}
            className="flex items-center justify-between min-h-[68px] w-full rounded-lg bg-secondary/20 hover:bg-secondary/40 px-3 py-2 transition-all border border-border/30 hover:border-border/60"
          >
            {/* Left: Rank + Image + Name */}
            <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
              <span className="text-muted-foreground text-xs font-semibold min-w-[20px] text-center flex-shrink-0">
                {index + 1}
              </span>
              
              <GiftImage
                imageUrl={item.image_url}
                name={name}
                shortName={item.short_name}
                size="sm"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex-shrink-0"
                isBlackMode={isBlackMode}
              />
              
              <div className="flex flex-col min-w-0 flex-1">
                <span className={`font-semibold text-xs sm:text-sm leading-tight ${isBlackMode ? 'text-white' : 'text-foreground'}`}
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    wordBreak: 'break-word'
                  }}
                >
                  {name}
                </span>
                <span className={`text-[10px] sm:text-xs ${isBlackMode ? 'text-white/50' : 'text-muted-foreground'}`}>
                  {formatSupply(item.upgradedSupply)}
                </span>
              </div>
            </div>

            {/* Right: Price + Change */}
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <div className="flex items-center gap-1">
                <TonIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className={`font-bold text-xs sm:text-sm ${isBlackMode ? 'text-[#B87333]' : 'text-foreground'}`}>
                  {currentPrice.toFixed(2)}
                </span>
              </div>
              
              <div className="min-w-[45px] text-right">
                {has24h && (
                  <span className={`font-bold text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap ${
                    change24h > 0 
                      ? 'text-green-500 bg-green-500/10' 
                      : change24h < 0 
                      ? 'text-red-500 bg-red-500/10' 
                      : 'text-muted-foreground bg-secondary/20'
                  }`}>
                    {change24h > 0 ? '+' : ''}{change24h.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
        })
      )}
      </div>
    </div>
  );
};

export default MarketTable;
