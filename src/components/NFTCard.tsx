import React from 'react';
import { ExternalLink } from 'lucide-react';
import TonIcon from './TonIcon';

interface NFTGift {
  count: number;
  name: string;
  model: string;
  floor_price: number;
  avg_price: number;
  price_change_percent?: number;
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

interface NFTCardProps {
  nft: NFTGift;
}

const NFTCard: React.FC<NFTCardProps> = ({ nft }) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);

  const formatTON = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleCardClick = () => {
    if (nft.tg_deeplink) {
      window.open(nft.tg_deeplink, '_blank');
    } else if (nft.details.links && nft.details.links.length > 0) {
      window.open(nft.details.links[0], '_blank');
    }
  };

  const handleImageError = (e: any) => {
    console.error('❌ Image failed to load:', nft.image, 'Error:', e);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully:', nft.image);
    setImageLoading(false);
  };

  // Get background color based on price change
  const getBackgroundColor = () => {
    if (!nft.price_change_percent) return 'bg-[#1a2332]';
    if (nft.price_change_percent > 0) return 'bg-gradient-to-br from-green-900/40 to-green-950/60';
    if (nft.price_change_percent < 0) return 'bg-gradient-to-br from-red-900/40 to-red-950/60';
    return 'bg-[#1a2332]';
  };

  // Get text color for price change
  const getChangeColor = () => {
    if (!nft.price_change_percent) return 'text-gray-400';
    if (nft.price_change_percent > 0) return 'text-green-400';
    if (nft.price_change_percent < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div 
      className={`${getBackgroundColor()} rounded-2xl p-3 cursor-pointer transition-all duration-300 hover:scale-105 relative flex flex-col items-center`}
      onClick={handleCardClick}
    >
      {/* NFT Image */}
      <div className="w-full aspect-square mb-3 flex items-center justify-center">
        {nft.image && !imageError ? (
          <>
            <img 
              src={nft.image}
              alt={`${nft.name} NFT`}
              className="w-full h-full object-contain"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full"></div>
              </div>
            )}
          </>
        ) : (
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <TonIcon className="w-8 h-8 text-primary" />
          </div>
        )}
      </div>

      {/* Price Section */}
      <div className="w-full flex flex-col items-center space-y-1">
        {/* TON Price */}
        <div className="flex items-center gap-1">
          <TonIcon className="w-4 h-4 text-[#0098EA]" />
          <span className="text-xl font-bold text-white">{formatTON(nft.floor_price)}</span>
        </div>
        
        {/* Price Change Percentage */}
        {nft.price_change_percent !== undefined && (
          <div className={`text-sm font-semibold ${getChangeColor()}`}>
            {nft.price_change_percent > 0 ? '+' : ''}{nft.price_change_percent.toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTCard;