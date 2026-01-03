import { useState } from 'react';
import { TrendingUp, TrendingDown, History, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TonIcon from '@/components/TonIcon';
import type { PortfolioData, Holding } from '@/services/tradingService';
import { SellDialog } from './SellDialog';
import { CachedImage } from './CachedImage';

interface PortfolioTabProps {
  portfolio: PortfolioData | null;
  isLoading: boolean;
  isRTL: boolean;
  onSell: (holdingId: number) => Promise<void>;
  isSelling: boolean;
}

export function PortfolioTab({ portfolio, isLoading, isRTL, onSell, isSelling }: PortfolioTabProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);

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

  const getImageUrl = (imageUrl: string | undefined | null, modelImageUrl?: string | null) => {
    // Priority 1: Use model_image_url if available (always use full CDN URLs directly)
    if (modelImageUrl) {
      // If it's already a full URL (CDN), return it as-is
      if (modelImageUrl.startsWith('http://') || modelImageUrl.startsWith('https://')) {
        return modelImageUrl;
      }
      // If it's a backend proxy path, try to decode base64
      if (modelImageUrl.startsWith('/api/image/')) {
        const base64Part = modelImageUrl.replace('/api/image/', '').split('.')[0];
        if (base64Part.startsWith('aHR0cHM6Ly9jZG4')) {
          try {
            const decoded = atob(base64Part);
            if (decoded.startsWith('https://')) {
              return decoded;
            }
          } catch (e) {
            // Not valid base64, use backend proxy
          }
        }
        return `https://channelsseller.site${modelImageUrl}`;
      }
    }
    
    // Priority 2: Use general image_url
    if (imageUrl?.startsWith('/api/')) {
      return `https://channelsseller.site${imageUrl}`;
    }
    
    return imageUrl || '/placeholder.svg';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        {isRTL ? 'لا توجد بيانات' : 'No data available'}
      </div>
    );
  }

  const isPositivePnl = (portfolio.total_pnl_ton ?? 0) >= 0;
  const activeHoldings = (portfolio.holdings || []).filter(h => h.status === 'active');

  const isDailyPositive = (portfolio.daily_return_percent ?? 0) >= 0;

  return (
    <div className="space-y-4">
      {/* Daily Return Card */}
      {portfolio.daily_return_percent !== undefined && (
        <div className={cn(
          "glass-effect rounded-xl p-3 border",
          isDailyPositive ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"
        )}>
          <div className={cn(
            "flex items-center justify-between",
            isRTL && "flex-row-reverse"
          )}>
            <span className="text-xs text-muted-foreground">
              {isRTL ? 'الربح اليومي' : 'Today\'s Return'}
            </span>
            <div className={cn(
              "flex items-center gap-1 text-sm font-bold",
              isDailyPositive ? "text-success" : "text-destructive"
            )}>
              {isDailyPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {formatPercent(portfolio.daily_return_percent ?? 0)}
            </div>
          </div>
        </div>
      )}

      {/* Performance Summary Card */}
      <div className={cn(
        "glass-effect rounded-2xl p-4 border-2",
        isPositivePnl 
          ? "border-success/30 bg-success/5" 
          : "border-destructive/30 bg-destructive/5"
      )}>
        <div className={cn(
          "flex items-center justify-between mb-3",
          isRTL && "flex-row-reverse"
        )}>
          <span className="text-sm text-muted-foreground">
            {isRTL ? 'إجمالي الربح (منذ البداية)' : 'Total Return (Since Start)'}
          </span>
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium",
            isPositivePnl ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
          )}>
            {isPositivePnl ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {formatPercent(portfolio.total_return_percent ?? 0)}
          </div>
        </div>
        
        <div className={cn(
          "flex items-center gap-2 mb-2",
          isRTL && "flex-row-reverse justify-end"
        )}>
          <TonIcon className="w-6 h-6" />
          <span className={cn(
            "text-2xl font-bold",
            isPositivePnl ? "text-success" : "text-destructive"
          )}>
            {(portfolio.total_pnl_ton ?? 0) >= 0 ? '+' : ''}{formatNumber(portfolio.total_pnl_ton ?? 0)}
          </span>
        </div>
        
        <div className={cn(
          "flex items-center justify-between text-sm",
          isRTL && "flex-row-reverse"
        )}>
          <span className="text-muted-foreground">
            {isRTL ? 'قيمة المحفظة' : 'Portfolio Value'}
          </span>
          <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
            <TonIcon className="w-4 h-4" />
            <span className="font-medium">{formatNumber(portfolio.portfolio_value_ton ?? 0)}</span>
          </div>
        </div>
      </div>

      {/* Active Holdings */}
      <div>
        <h3 className={cn(
          "text-sm font-medium text-muted-foreground mb-3",
          isRTL && "text-right"
        )}>
          {isRTL ? 'الهدايا النشطة' : 'Active Gifts'} ({activeHoldings.length})
        </h3>
        
        <div className="space-y-2">
          {activeHoldings.map((holding) => {
            const pnlPositive = (holding.pnl_percent || 0) >= 0;
            
            return (
              <div
                key={holding.id}
                className="glass-effect rounded-xl p-3"
              >
                <div className={cn(
                  "flex items-center gap-3",
                  isRTL && "flex-row-reverse"
                )}>
                  <CachedImage
                    src={getImageUrl(holding.image_url, holding.model_image_url)}
                    alt={holding.model_name || holding.gift_name}
                    className="w-12 h-12 rounded-lg object-cover bg-muted"
                  />
                  
                  <div className={cn("flex-1 min-w-0", isRTL && "text-right")}>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground truncate">
                        {holding.gift_name}
                      </h4>
                      {holding.quantity > 1 && (
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          x{holding.quantity}
                        </span>
                      )}
                    </div>
                    {holding.model_name && (
                      <p className="text-xs text-primary/80 truncate">
                        {holding.model_name}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>
                        {isRTL ? 'الشراء: ' : 'Buy: '}
                        {formatNumber(holding.buy_price_ton ?? 0)} TON
                        {holding.quantity > 1 && (
                          <span className="text-muted-foreground/70">
                            {' '}({formatNumber((holding.buy_price_ton ?? 0) * holding.quantity)} TON {isRTL ? 'إجمالي' : 'total'})
                          </span>
                        )}
                      </p>
                      <p>
                        {isRTL ? 'الحالي: ' : 'Current: '}
                        {formatNumber(holding.current_price_ton ?? 0)} TON
                        {holding.quantity > 1 && (
                          <span className="text-muted-foreground/70">
                            {' '}({formatNumber((holding.current_price_ton ?? 0) * holding.quantity)} TON {isRTL ? 'إجمالي' : 'total'})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className={cn("text-right", isRTL && "text-left")}>
                    <div className={cn(
                      "text-sm font-medium",
                      pnlPositive ? "text-success" : "text-destructive"
                    )}>
                      {pnlPositive ? '+' : ''}{formatNumber(holding.unrealized_pnl_ton ?? 0)} TON
                    </div>
                    <div className={cn(
                      "text-xs",
                      pnlPositive ? "text-success" : "text-destructive"
                    )}>
                      {formatPercent(holding.pnl_percent ?? 0)}
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="mt-2 h-7 text-xs"
                      onClick={() => setSelectedHolding(holding)}
                    >
                      {isRTL ? 'بيع' : 'Sell'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {activeHoldings.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              {isRTL ? 'لا توجد ممتلكات نشطة' : 'No active holdings'}
            </div>
          )}
        </div>
      </div>

      {/* Trade History Toggle */}
      {portfolio.trade_history.length > 0 && (
        <div>
          <Button
            variant="ghost"
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              "w-full flex items-center justify-center gap-2 text-muted-foreground",
              isRTL && "flex-row-reverse"
            )}
          >
            <History className="w-4 h-4" />
            <span>
              {isRTL ? 'تاريخ التداول' : 'Trade History'} ({portfolio.sold_holdings_count ?? 0})
            </span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          
          {showHistory && (
            <div className="space-y-2 mt-2">
              {(portfolio.trade_history || []).map((trade) => {
                const pnlPositive = (trade.realized_pnl_ton ?? 0) >= 0;
                
                return (
                  <div
                    key={trade.id}
                    className="glass-effect rounded-xl p-3 opacity-75"
                  >
                    <div className={cn(
                      "flex items-center gap-3",
                      isRTL && "flex-row-reverse"
                    )}>
                      <div className={cn("flex-1", isRTL && "text-right")}>
                        <h4 className="font-medium text-foreground">
                          {trade.gift_name}
                        </h4>
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(trade.buy_price_ton ?? 0)} → {formatNumber(trade.sell_price_ton ?? 0)} TON
                        </div>
                      </div>
                      <div className={cn(
                        "font-medium",
                        pnlPositive ? "text-success" : "text-destructive"
                      )}>
                        {pnlPositive ? '+' : ''}{formatNumber(trade.realized_pnl_ton ?? 0)} TON
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sell Dialog */}
      <SellDialog
        holding={selectedHolding}
        isOpen={!!selectedHolding}
        onClose={() => setSelectedHolding(null)}
        onSell={onSell}
        isSelling={isSelling}
        isRTL={isRTL}
      />
    </div>
  );
}
