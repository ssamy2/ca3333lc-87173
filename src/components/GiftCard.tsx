/**
 * ============================================================================
 * NOVA GIFT CARD - Premium Market Card Component
 * Protocol: CODE_DIRECT_REFACTOR_IMAGE_CACHE_2026
 * ============================================================================
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import GiftImage from '@/components/GiftImage';
import TonIcon from '@/components/TonIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface GiftCardProps {
  name: string;
  imageUrl: string;
  shortName?: string;
  price: number;
  change: number;
  isBlackMode: boolean;
  isUnupgraded?: boolean;
  giftId?: string;
  currency?: 'ton' | 'usd';
}

// Get color based on change percentage
const getChangeColor = (change: number): string => {
  if (change === 0) return '#1F2937'; // Neutral
  
  const absChange = Math.abs(change);
  
  if (change > 0) {
    // Green (Up)
    if (absChange > 15) return '#34D399'; // +15%
    if (absChange > 8) return '#10B198';  // 8-15%
    return '#059669'; // 0.1-8%
  } else {
    // Red (Down)
    if (absChange > 15) return '#F87171'; // -15%
    if (absChange > 8) return '#DC2626';  // 8-15%
    return '#99181B'; // 0.1-8%
  }
};

const GiftCard = React.memo(({ 
  name, 
  imageUrl, 
  shortName, 
  price, 
  change, 
  isBlackMode,
  isUnupgraded = false,
  giftId,
  currency = 'ton'
}: GiftCardProps) => {
  const { language } = useLanguage();
  const isPositive = change > 0;
  const isNeutral = change === 0;
  const changeColor = getChangeColor(change);
  
  const isRegularGift = isUnupgraded || name.startsWith('[Regular]');
  const displayName = name.replace('[Regular] ', '');

  const formattedPrice = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);

  const formattedChange = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(change));

  const giftRoute = isRegularGift 
    ? `/regular-gift/${giftId || encodeURIComponent(displayName)}`
    : `/gift/${encodeURIComponent(displayName)}`;

  return (
    <Link 
      to={giftRoute}
      className="no-underline block w-full group"
      style={{ aspectRatio: '1 / 1' }}
    >
      <Card 
        className={cn(
          "relative flex flex-col items-center justify-between h-full w-full overflow-hidden",
          "p-1.5 sm:p-2 md:p-2.5 lg:p-3",
          "backdrop-blur-xl transition-all duration-300 cursor-pointer",
          "hover:-translate-y-0.5 hover:shadow-xl",
          isBlackMode && "bg-[hsl(var(--black-bg))] border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]",
          isRegularGift && "border-warning/30 bg-warning/5"
        )}
        style={!isBlackMode && !isRegularGift ? {
          backgroundColor: changeColor + '15',
          borderColor: changeColor + '40'
        } : undefined}
      >
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent dark:from-white/[0.02] pointer-events-none" />
        
        {/* Regular Gift Badge */}
        {isRegularGift && (
          <div className={cn(
            "absolute top-1 left-1 z-10",
            "bg-warning/10 text-warning/70",
            "text-[6px] sm:text-[7px] font-semibold",
            "rounded-md px-1.5 py-0.5",
            "border border-warning/20"
          )}>
            {language === 'ar' ? 'عادية' : 'Regular'}
          </div>
        )}
        
        {/* Image Container */}
        <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden mb-1">
          <GiftImage
            imageUrl={imageUrl}
            name={displayName}
            shortName={shortName}
            size="responsive"
            isBlackMode={isBlackMode}
            className="w-full h-full max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
            style={isBlackMode ? { filter: 'saturate(0.85)' } : undefined}
          />
        </div>
        
        {/* Price Section */}
        <div className="relative w-full flex flex-col items-center gap-0.5 mt-auto pt-1">
          <div className="flex items-center gap-0.5 sm:gap-1 justify-center">
            {currency === 'usd' ? (
              <span className={cn(
                "font-bold text-[10px] sm:text-xs md:text-sm lg:text-base",
                isBlackMode ? "text-[hsl(var(--black-copper))]" : "",
                isRegularGift && "text-warning"
              )}>$</span>
            ) : (
              <TonIcon className={cn(
                "w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 flex-shrink-0",
                isBlackMode ? "text-[hsl(var(--black-copper))]" : "",
                isRegularGift && "text-warning"
              )} />
            )}
            <span className={cn(
              "font-bold font-mono text-[10px] sm:text-xs md:text-sm lg:text-base leading-tight",
              isBlackMode ? "text-[hsl(var(--black-copper))]" : "",
              isRegularGift ? "text-warning" : "text-foreground"
            )}>
              {formattedPrice}
            </span>
          </div>
          
          {/* Change Indicator */}
          {!isNeutral && (
            <span 
              className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm font-semibold leading-tight"
              style={{ color: changeColor }}
            >
              {isPositive ? '+' : '-'}{formattedChange}%
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
});

GiftCard.displayName = 'GiftCard';

export default GiftCard;
