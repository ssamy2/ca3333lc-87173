import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Users, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import TonIcon from '@/components/TonIcon';
import type { TradingGift } from '@/services/tradingService';
import { BuySheet } from './BuySheet';

interface MarketTabProps {
  gifts: Record<string, TradingGift>;
  isLoading: boolean;
  isRTL: boolean;
  onBuy: (giftName: string, quantity: number) => Promise<void>;
  isBuying: boolean;
}

export function MarketTab({ gifts, isLoading, isRTL, onBuy, isBuying }: MarketTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGift, setSelectedGift] = useState<TradingGift | null>(null);

  const filteredGifts = Object.entries(gifts).filter(([name]) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatNumber = (num: number | undefined | null) => {
    const value = num ?? 0;
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatPercent = (num: number | undefined | null) => {
    const value = num ?? 0;
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('/api/')) {
      return `https://channelsseller.site${imageUrl}`;
    }
    return imageUrl;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className={cn(
          "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground",
          isRTL ? "right-3" : "left-3"
        )} />
        <Input
          placeholder={isRTL ? "بحث عن هدية..." : "Search gifts..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            "glass-effect border-border/50 h-11",
            isRTL ? "pr-10 text-right" : "pl-10"
          )}
        />
      </div>

      {/* Gifts List */}
      <div className="space-y-2">
        {filteredGifts.map(([name, gift]) => {
          const isPositive = (gift.change_24h_ton_percent ?? 0) >= 0;
          
          return (
            <button
              key={name}
              onClick={() => setSelectedGift(gift)}
              className={cn(
                "w-full glass-effect rounded-xl p-3 transition-all duration-200",
                "hover:bg-muted/30 hover:scale-[1.01] active:scale-[0.99]",
                "border border-transparent hover:border-primary/20"
              )}
            >
              <div className={cn(
                "flex items-center gap-3",
                isRTL && "flex-row-reverse"
              )}>
                {/* Gift Image */}
                <div className="relative">
                  <img
                    src={getImageUrl(gift.image_url)}
                    alt={gift.name}
                    className="w-12 h-12 rounded-lg object-cover bg-muted"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>

                {/* Gift Info */}
                <div className={cn(
                  "flex-1 min-w-0",
                  isRTL ? "text-right" : "text-left"
                )}>
                  <h3 className="font-semibold text-foreground truncate">
                    {gift.name}
                  </h3>
                  <div className={cn(
                    "flex items-center gap-1 text-xs text-muted-foreground",
                    isRTL && "flex-row-reverse justify-end"
                  )}>
                    <Users className="w-3 h-3" />
                    <span>
                      {gift.bot_owners_count ?? 0} {isRTL ? 'مالك' : 'owners'}
                    </span>
                  </div>
                </div>

                {/* Price & Change */}
                <div className={cn(
                  "text-right",
                  isRTL && "text-left"
                )}>
                  <div className={cn(
                    "flex items-center gap-1 font-bold",
                    isRTL && "flex-row-reverse justify-start"
                  )}>
                    <TonIcon className="w-4 h-4" />
                    <span>{formatNumber(gift.priceTon ?? 0)}</span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-sm",
                    isPositive ? "text-success" : "text-destructive",
                    isRTL && "flex-row-reverse justify-start"
                  )}>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{formatPercent(gift.change_24h_ton_percent ?? 0)}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {filteredGifts.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            {isRTL ? 'لا توجد هدايا مطابقة' : 'No matching gifts found'}
          </div>
        )}
      </div>

      {/* Buy Sheet */}
      <BuySheet
        gift={selectedGift}
        isOpen={!!selectedGift}
        onClose={() => setSelectedGift(null)}
        onBuy={onBuy}
        isBuying={isBuying}
        isRTL={isRTL}
      />
    </div>
  );
}
