import React, { useMemo } from 'react';
import NFTCard from '@/components/NFTCard';
import RegularGiftCard from '@/components/RegularGiftCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/i18n/translations';

interface NFTGift {
  count: number;
  name: string;
  model: string;
  floor_price: number;
  avg_price: number;
  image?: string;
  title?: string;
  backdrop?: string;
  backdrop_rarity?: string;
  symbol?: string;
  symbol_rarity?: string;
  model_rarity?: string;
  quantity_issued?: number;
  quantity_total?: number;
  quantity_raw?: string;
  description?: string;
  tg_deeplink?: string;
  details?: {
    links?: string[];
  };
}

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

interface NFTGridProps {
  nfts: NFTGift[];
  regularGifts?: RegularGift[];
}

const NFTGrid: React.FC<NFTGridProps> = ({ nfts, regularGifts = [] }) => {
  const { language } = useLanguage();
  const t = (key: keyof typeof import('@/i18n/translations').translations.en) => 
    getTranslation(language, key);

  // Sort NFTs by price (memoized to prevent re-sorting on every render)
  const sortedNFTs = useMemo(() => {
    return [...nfts].sort((a, b) => {
      const priceA = a.floor_price * a.count;
      const priceB = b.floor_price * b.count;
      
      // الهدايا اللي سعرها 0 تروح للآخر
      if (priceA === 0 && priceB !== 0) return 1;
      if (priceA !== 0 && priceB === 0) return -1;
      if (priceA === 0 && priceB === 0) return 0;
      
      // الترتيب من الأغلى للأرخص
      return priceB - priceA;
    });
  }, [nfts]);

  // Sort regular gifts by total value
  const sortedRegularGifts = useMemo(() => {
    return [...regularGifts].sort((a, b) => {
      const priceA = a.total_ton;
      const priceB = b.total_ton;
      
      if (priceA === 0 && priceB !== 0) return 1;
      if (priceA !== 0 && priceB === 0) return -1;
      if (priceA === 0 && priceB === 0) return 0;
      
      return priceB - priceA;
    });
  }, [regularGifts]);

  return (
    <div className="space-y-6">
      {/* NFT Collection */}
      {nfts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-foreground">NFT Collection</h3>
            <div className="px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full border border-primary/20">
              {nfts.length} items
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4 px-2">
            {sortedNFTs.map((nft, index) => (
              <NFTCard 
                key={`${nft.name}-${nft.model}-${index}-${nft.floor_price}-${nft.avg_price}`} 
                nft={nft} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Gifts Section */}
      {sortedRegularGifts.length > 0 && (
        <div className="space-y-4">
          {/* Separator */}
          <div className="flex items-center gap-3 px-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
            <span className="text-amber-400 text-sm font-medium px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
              {language === 'ar' ? 'غير مطورة' : 'Not Upgraded'}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
          </div>

          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-amber-400">{language === 'ar' ? 'الهدايا العادية' : 'Regular Gifts'}</h3>
            <div className="px-3 py-1 bg-amber-500/10 text-amber-400 text-sm font-semibold rounded-full border border-amber-500/20">
              {sortedRegularGifts.reduce((sum, g) => sum + g.count, 0)} items
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4 px-2">
            {sortedRegularGifts.map((gift, index) => (
              <RegularGiftCard 
                key={`regular-${gift.id}-${index}`} 
                gift={gift} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTGrid;
