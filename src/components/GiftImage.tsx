import React, { useState, useRef, useEffect } from 'react';
import { Gift } from 'lucide-react';
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

  const normalizedUrl = normalizeImageUrl(imageUrl);
  const [currentSrc, setCurrentSrc] = useState(normalizedUrl);
  const [fallbackLevel, setFallbackLevel] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

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
      { rootMargin: '100px', threshold: 0.01 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const getFallbackUrl = (level: number): string | null => {
    const camelCase = toCamelFromName(name);
    const kebabCase = name.toLowerCase().replace(/\s+/g, '-');
    
    switch (level) {
      case 0:
        return normalizeImageUrl(imageUrl);
      case 1:
        if (isBlackMode && shortName && !imageUrl.includes(shortName)) {
          return `https://www.channelsseller.site/api/image/${shortName}`;
        }
        return `https://www.channelsseller.site/api/image/${camelCase}`;
      case 2:
        if (shortName && !imageUrl.includes(shortName)) {
          return `https://www.channelsseller.site/api/image/${shortName}`;
        }
        if (!imageUrl.includes(camelCase)) {
          return `https://www.channelsseller.site/api/image/${camelCase}`;
        }
        return null;
      case 3:
        return `https://www.channelsseller.site/api/image/${kebabCase}`;
      case 4:
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

  if (imageError) {
    return (
      <div
        ref={imgRef}
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
    <div ref={imgRef} className={`${sizeClasses[size]} ${className}`} style={style}>
      {isVisible && (
        <img
          src={currentSrc}
          alt={name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain"
          onError={handleImageError}
        />
      )}
    </div>
  );
};

export default GiftImage;
