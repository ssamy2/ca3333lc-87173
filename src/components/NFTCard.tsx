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
    if (!nft.price_change_percent) return 'from-muted/30 to-muted/10';
    if (nft.price_change_percent > 0) return 'from-green-500/20 to-green-500/5';
    if (nft.price_change_percent < 0) return 'from-red-500/20 to-red-500/5';
    return 'from-muted/30 to-muted/10';
  };

  // Get text color for price change
  const getChangeColor = () => {
    if (!nft.price_change_percent) return 'text-muted-foreground';
    if (nft.price_change_percent > 0) return 'text-green-500';
    if (nft.price_change_percent < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <div 
      className={`telegram-card p-4 cursor-pointer group relative animate-fade-in hover-scale transition-all duration-300 bg-gradient-to-br ${getBackgroundColor()}`}
      onClick={handleCardClick}
    >
      {/* Quantity Badge */}
      {nft.count > 1 && (
        <div className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center z-10 shadow-lg animate-bounce-in">
          {nft.count}
        </div>
      )}

      {/* Single NFT Image Layout */}
      <div className="mb-3">
        <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center border border-border/50 overflow-hidden relative">
          {nft.image && !imageError ? (
            <>
              <img 
                src={nft.image}
                alt={`${nft.name} NFT`}
                className="w-full h-full object-cover rounded-xl"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
              {imageLoading && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full"></div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-4">
              <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
                <TonIcon className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">NFT Gift</p>
            </div>
          )}
        </div>
      </div>

      {/* NFT Info */}
      <div className="space-y-2">
        <h3 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {nft.title || nft.name}
        </h3>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md truncate flex-1 mr-2">
              {nft.model}
            </p>
            {nft.count > 1 && (
              <span className="text-xs font-bold text-accent">×{nft.count}</span>
            )}
          </div>
          
          {/* Additional info chips */}
          <div className="flex flex-wrap gap-1">
            {nft.backdrop && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                {nft.backdrop}
              </span>
            )}
            {nft.symbol && (
              <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                {nft.symbol}
              </span>
            )}
          </div>
        </div>

        {/* Price Info */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1 mb-2">
            <TonIcon className="w-4 h-4 text-[#0098EA]" />
            <span className="text-lg font-bold">{formatTON(nft.floor_price)}</span>
          </div>
          
          {/* Price Change Percentage */}
          {nft.price_change_percent !== undefined && (
            <div className={`text-center text-sm font-semibold ${getChangeColor()}`}>
              {nft.price_change_percent > 0 ? '+' : ''}{nft.price_change_percent.toFixed(2)}%
            </div>
          )}
        </div>

        {/* View in Store Indicator */}
        {(nft.tg_deeplink || (nft.details.links && nft.details.links.length > 0)) && (
          <div className="flex items-center justify-center pt-2 border-t border-border/30">
            <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
              <ExternalLink className="w-3 h-3" />
              <span>View in Store</span>
            </div>
          </div>
        )}
        
        {/* Quantity info */}
        {nft.quantity_raw && (
          <div className="pt-1">
            <p className="text-[10px] text-muted-foreground text-center">
              {nft.quantity_raw}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTCard;