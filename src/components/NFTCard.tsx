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
  colors?: {
    center: string;
    edge: string;
    symbol: string;
    text: string;
  } | null;
  details?: {
    links?: string[];
  };
}

interface NFTCardProps {
  nft: NFTGift;
}

const NFTCard: React.FC<NFTCardProps> = ({ nft }) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);

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

  const handleCardClick = () => {
    if (nft.tg_deeplink) {
      window.open(nft.tg_deeplink, '_blank');
    } else if (nft.details && nft.details.links && nft.details.links.length > 0) {
      window.open(nft.details.links[0], '_blank');
    }
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  // Draw backdrop and image on canvas - optimized for mobile
  React.useEffect(() => {
    // Only load when visible
    if (!isVisible || !nft.image || imageError) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Use smaller size for mobile devices (saves ~16x memory vs 1024)
    const isMobile = window.innerWidth < 768;
    const size = isMobile ? 256 : 384;
    
    // Only resize if needed
    if (canvas.width !== size) {
      canvas.width = size;
      canvas.height = size;
    }

    // Draw backdrop gradient using colors from API
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    
    if (nft.colors) {
      // Use colors from API response
      gradient.addColorStop(0, nft.colors.center);
      gradient.addColorStop(0.7, nft.colors.edge);
      gradient.addColorStop(1, nft.colors.symbol);
    } else {
      // Fallback colors
      gradient.addColorStop(0, '#1a2332');
      gradient.addColorStop(1, '#0f1419');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Load and draw image (only once)
    if (imageRef.current) {
      // Image already loaded, just draw it
      drawImageOnCanvas(ctx, imageRef.current, size);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      drawImageOnCanvas(ctx, img, size);
    };

    img.onerror = () => {
      setImageError(true);
    };

    // Use image URL directly from API (Google Storage)
    img.src = nft.image;

    // Cleanup on unmount
    return () => {
      imageRef.current = null;
    };
  }, [isVisible, nft.image, nft.backdrop, imageError]);

  // Helper function to draw image on canvas
  const drawImageOnCanvas = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, size: number) => {
    const scale = Math.min(size / img.width, size / img.height) * 0.85;
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const x = (size - scaledWidth) / 2;
    const y = (size - scaledHeight) / 2;
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
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
      ref={cardRef}
      className="group relative flex flex-col bg-gradient-to-br from-[#0f1419] to-[#1a1f2e] rounded-xl border border-white/5 hover:border-white/10 overflow-hidden cursor-pointer transition-colors duration-200 w-full"
      style={{ aspectRatio: '1/1.99' }}
      onClick={handleCardClick}
    >
      {/* Quantity Badge */}
      {nft.count > 1 && (
        <div className="absolute top-2 right-2 bg-gradient-to-br from-[#0098EA] to-[#0077BA] text-white text-xs font-bold rounded-full min-w-[24px] h-6 px-2 flex items-center justify-center z-20 shadow-lg border border-white/10 animate-bounce-in">
          {nft.count}
        </div>
      )}

      {/* NFT Image - Square 1:1 with backdrop */}
      <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-[#0098EA]/5 to-[#8B5CF6]/5">
        {isVisible && nft.image && !imageError ? (
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain"
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#0098EA]/10 to-[#8B5CF6]/10 flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-[#0098EA]/20 border-t-[#0098EA] rounded-full"></div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-10 h-10 bg-[#0098EA]/10 rounded-full flex items-center justify-center mb-1">
              <TonIcon className="w-5 h-5 text-[#0098EA]" />
            </div>
            <p className="text-xs text-gray-400 font-medium">NFT Gift</p>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col p-3 gap-2 flex-1 overflow-hidden">
        {/* Title with ID */}
        <h3 
          className="font-bold leading-tight text-white group-hover:text-[#0098EA] transition-colors"
          style={{ fontSize: 'clamp(9px, 2.5vw, 14px)' }}
        >
          {nft.title || nft.name} <span className="text-gray-400 font-normal">{nft.quantity_raw}</span>
        </h3>
        
        {/* Model and Rarity */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-gray-400 font-medium flex-shrink-0" style={{ fontSize: 'clamp(7px, 1.8vw, 11px)' }}>Model:</span>
            <span className="font-semibold text-white" style={{ fontSize: 'clamp(7px, 1.8vw, 11px)' }}>{nft.model}</span>
            {nft.model_rarity && (
              <span className="text-purple-400 font-medium flex-shrink-0" style={{ fontSize: 'clamp(6px, 1.5vw, 10px)' }}>
                ({nft.model_rarity})
              </span>
            )}
          </div>
          
          {/* Backdrop */}
          {nft.backdrop && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-gray-400 font-medium flex-shrink-0" style={{ fontSize: 'clamp(7px, 1.8vw, 11px)' }}>BG:</span>
              <span className="font-semibold text-amber-300" style={{ fontSize: 'clamp(7px, 1.8vw, 11px)' }}>{nft.backdrop}</span>
            </div>
          )}
          
          {/* Symbol */}
          {nft.symbol && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-gray-400 flex-shrink-0" style={{ fontSize: 'clamp(7px, 1.8vw, 11px)' }}>Symbol:</span>
              <span className="font-semibold text-[#0098EA]" style={{ fontSize: 'clamp(7px, 1.8vw, 11px)' }}>{nft.symbol}</span>
              {nft.symbol_rarity && (
                <span className="text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded border border-cyan-500/20 flex-shrink-0" style={{ fontSize: 'clamp(6px, 1.5vw, 9px)' }}>
                  {nft.symbol_rarity}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Floor Price Section */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <span className="text-gray-400 font-medium" style={{ fontSize: 'clamp(7px, 1.8vw, 11px)' }}>Floor Price</span>
          <div className="flex items-center gap-0.5 bg-black/30 px-2 py-1 rounded-md border border-white/10">
            {nft.floor_price === 0 ? (
              <span className="font-bold text-yellow-400" style={{ fontSize: 'clamp(7px, 1.8vw, 11px)' }}>
                Presale
              </span>
            ) : (
              <>
                <span className="font-bold text-white" style={{ fontSize: 'clamp(8px, 2.2vw, 14px)' }}>{formatTON(nft.floor_price)}</span>
                <TonIcon className="text-[#0098EA] flex-shrink-0" style={{ width: 'clamp(8px, 1.8vw, 11px)', height: 'clamp(8px, 1.8vw, 11px)' }} />
              </>
            )}
          </div>
        </div>

      </div>

      {/* View in Store - Very Small Footer */}
      {(nft.tg_deeplink || (nft.details && nft.details.links && nft.details.links.length > 0)) && (
        <div className="flex items-center justify-center py-1 px-2 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-0.5 text-gray-500 group-hover:text-[#0098EA] transition-colors" style={{ fontSize: 'clamp(6px, 1.5vw, 9px)' }}>
            <ExternalLink style={{ width: 'clamp(8px, 1.5vw, 11px)', height: 'clamp(8px, 1.5vw, 11px)' }} />
            <span className="font-medium">View in Store</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTCard;
