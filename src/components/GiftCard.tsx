import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import GiftImage from '@/components/GiftImage';
import TonIcon from '@/components/TonIcon';

interface GiftCardProps {
  name: string;
  imageUrl: string;
  shortName?: string;
  price: number;
  change: number;
  isBlackMode: boolean;
}

const GiftCard = React.memo(({ 
  name, 
  imageUrl, 
  shortName, 
  price, 
  change, 
  isBlackMode 
}: GiftCardProps) => {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  const formattedPrice = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);

  const formattedChange = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(change));

  const getCardStyle = () => {
    if (isBlackMode) {
      return 'bg-[#0B0B0D] border border-white/[0.02] shadow-[0_6px_18px_rgba(91,46,221,0.12),0_4px_12px_rgba(0,0,0,0.45),inset_0_2px_6px_rgba(91,46,221,0.04)]';
    }
    if (isNeutral) {
      return 'bg-secondary/80 hover:shadow-lg hover:shadow-muted/20';
    }
    if (isPositive) {
      return 'bg-[hsl(var(--success))]/20 hover:shadow-lg hover:shadow-[hsl(var(--success))]/30 border-[hsl(var(--success))]/30';
    }
    return 'bg-[hsl(var(--destructive))]/20 hover:shadow-lg hover:shadow-[hsl(var(--destructive))]/30 border-[hsl(var(--destructive))]/30';
  };

  return (
    <Link 
      to={`/gift/${encodeURIComponent(name)}`}
      className="no-underline block w-full"
      style={{ aspectRatio: '1 / 1' }}
    >
      <Card
        className={`p-1.5 sm:p-2 md:p-2.5 lg:p-3 flex flex-col items-center justify-between backdrop-blur transition-shadow duration-200 cursor-pointer h-full w-full ${getCardStyle()}`}
      >
        <div className="w-full flex-1 flex items-center justify-center overflow-hidden mb-1">
          <GiftImage
            imageUrl={imageUrl}
            name={name}
            shortName={shortName}
            size="responsive"
            isBlackMode={isBlackMode}
            className="w-full h-full max-w-full max-h-full object-contain"
            style={isBlackMode ? { filter: 'saturate(0.8)' } : undefined}
          />
        </div>
        <div className="w-full flex flex-col items-center gap-0.5 mt-auto pt-1">
          <div className="flex items-center gap-0.5 sm:gap-1 justify-center">
            <TonIcon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 flex-shrink-0 ${isBlackMode ? 'opacity-90' : ''}`} />
            <span 
              className={`font-semibold text-[10px] sm:text-xs md:text-sm lg:text-base leading-tight ${isBlackMode ? 'text-[#B87333]' : 'text-foreground'}`}
            >
              {formattedPrice}
            </span>
          </div>
          {!isNeutral && (
            <span
              className={`text-[8px] sm:text-[10px] md:text-xs lg:text-sm font-medium leading-tight ${
                isPositive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'
              }`}
            >
              {isPositive ? '+' : '-'}
              {formattedChange}%
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
});

GiftCard.displayName = 'GiftCard';

export default GiftCard;
