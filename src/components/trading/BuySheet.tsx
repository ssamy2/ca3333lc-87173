import { useState } from 'react';
import { Minus, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import TonIcon from '@/components/TonIcon';
import type { TradingGift } from '@/services/tradingService';

interface BuySheetProps {
  gift: TradingGift | null;
  isOpen: boolean;
  onClose: () => void;
  onBuy: (giftName: string, quantity: number) => Promise<void>;
  isBuying: boolean;
  isRTL: boolean;
}

export function BuySheet({ gift, isOpen, onClose, onBuy, isBuying, isRTL }: BuySheetProps) {
  const [quantity, setQuantity] = useState('');

  const handleQuantityChange = (delta: number) => {
    const current = parseInt(quantity) || 1;
    const newValue = Math.max(1, Math.min(5000, current + delta));
    setQuantity(String(newValue));
  };

  const handleBuy = async () => {
    if (!gift) return;
    const buyQuantity = parseInt(quantity) || 1;
    await onBuy(gift.name, buyQuantity);
    setQuantity('');
    onClose();
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '/placeholder.svg';
    if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('/api/')) {
      return `https://channelsseller.site${imageUrl}`;
    }
    return imageUrl;
  };

  if (!gift) return null;

  const currentQuantity = parseInt(quantity) || 1;
  const totalCostTon = gift.priceTon * currentQuantity;
  const totalCostUsd = gift.priceUsd * currentQuantity;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="glass-effect border-t border-border/50 rounded-t-3xl"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className={cn(
            "text-lg font-bold",
            isRTL && "text-right"
          )}>
            {isRTL ? 'شراء هدية' : 'Buy Gift'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          {/* Gift Info */}
          <div className={cn(
            "flex items-center gap-4",
            isRTL && "flex-row-reverse"
          )}>
            <img
              src={getImageUrl(gift.image_url)}
              alt={gift.name}
              className="w-16 h-16 rounded-xl object-cover bg-muted"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            <div className={cn("flex-1", isRTL && "text-right")}>
              <h3 className="font-bold text-lg text-foreground">{gift.name}</h3>
              <div className={cn(
                "flex items-center gap-1 text-muted-foreground",
                isRTL && "flex-row-reverse justify-end"
              )}>
                <TonIcon className="w-4 h-4" />
                <span>{formatNumber(gift.priceTon)} TON</span>
              </div>
              <p className="text-xs text-muted-foreground">
                ${formatNumber(gift.priceUsd)} USD
              </p>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className={cn(
            "flex items-center justify-between",
            isRTL && "flex-row-reverse"
          )}>
            <span className="text-sm text-muted-foreground">
              {isRTL ? 'الكمية' : 'Quantity'}
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => handleQuantityChange(-1)}
                disabled={parseInt(quantity) <= 1 || !quantity}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="1"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 5000)) {
                    setQuantity(val);
                  }
                }}
                onFocus={(e) => {
                  if (!quantity) {
                    setQuantity('1');
                  }
                }}
                className="w-16 h-9 text-center font-bold text-lg"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => handleQuantityChange(1)}
                disabled={parseInt(quantity) >= 5000}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Total Cost */}
          <div className={cn(
            "glass-effect rounded-xl p-4",
            isRTL && "text-right"
          )}>
            <p className="text-sm text-muted-foreground mb-1">
              {isRTL ? 'التكلفة الإجمالية' : 'Total Cost'}
            </p>
            <div className={cn(
              "flex items-center gap-2",
              isRTL && "flex-row-reverse justify-end"
            )}>
              <TonIcon className="w-5 h-5" />
              <span className="text-2xl font-bold">{formatNumber(totalCostTon)}</span>
              <span className="text-muted-foreground">TON</span>
            </div>
            <p className="text-sm text-muted-foreground">
              ${formatNumber(totalCostUsd)} USD
            </p>
          </div>

          {/* Buy Button */}
          <Button
            onClick={handleBuy}
            disabled={isBuying}
            className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90"
          >
            {isBuying ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              isRTL ? 'شراء الآن' : 'Buy Now'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
