import React, { useState } from 'react';
import { Gift } from 'lucide-react';
import { imageCache } from '@/services/imageCache';

interface GiftImageProps {
  imageUrl: string;
  name: string;
  shortName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
  isBlackMode?: boolean;
}

const GiftImage: React.FC<GiftImageProps> = ({
  imageUrl,
  name,
  shortName,
  size = 'md',
  className = '',
  style,
  isBlackMode = false,
}) => {
  const [currentSrc, setCurrentSrc] = useState(imageUrl);
  const [fallbackLevel, setFallbackLevel] = useState(0);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  // Helper: convert gift name to API camelCase slug
  const toCamelFromName = (name: string) => {
    const cleaned = name
      .replace(/[^A-Za-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const parts = cleaned.split(' ');
    return parts
      .map((p, i) => (i === 0 ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()))
      .join('');
  };

  const getFallbackUrl = (level: number): string | null => {
    switch (level) {
      case 0:
        return imageUrl;
      case 1:
        // Try camelCase version
        return `https://channelsseller.site/api/image/${toCamelFromName(name)}`;
      case 2:
        // Try short_name if available (for black gifts)
        if (shortName) {
          return `https://channelsseller.site/api/image/${shortName}`;
        }
        return null;
      case 3:
        // Try kebab-case version
        return `https://channelsseller.site/api/image/${name.toLowerCase().replace(/\s+/g, '-')}`;
      default:
        return null;
    }
  };

  const handleImageError = () => {
    const nextLevel = fallbackLevel + 1;
    const nextUrl = getFallbackUrl(nextLevel);

    if (nextUrl && nextUrl !== currentSrc) {
      console.log(`Image failed for "${name}", trying fallback level ${nextLevel}: ${nextUrl}`);
      setCurrentSrc(nextUrl);
      setFallbackLevel(nextLevel);
    } else {
      console.log(`All image fallbacks failed for "${name}", showing icon`);
      setImageError(true);
    }
  };

  const handleImageLoad = () => {
    // Cache the successfully loaded image
    if (!imageCache.getImageFromCache(currentSrc)) {
      imageCache.preloadImage(currentSrc).catch(err => {
        console.error('Failed to cache image:', err);
      });
    }
  };

  // If all fallbacks failed, show a gift icon
  if (imageError) {
    return (
      <div
        className={`${sizeClasses[size]} ${className} flex items-center justify-center rounded-lg ${
          isBlackMode ? 'bg-white/5' : 'bg-muted'
        }`}
        style={style}
      >
        <Gift
          className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} ${
            isBlackMode ? 'text-[#B87333]' : 'text-muted-foreground'
          }`}
        />
      </div>
    );
  }

  // Try to use cached version first
  const cachedSrc = imageCache.getImageFromCache(currentSrc);
  const displaySrc = cachedSrc || currentSrc;

  return (
    <img
      src={displaySrc}
      alt={name}
      loading="lazy"
      className={`${sizeClasses[size]} ${className} object-contain`}
      style={style}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
};

export default GiftImage;
