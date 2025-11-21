import React, { useMemo } from 'react';
import NFTCard from '@/components/NFTCard';
import ScaledNFTCard from '@/components/ScaledNFTCard';

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
  details: {
    links: string[];
  };
}

interface NFTGridProps {
  nfts: NFTGift[];
}

const NFTGrid: React.FC<NFTGridProps> = ({ nfts }) => {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-lg font-bold text-foreground">NFT Collection</h3>
        <div className="px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full border border-primary/20">
          {nfts.length} items
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4 px-2 justify-items-center">
        {sortedNFTs.map((nft, index) => (
          <div key={`${nft.name}-${nft.model}-${index}-${nft.floor_price}-${nft.avg_price}`}>
            <ScaledNFTCard>
              <NFTCard nft={nft} />
            </ScaledNFTCard>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NFTGrid;
