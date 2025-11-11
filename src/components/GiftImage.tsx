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
    const result = parts
      .map((p, i) => (i === 0 ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()))
      .join('');
    return result;
  };

  // Helper: find cached version of the image using all possible URL formats
  const findCachedVersion = (): string | null => {
    const camelCase = toCamelFromName(name);
    const kebabCase = name.toLowerCase().replace(/\s+/g, '-');
    
    // Try all possible URL formats to find cached version
    const possibleUrls = [
      imageUrl,
      `https://www.channelsseller.site/api/image/${camelCase}`,
      shortName ? `https://www.channelsseller.site/api/image/${shortName}` : null,
      `https://www.channelsseller.site/api/image/${kebabCase}`,
      `https://www.channelsseller.site/api/image/${name}`,
    ].filter(Boolean) as string[];

    for (const url of possibleUrls) {
      const cached = imageCache.getImageFromCache(url);
      if (cached) {
        return url;
      }
    }
    
    return null;
  };

  // Check cache directly for the provided imageUrl
  const cachedBase64 = imageCache.getImageFromCache(imageUrl);
  const [currentSrc, setCurrentSrc] = useState(imageUrl);
  const [fallbackLevel, setFallbackLevel] = useState(0);
  const [imageError, setImageError] = useState(false);

  const getFallbackUrl = (level: number): string | null => {
    const camelCase = toCamelFromName(name);
    const kebabCase = name.toLowerCase().replace(/\s+/g, '-');
    
    switch (level) {
      case 0:
        // Always try original imageUrl first
        return imageUrl;
      case 1:
        // For black mode with short_name that's different from imageUrl, try it
        if (isBlackMode && shortName && !imageUrl.includes(shortName)) {
          return `https://www.channelsseller.site/api/image/${shortName}`;
        }
        // Otherwise try camelCase
        return `https://www.channelsseller.site/api/image/${camelCase}`;
      case 2:
        // Try short_name if not tried yet
        if (shortName && !imageUrl.includes(shortName)) {
          return `https://www.channelsseller.site/api/image/${shortName}`;
        }
        // Try camelCase if not tried yet
        if (!imageUrl.includes(camelCase)) {
          return `https://www.channelsseller.site/api/image/${camelCase}`;
        }
        return null;
      case 3:
        // Try kebab-case
        return `https://www.channelsseller.site/api/image/${kebabCase}`;
      case 4:
        // Try original name without transformation
        return `https://www.channelsseller.site/api/image/${name}`;
      default:
        return null;
    }
  };

  const handleImageError = () => {
    const nextLevel = fallbackLevel + 1;
    const nextUrl = getFallbackUrl(nextLevel);

    if (nextUrl && nextUrl !== currentSrc) {
      setCurrentSrc(nextUrl);
      setFallbackLevel(nextLevel);
    } else {
      setImageError(true);
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

  // Use cached base64 if available, otherwise use current URL
  const displaySrc = cachedBase64 || currentSrc;

  return (
    <img
      src={displaySrc}
      alt={name}
      loading="lazy"
      className={`${sizeClasses[size]} ${className} object-contain`}
      style={style}
      onError={handleImageError}
    />
  );
};

export default GiftImage;
