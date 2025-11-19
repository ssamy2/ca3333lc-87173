import React, { useMemo } from 'react';
import TonIcon from '@/components/TonIcon';
import type { NFTGift } from '@/hooks/useNFTSearch';

interface TotalValueCardProps {
  nfts: NFTGift[];
  totalLabel: string;
}

export const TotalValueCard = React.memo(({
  nfts,
  totalLabel
}: TotalValueCardProps) => {
  const totalValue = useMemo(() => {
    return nfts.reduce((sum, nft) => sum + (nft.floor_price * nft.count), 0);
  }, [nfts]);

  return (
    <div className="telegram-card p-4 border border-border/50 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{totalLabel}</span>
        <div className="flex items-center gap-2">
          <TonIcon className="w-5 h-5" />
          <span className="text-xl font-bold text-primary">
            {totalValue.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
});

TotalValueCard.displayName = 'TotalValueCard';
