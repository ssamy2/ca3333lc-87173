import React, { useMemo } from 'react';
import NFTCard from '@/components/NFTCard';
import type { NFTGift } from '@/hooks/useNFTSearch';

interface NFTGridProps {
  nfts: NFTGift[];
}

const sortNFTsByPrice = (nfts: NFTGift[]) => {
  return [...nfts].sort((a, b) => {
    const priceA = a.floor_price * a.count;
    const priceB = b.floor_price * b.count;

    if (priceA === 0 && priceB !== 0) return 1;
    if (priceA !== 0 && priceB === 0) return -1;
    if (priceA === 0 && priceB === 0) return 0;

    return priceB - priceA;
  });
};

export const NFTGrid = React.memo(({ nfts }: NFTGridProps) => {
  const sortedNFTs = useMemo(() => sortNFTsByPrice(nfts), [nfts]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {sortedNFTs.map((nft, index) => (
        <NFTCard key={`${nft.name}-${index}`} nft={nft} />
      ))}
    </div>
  );
});

NFTGrid.displayName = 'NFTGrid';
