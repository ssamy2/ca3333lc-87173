/**
 * ============================================================================
 * NOVA NFT CARD - Premium Gift Display Component
 * Protocol: CODE_DIRECT_REFACTOR_IMAGE_CACHE_2026
 * ============================================================================
 */

import React from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import TonIcon from './TonIcon';
import { cn } from '@/lib/utils';
import { imageCache } from '@/services/imageCache';

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
  const [cachedImage, setCachedImage] = React.useState<string | null>(null);
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
    // Don't set crossOrigin for Google Storage images to avoid CORS issues
    // The canvas will be "tainted" but we only need to display, not export
    
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      // Redraw canvas with image
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) {
          // Redraw gradient first
          const gradient = ctx.createRadialGradient(
            size / 2, size / 2, 0,
            size / 2, size / 2, size / 2
          );
          if (nft.colors) {
            gradient.addColorStop(0, nft.colors.center);
            gradient.addColorStop(0.7, nft.colors.edge);
            gradient.addColorStop(1, nft.colors.symbol);
          } else {
            gradient.addColorStop(0, '#1a2332');
            gradient.addColorStop(1, '#0f1419');
          }
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, size, size);
          // Draw image
          drawImageOnCanvas(ctx, img, size);
        }
      }
    };

    img.onerror = () => {
      console.error('Failed to load image:', nft.image);
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
      className={cn(
        "group relative flex flex-col overflow-hidden cursor-pointer w-full h-full",
        "bg-card/80 dark:bg-card/60 backdrop-blur-xl",
        "rounded-2xl border border-border/30 dark:border-border/20",
        "shadow-lg shadow-black/5 dark:shadow-black/30",
        "hover:shadow-xl hover:shadow-primary/10 dark:hover:shadow-primary/20",
        "hover:border-primary/30 dark:hover:border-primary/40",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1"
      )}
      onClick={handleCardClick}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/[0.02] pointer-events-none" />
      
      {/* Quantity Badge */}
      {nft.count > 1 && (
        <div className={cn(
          "absolute top-2 right-2 z-20",
          "bg-gradient-to-br from-primary to-accent",
          "text-primary-foreground text-xs font-bold",
          "rounded-full min-w-[26px] h-[26px] px-2",
          "flex items-center justify-center",
          "shadow-lg shadow-primary/30 border border-white/20",
          "animate-bounce-in"
        )}>
          {nft.count}
        </div>
      )}

      {/* NFT Image - Square 1:1 with backdrop */}
      <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        {isVisible && nft.image && !imageError ? (
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain"
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">NFT Gift</p>
          </div>
        )}
        
        {/* Image overlay gradient */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/80 to-transparent pointer-events-none" />
      </div>

      {/* Content Section */}
      <div className="relative flex flex-col p-3 gap-2 flex-1 overflow-hidden">
        {/* Title with ID */}
        <h3 className="font-bold leading-tight text-foreground group-hover:text-primary transition-colors duration-200 text-[clamp(10px,2.5vw,14px)]">
          {nft.title || nft.name}
          {nft.quantity_raw && (
            <span className="text-muted-foreground font-normal ml-1">{nft.quantity_raw}</span>
          )}
        </h3>
        
        {/* Model and Rarity */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-muted-foreground font-medium text-[clamp(8px,1.8vw,11px)]">Model:</span>
            <span className="font-semibold text-foreground text-[clamp(8px,1.8vw,11px)]">{nft.model}</span>
            {nft.model_rarity != null && typeof nft.model_rarity !== 'object' && (
              <span className="text-purple-400 dark:text-purple-300 font-medium bg-purple-500/10 px-1.5 py-0.5 rounded-md text-[clamp(7px,1.5vw,10px)]">
                {String(nft.model_rarity)}‰
              </span>
            )}
          </div>
          
          {/* Backdrop */}
          {nft.backdrop && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-muted-foreground font-medium text-[clamp(8px,1.8vw,11px)]">BG:</span>
              <span className="font-semibold text-amber-500 dark:text-amber-400 text-[clamp(8px,1.8vw,11px)]">{nft.backdrop}</span>
            </div>
          )}
          
          {/* Symbol */}
          {nft.symbol && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-muted-foreground text-[clamp(8px,1.8vw,11px)]">Symbol:</span>
              <span className="font-semibold text-primary text-[clamp(8px,1.8vw,11px)]">{nft.symbol}</span>
              {nft.symbol_rarity != null && typeof nft.symbol_rarity !== 'object' && (
                <span className="text-cyan-500 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded-md border border-cyan-500/20 text-[clamp(7px,1.5vw,9px)]">
                  {String(nft.symbol_rarity)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Floor Price Section */}
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-border/30">
          <span className="text-muted-foreground font-medium text-[clamp(8px,1.8vw,11px)]">Floor</span>
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1.5 rounded-lg",
            "bg-primary/10 dark:bg-primary/20",
            "border border-primary/20"
          )}>
            {nft.floor_price === 0 ? (
              <span className="font-bold text-warning text-[clamp(8px,1.8vw,11px)]">
                Presale
              </span>
            ) : (
              <>
                <span className="font-bold text-foreground font-mono text-[clamp(9px,2.2vw,14px)]">
                  {formatTON(nft.floor_price)}
                </span>
                <TonIcon className="text-primary w-3.5 h-3.5 flex-shrink-0" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* View in Store Footer */}
      {(nft.tg_deeplink || (nft.details && nft.details.links && nft.details.links.length > 0)) && (
        <div className={cn(
          "flex items-center justify-center py-2 px-3",
          "border-t border-border/20",
          "bg-muted/30 dark:bg-muted/10"
        )}>
          <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors text-[clamp(7px,1.5vw,10px)]">
            <ExternalLink className="w-3 h-3" />
            <span className="font-medium">View in Store</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTCard;
