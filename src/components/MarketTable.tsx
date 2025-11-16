import React from 'react';
import TonIcon from '@/components/TonIcon';
import GiftImage from '@/components/GiftImage';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';

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
    <Card className="w-full p-4 backdrop-blur-xl bg-card/95 border border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 mb-2 rounded-lg bg-secondary/30">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground min-w-[30px]">#</span>
          <span className="text-xs font-semibold text-muted-foreground">Gift</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs font-semibold text-muted-foreground">Price</span>
          <span className="text-xs font-semibold text-muted-foreground min-w-[60px] text-right">24h</span>
        </div>
      </div>

      {/* Gift Items */}
      <div className="space-y-2">
      {data.map(([name, item], index) => {
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
            className="flex items-center justify-between h-16 w-full rounded-lg bg-secondary/20 hover:bg-secondary/40 px-4 transition-all border border-border/30 hover:border-border/60"
          >
            {/* Left: Rank + Image + Name */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-muted-foreground text-sm font-semibold min-w-[30px] text-center">
                {index + 1}
              </span>
              
              <GiftImage
                imageUrl={item.image_url}
                name={name}
                shortName={item.short_name}
                size="sm"
                className="w-10 h-10 rounded-lg flex-shrink-0"
                isBlackMode={isBlackMode}
              />
              
              <div className="flex flex-col min-w-0 flex-1">
                <span className={`font-semibold text-sm truncate ${isBlackMode ? 'text-white' : 'text-foreground'}`}>
                  {name}
                </span>
                <span className={`text-xs ${isBlackMode ? 'text-white/50' : 'text-muted-foreground'}`}>
                  {formatSupply(item.upgradedSupply)}
                </span>
              </div>
            </div>

            {/* Right: Price + Change */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <TonIcon className="w-4 h-4 flex-shrink-0" />
                <span className={`font-bold text-sm ${isBlackMode ? 'text-[#B87333]' : 'text-foreground'}`}>
                  {currentPrice.toFixed(2)}
                </span>
              </div>
              
              <div className="min-w-[60px] text-right">
                {has24h && (
                  <span className={`font-bold text-sm px-2 py-1 rounded ${
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
      })}
      </div>
    </Card>
  );
};

export default MarketTable;
