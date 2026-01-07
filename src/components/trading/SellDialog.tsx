import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import TonIcon from '@/components/TonIcon';
import type { Holding } from '@/services/tradingService';

interface SellDialogProps {
  holding: Holding | null;
  isOpen: boolean;
  onClose: () => void;
  onSell: (holdingId: number, quantity?: number) => Promise<void>;
  isSelling: boolean;
  isRTL: boolean;
}

export function SellDialog({ holding, isOpen, onClose, onSell, isSelling, isRTL }: SellDialogProps) {
  const [quantity, setQuantity] = useState<number>(1);
  
  const handleSell = async () => {
    if (!holding) return;
    const sellQuantity = quantity >= holding.quantity ? undefined : quantity;
    await onSell(holding.id, sellQuantity);
    onClose();
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  if (!holding) return null;

  const pnlPositive = (holding.pnl_percent || 0) >= 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="glass-effect border-border/50">
        <AlertDialogHeader>
          <AlertDialogTitle className={cn(isRTL && "text-right")}>
            {isRTL ? 'تأكيد البيع' : 'Confirm Sale'}
          </AlertDialogTitle>
          <AlertDialogDescription className={cn("space-y-3", isRTL && "text-right")}>
            <p>
              {isRTL 
                ? `هل تريد بيع ${holding.gift_name}؟`
                : `Are you sure you want to sell ${holding.gift_name}?`
              }
            </p>
            
            {/* Quantity Selector */}
            {holding.quantity > 1 && (
              <div className={cn(
                "glass-effect rounded-xl p-3 space-y-2",
                isRTL && "text-right"
              )}>
                <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                  <span className="text-sm text-muted-foreground">
                    {isRTL ? 'الكمية للبيع' : 'Quantity to Sell'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={holding.quantity}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        if (val >= 1 && val <= holding.quantity) {
                          setQuantity(val);
                        }
                      }}
                      className="w-16 h-7 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      onClick={() => setQuantity(q => Math.min(holding.quantity, q + 1))}
                      disabled={quantity >= holding.quantity}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {isRTL 
                    ? `لديك ${holding.quantity} من هذه الهدية`
                    : `You have ${holding.quantity} of this gift`
                  }
                </p>
              </div>
            )}
            
            <div className={cn(
              "glass-effect rounded-xl p-3 space-y-2",
              isRTL && "text-right"
            )}>
              <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
                <span className="text-muted-foreground">
                  {isRTL ? 'سعر الشراء' : 'Buy Price'}
                </span>
                <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                  <TonIcon className="w-4 h-4" />
                  <span>{formatNumber(holding.buy_price_ton)}</span>
                </div>
              </div>
              <div className={cn("flex justify-between", isRTL && "flex-row-reverse")}>
                <span className="text-muted-foreground">
                  {isRTL ? 'السعر الحالي' : 'Current Price'}
                </span>
                <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                  <TonIcon className="w-4 h-4" />
                  <span>{formatNumber(holding.current_price_ton || 0)}</span>
                </div>
              </div>
              <div className={cn(
                "flex justify-between pt-2 border-t border-border/50",
                isRTL && "flex-row-reverse"
              )}>
                <span className="text-muted-foreground">
                  {isRTL ? 'الربح/الخسارة' : 'PnL'}
                </span>
                <span className={cn(
                  "font-bold",
                  pnlPositive ? "text-success" : "text-destructive"
                )}>
                  {pnlPositive ? '+' : ''}{formatNumber(holding.unrealized_pnl_ton || 0)} TON
                </span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={cn(isRTL && "flex-row-reverse")}>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSelling}
          >
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSell}
            disabled={isSelling}
          >
            {isSelling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              isRTL ? 'تأكيد البيع' : 'Confirm Sell'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
