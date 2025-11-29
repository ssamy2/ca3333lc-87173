import React, { useState, useRef, useEffect } from 'react';
import { Gift } from 'lucide-react';
import { imageCache } from '@/services/imageCache';
import { normalizeImageUrl } from '@/utils/urlNormalizer';

interface GiftImageProps {
  imageUrl: string;
  name: string;
  shortName?: string;
  size?: 'sm' | 'md' | 'lg' | 'responsive';
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
    responsive: 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-[4.625rem] lg:h-[4.625rem] xl:w-[5.75rem] xl:h-[5.75rem]',
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
  const findCachedVersion = (): { url: string; base64: string } | null => {
    const camelCase = toCamelFromName(name);
    const kebabCase = name.toLowerCase().replace(/\s+/g, '-');
    
    // Normalize the incoming imageUrl first
    const normalizedImageUrl = normalizeImageUrl(imageUrl);
    
    // Try all possible URL formats to find cached version
    const possibleUrls = [
      normalizedImageUrl,
      `https://www.channelsseller.site/api/image/${camelCase}`,
      shortName ? `https://www.channelsseller.site/api/image/${shortName}` : null,
      `https://www.channelsseller.site/api/image/${kebabCase}`,
      `https://www.channelsseller.site/api/image/${name}`,
    ].filter(Boolean) as string[];

    for (const url of possibleUrls) {
      const cached = imageCache.getImageFromCache(url);
      if (cached) {
        return { url, base64: cached };
      }
    }
    
    return null;
  };

  // Check cache directly for the provided imageUrl or find any cached version
  const cachedVersion = findCachedVersion();
  const normalizedUrl = normalizeImageUrl(imageUrl);
  const [currentSrc, setCurrentSrc] = useState(cachedVersion?.base64 || normalizedUrl);
  const [fallbackLevel, setFallbackLevel] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

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
      { rootMargin: '50px', threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Preload image only when visible and not cached
  useEffect(() => {
    if (!isVisible || cachedVersion || isPreloading || !imageUrl) return;
    
    setIsPreloading(true);
    imageCache.preloadImage(imageUrl)
      .then(base64 => {
        if (base64 && base64 !== imageUrl) {
          setCurrentSrc(base64);
        }
      })
      .catch(err => console.error('Failed to preload image:', err))
      .finally(() => setIsPreloading(false));
  }, [isVisible, imageUrl, cachedVersion, isPreloading]);

  const getFallbackUrl = (level: number): string | null => {
    const camelCase = toCamelFromName(name);
    const kebabCase = name.toLowerCase().replace(/\s+/g, '-');
    
    switch (level) {
      case 0:
        // Always try normalized imageUrl first
        return normalizeImageUrl(imageUrl);
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
      // Check if next URL is cached
      const cached = imageCache.getImageFromCache(nextUrl);
      if (cached) {
        setCurrentSrc(cached);
        setFallbackLevel(nextLevel);
      } else {
        // Preload and use the next URL
        imageCache.preloadImage(nextUrl)
          .then(base64 => {
            if (base64 && base64 !== nextUrl) {
              setCurrentSrc(base64);
            } else {
              setCurrentSrc(nextUrl);
            }
            setFallbackLevel(nextLevel);
          })
          .catch(() => {
            setCurrentSrc(nextUrl);
            setFallbackLevel(nextLevel);
          });
      }
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
          className={`${
            size === 'sm' ? 'w-4 h-4' : 
            size === 'md' ? 'w-6 h-6' : 
            size === 'lg' ? 'w-8 h-8' :
            'w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7'
          } ${
            isBlackMode ? 'text-[#B87333]' : 'text-muted-foreground'
          }`}
        />
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={isVisible ? currentSrc : undefined}
      alt={name}
      loading="lazy"
      className={`${sizeClasses[size]} ${className} object-contain transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={style}
      onError={handleImageError}
    />
  );
};

export default GiftImage;
