import React from 'react';
import TonIcon from '@/components/TonIcon';
import { proxyImageUrl } from '@/lib/imageProxy';
import type { SingleGift } from '@/hooks/useGiftSearch';

interface GiftDetailsViewProps {
  gift: SingleGift;
  modelLabel: string;
  backdropLabel: string;
  priceTonLabel: string;
  priceUsdLabel: string;
  rarityLabel: string;
}

export const GiftDetailsView = React.memo(({
  gift,
  modelLabel,
  backdropLabel,
  priceTonLabel,
  priceUsdLabel,
  rarityLabel
}: GiftDetailsViewProps) => {
  return (
    <div className="telegram-card p-6 border border-border/50 shadow-[var(--shadow-card)] space-y-6">
      <div className="flex flex-col items-center">
        <div className="relative w-56 h-56 mb-6 rounded-2xl overflow-hidden shadow-2xl">
          <img
            src={proxyImageUrl(gift.image_url || gift.image)}
            alt={gift.gift_name}
            className="w-full h-full object-contain bg-gradient-to-br from-primary/5 via-background to-accent/5"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>

        <div className="text-center mb-6 space-y-3 w-full">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
            {gift.gift_name}
          </h2>

          <div className="flex flex-col gap-2 items-center">
            {gift.model && (
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl border border-primary/30">
                <span className="text-sm font-semibold text-primary">{modelLabel}:</span>
                <span className="text-sm font-medium text-foreground">{gift.model}</span>
              </div>
            )}
            {gift.backdrop && (
              <div className="flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-xl border border-accent/30">
                <span className="text-sm font-semibold text-accent">{backdropLabel}:</span>
                <span className="text-sm font-medium text-foreground">{gift.backdrop}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full mb-6">
          <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 rounded-2xl p-5 border border-primary/20 shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TonIcon className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground font-medium">{priceTonLabel}</p>
            </div>
            <p className="text-3xl font-bold text-primary text-center">
              {typeof gift.price_ton === 'number' ? gift.price_ton.toFixed(2) : '0.00'}
            </p>
          </div>
          <div className="bg-gradient-to-br from-accent/10 via-background to-accent/5 rounded-2xl p-5 border border-accent/20 shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm text-muted-foreground font-medium">{priceUsdLabel}</span>
            </div>
            <p className="text-3xl font-bold text-accent text-center">
              ${typeof gift.price_usd === 'number' ? gift.price_usd.toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        {gift.rarity !== undefined && (
          <div className="w-full bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-2xl p-5 border border-border shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">{rarityLabel}</span>
              <span className="text-lg font-bold text-primary">{gift.rarity.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

GiftDetailsView.displayName = 'GiftDetailsView';
