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
  const isPositive = change >= 0;
  const isNeutral = change === 0;

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
      className="no-underline block"
      style={{ aspectRatio: '1 / 1' }}
    >
      <Card
        className={`p-2 sm:p-2.5 md:p-3 flex flex-col items-center justify-between backdrop-blur transition-shadow duration-200 cursor-pointer h-full w-full ${getCardStyle()}`}
      >
        <div className="w-full flex-1 flex items-center justify-center min-h-0 mb-2">
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
        <div className="w-full flex flex-col items-center gap-0.5 mt-1">
          <div className="flex items-center gap-1 justify-center">
            <TonIcon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0 ${isBlackMode ? 'opacity-90' : ''}`} />
            <span 
              className={`font-semibold text-xs sm:text-sm md:text-base leading-tight ${isBlackMode ? 'text-[#B87333] font-[600]' : 'text-foreground'}`}
            >
              {price.toFixed(2)}
            </span>
          </div>
          {!isNeutral && (
            <span
              className={`text-[10px] sm:text-xs md:text-sm font-medium leading-tight ${
                isPositive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'
              }`}
            >
              {isPositive ? '+' : ''}
              {change.toFixed(2)}%
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
});

GiftCard.displayName = 'GiftCard';

export default GiftCard;
