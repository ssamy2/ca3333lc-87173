import React from 'react';
import TonIcon from '@/components/TonIcon';
import GiftImage from '@/components/GiftImage';
import { Link } from 'react-router-dom';

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
    <div className="w-full flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Gift Name</span>
          <span>Price</span>
        </div>
        <span>24 h</span>
      </div>

      {/* Gift Items */}
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
            className="flex items-center justify-between h-16 w-full rounded-xl bg-[hsl(var(--secondary-transparent))] px-3 hover:bg-[hsl(var(--secondary-transparent))]/80 transition-all mb-2"
          >
            {/* Left: Rank + Image + Name + Price */}
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm font-medium min-w-[20px]">
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
              
              <div className="flex flex-col">
                <span className={`font-semibold text-sm ${isBlackMode ? 'text-white' : 'text-foreground'}`}>
                  {name}
                </span>
                <span className={`text-xs ${isBlackMode ? 'text-white/50' : 'text-muted-foreground'}`}>
                  {formatSupply(item.upgradedSupply)} / {formatSupply(item.upgradedSupply ? item.upgradedSupply * 1.05 : 0)}
                </span>
              </div>
            </div>

            {/* Right: Price + Change */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <TonIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className={`font-semibold text-sm ${isBlackMode ? 'text-[#B87333]' : 'text-foreground'}`}>
                  {currentPrice.toFixed(2)}
                </span>
              </div>
              
              {has24h && (
                <span className={`font-semibold text-xs ${
                  change24h > 0 
                    ? 'text-green-500' 
                    : change24h < 0 
                    ? 'text-red-500' 
                    : 'text-muted-foreground'
                }`}>
                  {change24h > 0 ? '+' : ''}{change24h.toFixed(2)}%
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default MarketTable;
