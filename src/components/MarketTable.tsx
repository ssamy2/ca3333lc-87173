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
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border/40 backdrop-blur-sm">
            <th className="text-left py-2 px-1.5 text-xs font-semibold text-muted-foreground">Gift Name</th>
            <th className="text-left py-2 px-1.5 text-xs font-semibold text-muted-foreground">Price</th>
            <th className="text-left py-2 px-1.5 text-xs font-semibold text-muted-foreground hidden md:table-cell">Market cap</th>
            <th className="text-right py-2 px-1.5 text-xs font-semibold text-muted-foreground">24 h</th>
            <th className="text-right py-2 px-1.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Week</th>
            <th className="text-right py-2 px-1.5 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Month</th>
          </tr>
        </thead>
        <tbody>
          {data.map(([name, item], index) => {
            const currentPrice = item.priceTon || item.price_ton;
            
            // For black mode, use the pre-calculated changes
            const change24h = isBlackMode && item.change_24h_ton_percent !== undefined
              ? item.change_24h_ton_percent
              : item['change_24h_ton_%'] || 0;
            
            const changeWeek = isBlackMode && item.change_1w_ton_percent !== undefined
              ? item.change_1w_ton_percent
              : calculateChange(currentPrice, item.tonPriceWeekAgo);
            
            const changeMonth = isBlackMode && item.change_1m_ton_percent !== undefined
              ? item.change_1m_ton_percent
              : calculateChange(currentPrice, item.tonPriceMonthAgo);
            
            // Check if data is available
            const has24h = isBlackMode ? (item.available_periods?.includes('24h') ?? false) : true;
            const hasWeek = isBlackMode ? (item.available_periods?.includes('1w') ?? false) : true;
            const hasMonth = isBlackMode ? (item.available_periods?.includes('1m') ?? false) : true;

            return (
              <Link 
                key={name}
                to={`/gift/${encodeURIComponent(name)}`}
                className="contents"
              >
                <tr className="border-b border-border/20 hover:bg-accent/50 hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)] transition-all group cursor-pointer backdrop-blur-sm relative">
                  {/* Subtle glow on hover */}
                  <td className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
                  </td>
                  
                  {/* Rank + Image + Name */}
                  <td className="py-2 px-1.5 relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs font-medium min-w-[16px]">
                        {index + 1}
                      </span>
                      <GiftImage
                        imageUrl={item.image_url}
                        name={name}
                        shortName={item.short_name}
                        size="sm"
                        className="w-9 h-9 rounded-lg flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow"
                        isBlackMode={isBlackMode}
                      />
                      <div className="flex flex-col min-w-0">
                       <span className={`font-semibold truncate text-xs md:text-sm ${isBlackMode ? 'text-white' : 'text-foreground'}`}>
                          {name}
                        </span>
                        <span className={`text-[10px] ${isBlackMode ? 'text-white/50' : 'text-muted-foreground'}`}>
                          {formatSupply(item.upgradedSupply)} / {formatSupply(item.upgradedSupply ? item.upgradedSupply * 1.05 : 0)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-2 px-1.5 relative z-10">
                    <div className="flex items-center gap-0.5">
                      <TonIcon className="w-3 h-3 flex-shrink-0" />
                      <span className={`font-semibold text-xs md:text-sm ${isBlackMode ? 'text-[#B87333]' : 'text-foreground'}`}>
                        {currentPrice.toFixed(2)}
                      </span>
                    </div>
                  </td>

                  {/* Market Cap */}
                  <td className="py-2 px-1.5 hidden md:table-cell relative z-10">
                    <div className="flex items-center gap-0.5">
                      <TonIcon className="w-3 h-3 flex-shrink-0" />
                      <span className={`font-medium text-xs ${isBlackMode ? 'text-white/70' : 'text-foreground'}`}>
                        {item.market_cap_ton || '—'}
                      </span>
                    </div>
                  </td>

                  {/* 24h Change */}
                  <td className="py-2 px-1.5 text-right relative z-10">
                    {has24h ? (
                      <span className={`font-semibold text-xs px-1.5 py-0.5 rounded ${
                        change24h > 0 
                          ? 'text-green-500 bg-green-500/10' 
                          : change24h < 0 
                          ? 'text-red-500 bg-red-500/10' 
                          : 'text-muted-foreground'
                      }`}>
                        {change24h > 0 ? '+' : ''}{change24h.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Week Change */}
                  <td className="py-2 px-1.5 text-right hidden sm:table-cell relative z-10">
                    {hasWeek ? (
                      <span className={`font-semibold text-xs px-1.5 py-0.5 rounded ${
                        changeWeek > 0 
                          ? 'text-green-500 bg-green-500/10' 
                          : changeWeek < 0 
                          ? 'text-red-500 bg-red-500/10' 
                          : 'text-muted-foreground'
                      }`}>
                        {changeWeek > 0 ? '+' : ''}{changeWeek.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Month Change */}
                  <td className="py-2 px-1.5 text-right hidden lg:table-cell relative z-10">
                    {hasMonth ? (
                      <span className={`font-semibold text-xs px-1.5 py-0.5 rounded ${
                        changeMonth > 0 
                          ? 'text-green-500 bg-green-500/10' 
                          : changeMonth < 0 
                          ? 'text-red-500 bg-red-500/10' 
                          : 'text-muted-foreground'
                      }`}>
                        {changeMonth > 0 ? '+' : ''}{changeMonth.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              </Link>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MarketTable;
