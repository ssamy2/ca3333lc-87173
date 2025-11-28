import React from 'react';
import TonIcon from '@/components/TonIcon';
import { proxyImageUrl } from '@/lib/imageProxy';

interface GiftViewProps {
  gift: any;
  t: (key: string) => string;
}

const GiftView: React.FC<GiftViewProps> = ({ gift, t }) => {
  return (
    <div className="space-y-5 animate-bounce-in pb-6">
      <div className="telegram-card p-6 border border-border/50 shadow-[var(--shadow-card)]">
        <div className="flex flex-col items-center">
          {/* Gift Image */}
          <div className="relative w-56 h-56 mb-6 rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={proxyImageUrl(gift.image)}
              alt={gift.gift_name}
              className="w-full h-full object-contain bg-gradient-to-br from-primary/5 via-background to-accent/5"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>

          {/* Gift Info */}
          <div className="text-center mb-6 space-y-3">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
              {gift.gift_name}
            </h2>
            
            {/* Model and Backdrop */}
            <div className="flex flex-col gap-2 items-center">
              {gift.model && (
                <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl border border-primary/30">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <span className="text-sm font-semibold text-primary">{t('model')}:</span>
                  <span className="text-sm font-medium text-foreground">{gift.model}</span>
                </div>
              )}
              {gift.backdrop && (
                <div className="flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-xl border border-accent/30">
                  <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-accent">{t('backdrop')}:</span>
                  <span className="text-sm font-medium text-foreground">{gift.backdrop}</span>
                </div>
              )}
            </div>
          </div>

          {/* Price Cards */}
          <div className="grid grid-cols-2 gap-4 w-full mb-6">
            <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 rounded-2xl p-5 border border-primary/20 shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TonIcon className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground font-medium">{t('priceTon')}</p>
              </div>
              <p className="text-3xl font-bold text-primary text-center">{typeof gift.price_ton === 'number' ? gift.price_ton.toFixed(2) : '0.00'}</p>
            </div>
            <div className="bg-gradient-to-br from-accent/10 via-background to-accent/5 rounded-2xl p-5 border border-accent/20 shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground font-medium">{t('priceUsd')}</span>
              </div>
              <p className="text-3xl font-bold text-accent text-center">${typeof gift.price_usd === 'number' ? gift.price_usd.toFixed(2) : '0.00'}</p>
            </div>
          </div>

          {/* Rarity */}
          {gift.rarity !== undefined && (
            <div className="w-full bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-2xl p-5 border border-border shadow-lg">
              <p className="text-sm text-muted-foreground mb-2 text-center font-medium">{t('rarity')}</p>
              <p className="text-2xl font-bold text-foreground text-center">
                {gift.rarity}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GiftView;
