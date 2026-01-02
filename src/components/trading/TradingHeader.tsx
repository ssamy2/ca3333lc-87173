import { RefreshCw, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import TonIcon from '@/components/TonIcon';

interface TradingHeaderProps {
  balanceTon: number;
  balanceUsd: number;
  onReset: () => void;
  isResetting: boolean;
  isRTL: boolean;
}

export function TradingHeader({ 
  balanceTon, 
  balanceUsd, 
  onReset, 
  isResetting,
  isRTL 
}: TradingHeaderProps) {
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <div className={cn(
      "glass-effect rounded-2xl p-4 mb-4",
      isRTL && "text-right"
    )}>
      <div className={cn(
        "flex items-center justify-between",
        isRTL && "flex-row-reverse"
      )}>
        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'الرصيد' : 'Balance'}
            </p>
            <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
              <TonIcon className="w-4 h-4" />
              <span className="text-xl font-bold text-foreground">
                {formatNumber(balanceTon)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              ${formatNumber(balanceUsd)} USD
            </p>
          </div>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-destructive/20"
              disabled={isResetting}
            >
              <RefreshCw className={cn("w-4 h-4", isResetting && "animate-spin")} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass-effect border-border/50">
            <AlertDialogHeader>
              <AlertDialogTitle className={cn(isRTL && "text-right")}>
                {isRTL ? 'إعادة تعيين الحساب؟' : 'Reset Account?'}
              </AlertDialogTitle>
              <AlertDialogDescription className={cn(isRTL && "text-right")}>
                {isRTL 
                  ? 'سيتم حذف جميع ممتلكاتك وإعادة الرصيد إلى 10,000 TON. هذا الإجراء لا يمكن التراجع عنه.'
                  : 'All your holdings will be deleted and balance reset to 10,000 TON. This action cannot be undone.'
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className={cn(isRTL && "flex-row-reverse")}>
              <AlertDialogCancel>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={onReset}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isRTL ? 'إعادة تعيين' : 'Reset'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
