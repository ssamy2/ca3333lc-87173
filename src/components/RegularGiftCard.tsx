import React from 'react';
import { Link } from 'react-router-dom';
import TonIcon from './TonIcon';
import { useLanguage } from '@/contexts/LanguageContext';

interface RegularGift {
  id: string;
  name: string;
  short_name?: string;
  image: string;
  count: number;
  price_ton: number;
  price_usd: number;
  total_ton: number;
  total_usd: number;
  supply: number;
  multiplier?: string;
  change_24h?: number;
  is_unupgraded: boolean;
}

interface RegularGiftCardProps {
  gift: RegularGift;
}

const RegularGiftCard: React.FC<RegularGiftCardProps> = ({ gift }) => {
  const { language } = useLanguage();
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const cardRef = React.useRef<HTMLAnchorElement>(null);

  // Intersection Observer for lazy loading
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const formatTON = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatSupply = (supply: number) => {
    if (supply >= 1000000) return `${(supply / 1000000).toFixed(1)}M`;
    if (supply >= 1000) return `${(supply / 1000).toFixed(0)}K`;
    return supply.toString();
  };

  return (
    <Link 
      to={`/regular-gift/${encodeURIComponent(gift.name)}`}
      ref={cardRef}
      className="group relative flex flex-col bg-gradient-to-br from-amber-950/20 to-amber-900/10 rounded-xl border border-amber-500/20 hover:border-amber-500/40 overflow-hidden transition-colors duration-200 w-full h-full cursor-pointer no-underline"
    >
      {/* Count Badge */}
      {gift.count > 1 && (
        <div className="absolute top-2 right-2 bg-gradient-to-br from-amber-500 to-amber-600 text-white text-xs font-bold rounded-full min-w-[24px] h-6 px-2 flex items-center justify-center z-20 shadow-lg border border-amber-400/30">
          x{gift.count}
        </div>
      )}

      {/* Not Upgraded Badge */}
      <div className="absolute top-2 left-2 bg-amber-500/20 text-amber-400 text-[8px] font-medium rounded px-1.5 py-0.5 z-20 border border-amber-500/30">
        {language === 'ar' ? 'عادية' : 'Regular'}
      </div>

      {/* Gift Image */}
      <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-amber-500/5 to-amber-600/5">
        {isVisible && gift.image && !imageError ? (
          <>
            <img
              src={gift.image}
              alt={gift.name}
              className={`w-full h-full object-contain p-4 transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-600/10 flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-amber-500/20 border-t-amber-500 rounded-full"></div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center mb-1">
              <TonIcon className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-xs text-amber-400/60 font-medium">Gift</p>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col p-3 gap-2 flex-1 overflow-hidden">
        {/* Title */}
        <h3 
          className="font-bold leading-tight text-amber-100 group-hover:text-amber-400 transition-colors"
          style={{ fontSize: 'clamp(9px, 2.5vw, 14px)' }}
        >
          {gift.name}
        </h3>
        
        {/* Supply */}
        <div className="flex items-center gap-1">
          <span className="text-amber-400/60 font-medium" style={{ fontSize: 'clamp(7px, 1.8vw, 11px)' }}>
            {language === 'ar' ? 'الكمية:' : 'Supply:'}
          </span>
          <span className="font-semibold text-amber-300" style={{ fontSize: 'clamp(7px, 1.8vw, 11px)' }}>
            {formatSupply(gift.supply)}
          </span>
        </div>

        {/* Multiplier */}
        {gift.multiplier && (
          <div className="flex items-center gap-1">
            <span className="text-amber-400/60 font-medium" style={{ fontSize: 'clamp(7px, 1.8vw, 11px)' }}>
              {language === 'ar' ? 'المضاعف:' : 'Multiplier:'}
            </span>
            <span className="font-semibold text-green-400" style={{ fontSize: 'clamp(7px, 1.8vw, 11px)' }}>
              {gift.multiplier}
            </span>
          </div>
        )}

        {/* Price Section */}
        <div className="flex items-center justify-between pt-1 border-t border-amber-500/10">
          <span className="text-amber-400/60 font-medium" style={{ fontSize: 'clamp(7px, 1.8vw, 11px)' }}>
            {language === 'ar' ? 'السعر' : 'Price'}
          </span>
          <div className="flex items-center gap-0.5 bg-black/30 px-2 py-1 rounded-md border border-amber-500/20">
            {gift.price_ton === 0 ? (
              <span className="font-bold text-amber-400/60" style={{ fontSize: 'clamp(7px, 1.8vw, 11px)' }}>
                N/A
              </span>
            ) : (
              <>
                <span className="font-bold text-amber-100" style={{ fontSize: 'clamp(8px, 2.2vw, 14px)' }}>{formatTON(gift.price_ton)}</span>
                <TonIcon className="text-amber-500 flex-shrink-0" style={{ width: 'clamp(8px, 1.8vw, 11px)', height: 'clamp(8px, 1.8vw, 11px)' }} />
              </>
            )}
          </div>
        </div>

        {/* Total Price (only if count > 1) */}
        {gift.count > 1 && gift.total_ton > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-amber-400/60 font-medium" style={{ fontSize: 'clamp(7px, 1.8vw, 11px)' }}>
              {language === 'ar' ? 'الإجمالي' : 'Total'}
            </span>
            <div className="flex items-center gap-0.5 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
              <span className="font-bold text-amber-400" style={{ fontSize: 'clamp(8px, 2.2vw, 14px)' }}>{formatTON(gift.total_ton)}</span>
              <TonIcon className="text-amber-500 flex-shrink-0" style={{ width: 'clamp(8px, 1.8vw, 11px)', height: 'clamp(8px, 1.8vw, 11px)' }} />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default RegularGiftCard;
