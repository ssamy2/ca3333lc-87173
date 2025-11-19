import React from 'react';
import { ExternalLink } from 'lucide-react';
import TonIcon from './TonIcon';
import { proxyImageUrl } from '@/lib/imageProxy';

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
      className="group relative flex flex-col min-w-[160px] max-w-[220px] w-full bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] rounded-xl border border-white/5 hover:border-white/10 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02] animate-fade-in"
      onClick={handleCardClick}
    >
      {/* Quantity Badge */}
      {nft.count > 1 && (
        <div className="absolute top-2 right-2 bg-gradient-to-br from-[#0098EA] to-[#0077BA] text-white text-xs font-bold rounded-full min-w-[24px] h-6 px-2 flex items-center justify-center z-20 shadow-lg border border-white/10 animate-bounce-in">
          {nft.count}
        </div>
      )}

      {/* NFT Image - Square 1:1 with no excess space */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-[#0098EA]/5 to-[#8B5CF6]/5 overflow-hidden">
        {nft.image && !imageError ? (
          <>
            <img 
              src={proxyImageUrl(nft.image)}
              alt={`${nft.name} NFT`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
            {imageLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#0098EA]/10 to-[#8B5CF6]/10 flex items-center justify-center backdrop-blur-sm">
                <div className="animate-spin w-8 h-8 border-3 border-[#0098EA]/20 border-t-[#0098EA] rounded-full"></div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-[#0098EA]/10 rounded-full flex items-center justify-center mb-2">
              <TonIcon className="w-6 h-6 text-[#0098EA]" />
            </div>
            <p className="text-xs text-gray-400 font-medium">NFT Gift</p>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col p-3 gap-2 flex-1">
        {/* Title - Line clamp 2 only */}
        <h3 className="font-bold text-sm leading-snug text-white group-hover:text-[#0098EA] transition-colors line-clamp-2 min-h-[2.5rem]">
          {nft.title || nft.name}
        </h3>
        
        {/* Badges Section - Model, Rarity, Symbol, Backdrop */}
        <div className="flex flex-wrap gap-1.5 min-h-[2rem] items-start">
          {/* Model Badge */}
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#1a1f2e] border border-white/5 text-[10px] font-medium text-gray-300 leading-none">
            {nft.model}
          </span>
          
          {/* Model Rarity Badge */}
          {nft.model_rarity && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-[10px] font-medium text-purple-300 leading-none">
              {nft.model_rarity}
            </span>
          )}
          
          {/* Symbol Badge */}
          {nft.symbol && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gradient-to-r from-[#0098EA]/10 to-cyan-500/10 border border-[#0098EA]/20 text-[10px] font-medium text-[#0098EA] leading-none">
              {nft.symbol}
            </span>
          )}
          
          {/* Backdrop Badge */}
          {nft.backdrop && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-[10px] font-medium text-amber-300 leading-none">
              {nft.backdrop}
            </span>
          )}
        </div>

        {/* Floor Price Section */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-xs text-gray-400 font-medium">Floor Price</span>
          <div className="flex items-center gap-1.5">
            {nft.floor_price === 0 ? (
              <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-md border border-yellow-400/20">
                Presale
              </span>
            ) : (
              <>
                <TonIcon className="w-3.5 h-3.5 text-[#0098EA] flex-shrink-0" />
                <span className="text-sm font-bold text-white">{formatTON(nft.floor_price)}</span>
              </>
            )}
          </div>
        </div>

        {/* Quantity Info */}
        {nft.quantity_raw && (
          <div className="text-[10px] text-gray-500 text-center">
            {nft.quantity_raw}
          </div>
        )}
      </div>

      {/* View in Store - Very Small Footer */}
      {(nft.tg_deeplink || (nft.details.links && nft.details.links.length > 0)) && (
        <div className="flex items-center justify-center py-1.5 px-3 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-1 text-[10px] text-gray-500 group-hover:text-[#0098EA] transition-colors">
            <ExternalLink className="w-2.5 h-2.5" />
            <span className="font-medium">View in Store</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTCard;