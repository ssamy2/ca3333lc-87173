/**
 * CryptoGiftCard - Premium Gift-style Crypto Display
 * @novachartsbot - Crypto Gift Center
 */

import React, { memo, useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CryptoMarketData, formatPrice, formatMarketCap, formatPercentage } from '@/services/cryptoService';

interface CryptoGiftCardProps {
  coin: CryptoMarketData;
  onClick?: (coin: CryptoMarketData) => void;
  isSelected?: boolean;
}

// Mini sparkline component
const MiniSparkline: React.FC<{ data: number[]; isPositive: boolean }> = memo(({ data, isPositive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 2;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Calculate points
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => ({
      x: padding + (index / (data.length - 1)) * (width - padding * 2),
      y: height - padding - ((value - min) / range) * (height - padding * 2)
    }));

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (isPositive) {
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
      gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, height);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = isPositive ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [data, isPositive]);

  return (
    <canvas
      ref={canvasRef}
      width={80}
      height={32}
      className="w-20 h-8"
    />
  );
});

MiniSparkline.displayName = 'MiniSparkline';

const CryptoGiftCard: React.FC<CryptoGiftCardProps> = memo(({ coin, onClick, isSelected }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
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

  const priceChange = coin.price_change_percentage_24h || 0;
  const isPositive = priceChange >= 0;
  const TrendIcon = isPositive ? TrendingUp : priceChange < 0 ? TrendingDown : Minus;

  const imageSrc = coin.image_base64 || coin.image;

  return (
    <div
      ref={cardRef}
      onClick={() => onClick?.(coin)}
      className={cn(
        "group relative flex flex-col overflow-hidden cursor-pointer w-full",
        "bg-card/80 dark:bg-card/60 backdrop-blur-xl",
        "rounded-2xl border",
        isSelected 
          ? "border-primary shadow-lg shadow-primary/20" 
          : "border-border/30 dark:border-border/20",
        "shadow-lg shadow-black/5 dark:shadow-black/30",
        "hover:shadow-xl hover:shadow-primary/10 dark:hover:shadow-primary/20",
        "hover:border-primary/30 dark:hover:border-primary/40",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1"
      )}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/[0.02] pointer-events-none" />
      
      {/* Rank Badge */}
      <div className={cn(
        "absolute top-2 left-2 z-20",
        "bg-gradient-to-br from-primary/80 to-accent/80",
        "text-primary-foreground text-[10px] font-bold",
        "rounded-full min-w-[22px] h-[22px] px-1.5",
        "flex items-center justify-center",
        "shadow-md shadow-primary/20 border border-white/20"
      )}>
        #{coin.market_cap_rank}
      </div>

      {/* Price Change Badge */}
      <div className={cn(
        "absolute top-2 right-2 z-20",
        "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md",
        "text-[9px] font-semibold",
        isPositive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
      )}>
        <TrendIcon className="w-2.5 h-2.5" />
        {formatPercentage(priceChange)}
      </div>

      {/* Coin Image */}
      <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-4">
        {isVisible && imageSrc && !imageError ? (
          <>
            <img
              src={imageSrc}
              alt={coin.name}
              loading="lazy"
              decoding="async"
              className={cn(
                "w-full h-full object-contain",
                "transition-all duration-300",
                "group-hover:scale-110",
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">{coin.symbol.toUpperCase()}</p>
          </div>
        )}

        {/* Sparkline overlay */}
        {coin.sparkline_in_7d?.price && (
          <div className="absolute bottom-2 right-2 opacity-60 group-hover:opacity-100 transition-opacity">
            <MiniSparkline 
              data={coin.sparkline_in_7d.price.slice(-24)} 
              isPositive={isPositive} 
            />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="relative flex flex-col p-3 gap-2 flex-1 overflow-hidden border-t border-border/10">
        {/* Name & Symbol */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-[clamp(11px,2.5vw,14px)] truncate">
            {coin.name}
          </h3>
          <span className="text-muted-foreground text-[10px] font-medium bg-muted/50 px-1.5 py-0.5 rounded">
            {coin.symbol.toUpperCase()}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-[10px]">Price</span>
          <span className="font-bold text-foreground font-mono text-[clamp(12px,2.8vw,16px)]">
            {formatPrice(coin.current_price)}
          </span>
        </div>

        {/* Market Cap */}
        <div className="flex items-center justify-between pt-1 border-t border-border/20">
          <span className="text-muted-foreground text-[9px]">Market Cap</span>
          <span className="font-medium text-muted-foreground text-[10px]">
            {formatMarketCap(coin.market_cap)}
          </span>
        </div>

        {/* 24h Volume */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-[9px]">24h Vol</span>
          <span className="font-medium text-muted-foreground text-[10px]">
            {formatMarketCap(coin.total_volume)}
          </span>
        </div>
      </div>
    </div>
  );
});

CryptoGiftCard.displayName = 'CryptoGiftCard';

export default CryptoGiftCard;
