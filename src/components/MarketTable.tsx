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
          <tr className="border-b border-border/40">
            <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Gift Name</th>
            <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Price</th>
            <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground hidden md:table-cell">Market cap</th>
            <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground">24 h</th>
            <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground hidden sm:table-cell">Week</th>
            <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground hidden lg:table-cell">Month</th>
          </tr>
        </thead>
        <tbody>
          {data.map(([name, item], index) => {
            const currentPrice = item.priceTon || item.price_ton;
            
            // For black mode, use the pre-calculated changes
            const change24h = isBlackMode && item.change_24h_ton_percent !== undefined
              ? item.change_24h_ton_percent
              : item['change_24h_ton_%'];
            
            const changeWeek = isBlackMode && item.change_1w_ton_percent !== undefined
              ? item.change_1w_ton_percent
              : calculateChange(currentPrice, item.tonPriceWeekAgo);
            
            const changeMonth = isBlackMode && item.change_1m_ton_percent !== undefined
              ? item.change_1m_ton_percent
              : calculateChange(currentPrice, item.tonPriceMonthAgo);
            
            // Check if data is available
            const has24h = isBlackMode ? item.available_periods?.includes('24h') : true;
            const hasWeek = isBlackMode ? item.available_periods?.includes('1w') : true;
            const hasMonth = isBlackMode ? item.available_periods?.includes('1m') : true;

            return (
              <Link 
                key={name}
                to={`/gift/${encodeURIComponent(name)}`}
                className="contents"
              >
                <tr className="border-b border-border/20 hover:bg-accent/50 transition-colors group cursor-pointer">
                  {/* Rank + Image + Name */}
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-sm font-medium min-w-[20px]">
                        {index + 1}
                      </span>
                      <GiftImage
                        imageUrl={item.image_url}
                        name={name}
                        shortName={item.short_name}
                        size="sm"
                        className="w-12 h-12 rounded-lg flex-shrink-0"
                        isBlackMode={isBlackMode}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground truncate text-sm md:text-base">
                          {name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatSupply(item.upgradedSupply)} / {formatSupply(item.upgradedSupply ? item.upgradedSupply * 1.05 : 0)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1">
                      <TonIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="font-semibold text-foreground text-sm md:text-base">
                        {currentPrice.toFixed(2)}
                      </span>
                    </div>
                  </td>

                  {/* Market Cap */}
                  <td className="py-3 px-2 hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <TonIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium text-foreground text-sm">
                        {item.market_cap_ton || '—'}
                      </span>
                    </div>
                  </td>

                  {/* 24h Change */}
                  <td className="py-3 px-2 text-right">
                    {has24h ? (
                      <span className={`font-semibold text-sm ${
                        change24h > 0 ? 'text-green-500' : change24h < 0 ? 'text-red-500' : 'text-muted-foreground'
                      }`}>
                        {change24h > 0 ? '+' : ''}{change24h.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Week Change */}
                  <td className="py-3 px-2 text-right hidden sm:table-cell">
                    {hasWeek ? (
                      <span className={`font-semibold text-sm ${
                        changeWeek > 0 ? 'text-green-500' : changeWeek < 0 ? 'text-red-500' : 'text-muted-foreground'
                      }`}>
                        {changeWeek > 0 ? '+' : ''}{changeWeek.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Month Change */}
                  <td className="py-3 px-2 text-right hidden lg:table-cell">
                    {hasMonth ? (
                      <span className={`font-semibold text-sm ${
                        changeMonth > 0 ? 'text-green-500' : changeMonth < 0 ? 'text-red-500' : 'text-muted-foreground'
                      }`}>
                        {changeMonth > 0 ? '+' : ''}{changeMonth.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
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
