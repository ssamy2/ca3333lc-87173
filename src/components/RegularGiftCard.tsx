import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import TonIcon from './TonIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Gift } from 'lucide-react';

// TypeScript interface matching the API response
export interface RegularGiftData {
  id: string;
  gift_name: string;
  name?: string;
  short_name?: string;
  image: string;
  quantity: number;
  price_ton: number;
  price_usd: number;
  is_unupgraded: true;
  change_24h_ton_percent?: number | null;
  change_7d_ton_percent?: number | null;
  change_30d_ton_percent?: number | null;
  // Legacy fields for backwards compatibility
  count?: number;
  total_ton?: number;
  total_usd?: number;
  supply?: number;
  multiplier?: string;
  change_24h?: number | null;
}

interface RegularGiftCardProps {
  gift: RegularGiftData;
}

// Optimized image component with lazy loading and reduced quality
const OptimizedGiftImage: React.FC<{
  src: string;
  alt: string;
  isVisible: boolean;
}> = memo(({ src, alt, isVisible }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset state when src changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [src]);

  if (!isVisible || !src || imageError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-muted/30 to-muted/50">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
          <Gift className="w-5 h-5 text-primary/60" />
        </div>
        <p className="text-[10px] text-muted-foreground font-medium">Gift</p>
      </div>
    );
  }

  return (
    <>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        // Reduced quality: smaller size, object-fit for performance
        className={cn(
          "w-full h-full object-contain p-3",
          "transition-opacity duration-200",
          "image-rendering-auto",
          imageLoaded ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          // Force smaller rendering for performance (~75% quality reduction)
          maxWidth: '120px',
          maxHeight: '120px',
          margin: 'auto',
          filter: 'contrast(0.98)' // Slight optimization
        }}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </>
  );
});

OptimizedGiftImage.displayName = 'OptimizedGiftImage';

// Price change indicator component
const PriceChangeIndicator: React.FC<{
  change: number | null | undefined;
  label: string;
}> = memo(({ change, label }) => {
  if (change === null || change === undefined) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="w-2.5 h-2.5" />
        <span className="text-[9px]">{label}: N/A</span>
      </div>
    );
  }

  const isPositive = change > 0;
  const isNegative = change < 0;
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const colorClass = isPositive 
    ? 'text-green-500' 
    : isNegative 
      ? 'text-red-500' 
      : 'text-muted-foreground';

  return (
    <div className={cn("flex items-center gap-0.5", colorClass)}>
      <Icon className="w-2.5 h-2.5" />
      <span className="text-[9px] font-medium">
        {label}: {isPositive ? '+' : ''}{change.toFixed(1)}%
      </span>
    </div>
  );
});

PriceChangeIndicator.displayName = 'PriceChangeIndicator';

const RegularGiftCard: React.FC<RegularGiftCardProps> = memo(({ gift }) => {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading with larger margin for preloading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '150px', threshold: 0.01 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Memoized calculations
  const { quantity, priceTon, totalTon, displayName, hasValidPrice } = useMemo(() => {
    const qty = gift.quantity || gift.count || 1;
    const price = gift.price_ton || 0;
    const total = price * qty;
    const name = gift.gift_name || gift.name || 'Unknown Gift';
    return {
      quantity: qty,
      priceTon: price,
      totalTon: total,
      displayName: name,
      hasValidPrice: price > 0
    };
  }, [gift]);

  // Get 24h change (support both field names)
  const change24h = gift.change_24h_ton_percent ?? gift.change_24h ?? null;

  const formatTON = (amount: number): string => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative flex flex-col overflow-hidden w-full h-full",
        "bg-card/80 dark:bg-card/60 backdrop-blur-sm",
        "rounded-2xl border border-border/30 dark:border-border/20",
        "shadow-sm shadow-black/5 dark:shadow-black/20",
        "hover:shadow-md hover:shadow-primary/5 dark:hover:shadow-primary/10",
        "hover:border-primary/20 dark:hover:border-primary/30",
        "transition-all duration-200 ease-out"
      )}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

      {/* Quantity Badge - Only show if quantity > 1 */}
      {quantity > 1 && (
        <div className={cn(
          "absolute top-2 right-2 z-20",
          "bg-gradient-to-br from-primary to-accent",
          "text-primary-foreground text-[10px] font-bold",
          "rounded-full min-w-[22px] h-[22px] px-1.5",
          "flex items-center justify-center",
          "shadow-md shadow-primary/20 border border-white/20"
        )}>
          ×{quantity}
        </div>
      )}

      {/* Regular Badge */}
      <div className={cn(
        "absolute top-2 left-2 z-20",
        "bg-muted/80 backdrop-blur-sm",
        "text-muted-foreground text-[8px] font-medium",
        "rounded-md px-1.5 py-0.5",
        "border border-border/50"
      )}>
        {language === 'ar' ? 'عادية' : 'Regular'}
      </div>

      {/* Gift Image - Optimized */}
      <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-muted/20 to-muted/40">
        <OptimizedGiftImage
          src={gift.image}
          alt={displayName}
          isVisible={isVisible}
        />
        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card/60 to-transparent pointer-events-none" />
      </div>

      {/* Content Section */}
      <div className="flex flex-col p-2.5 gap-1.5 flex-1 overflow-hidden">
        {/* Title */}
        <h3 className={cn(
          "font-semibold leading-tight truncate",
          "text-foreground group-hover:text-primary",
          "transition-colors duration-200",
          "text-[clamp(10px,2.5vw,13px)]"
        )}>
          {displayName}
        </h3>

        {/* 24h Change - Compact */}
        {change24h !== null && (
          <div className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded-md w-fit",
            change24h > 0 ? 'bg-green-500/10' : change24h < 0 ? 'bg-red-500/10' : 'bg-muted/50'
          )}>
            <PriceChangeIndicator change={change24h} label="24h" />
          </div>
        )}

        {/* Price Section */}
        <div className="flex items-center justify-between pt-1.5 mt-auto border-t border-border/20">
          <span className="text-muted-foreground font-medium text-[clamp(8px,1.8vw,10px)]">
            {language === 'ar' ? 'السعر' : 'Price'}
          </span>
          <div className={cn(
            "flex items-center gap-0.5 px-2 py-1 rounded-lg",
            "bg-primary/10 dark:bg-primary/15",
            "border border-primary/20"
          )}>
            {!hasValidPrice ? (
              <span className="font-medium text-muted-foreground text-[clamp(8px,1.8vw,11px)]">
                {language === 'ar' ? 'غير متوفر' : 'N/A'}
              </span>
            ) : (
              <>
                <span className="font-bold text-foreground font-mono text-[clamp(9px,2.2vw,13px)]">
                  {formatTON(priceTon)}
                </span>
                <TonIcon className="text-primary w-3 h-3 flex-shrink-0" />
              </>
            )}
          </div>
        </div>

        {/* Total Value - Only show if quantity > 1 and price is valid */}
        {quantity > 1 && hasValidPrice && (
          <div className={cn(
            "flex items-center justify-between p-2 rounded-lg",
            "bg-gradient-to-r from-primary/5 to-accent/5",
            "border border-primary/10"
          )}>
            <span className="text-muted-foreground font-medium text-[clamp(8px,1.8vw,10px)]">
              {language === 'ar' ? `الإجمالي (×${quantity})` : `Total (×${quantity})`}
            </span>
            <div className="flex items-center gap-0.5">
              <span className="font-bold text-primary font-mono text-[clamp(10px,2.5vw,14px)]">
                {formatTON(totalTon)}
              </span>
              <TonIcon className="text-primary w-3.5 h-3.5 flex-shrink-0" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

RegularGiftCard.displayName = 'RegularGiftCard';

export default RegularGiftCard;
