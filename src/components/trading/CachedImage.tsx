import { useState, useEffect, useRef } from 'react';
import { getCachedImage, setCachedImage } from '@/utils/imageCache';

const BACKEND_URL = 'https://channelsseller.site';

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  onError?: () => void;
}

/**
 * Convert external image URL to use our backend proxy
 */
function getProxiedUrl(url: string): string {
  if (!url) return '';
  
  // If already using our backend, return as-is
  if (url.startsWith(BACKEND_URL) || url.startsWith('/api/')) {
    return url.startsWith('/api/') ? `${BACKEND_URL}${url}` : url;
  }
  
  // Extract image name from various URL formats
  let imageName = '';
  
  // Handle giftcharts-api URLs
  if (url.includes('giftcharts-api.onrender.com/api/image/')) {
    imageName = url.split('/api/image/')[1]?.split('?')[0] || '';
  }
  // Handle giftcharts.com URLs
  else if (url.includes('giftcharts.com/gifts/')) {
    imageName = url.split('/gifts/')[1]?.replace('.webp', '').replace('.png', '') || '';
  }
  // Handle portal-market URLs - use directly
  else if (url.includes('storage.portal-market.com')) {
    return url; // These don't have CORS issues
  }
  // Handle other external URLs - try to extract name
  else {
    const parts = url.split('/');
    imageName = parts[parts.length - 1]?.replace(/\.(webp|png|jpg|jpeg|gif)$/i, '') || '';
  }
  
  if (imageName) {
    return `${BACKEND_URL}/api/image/${imageName}`;
  }
  
  return url;
}

export function CachedImage({ src, alt, className, fallback = '/placeholder.svg', onError }: CachedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(() => {
    // Check cache immediately on mount
    if (src) {
      const cached = getCachedImage(src);
      if (cached) return cached;
    }
    // Use proxied URL directly instead of fetching
    return src ? getProxiedUrl(src) : fallback;
  });
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) {
      setImageSrc(fallback);
      return;
    }

    // Check cache first
    const cached = getCachedImage(src);
    if (cached) {
      setImageSrc(cached);
      return;
    }

    // Use proxied URL
    const proxiedUrl = getProxiedUrl(src);
    setImageSrc(proxiedUrl);
    setHasError(false);
  }, [src, fallback]);

  const handleLoad = () => {
    // Cache the image after successful load (only if it's a data URL or same-origin)
    if (imgRef.current && src && !getCachedImage(src)) {
      try {
        // Create a canvas to convert to data URL for caching
        const canvas = document.createElement('canvas');
        const img = imgRef.current;
        canvas.width = img.naturalWidth || 64;
        canvas.height = img.naturalHeight || 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            const dataUrl = canvas.toDataURL('image/webp', 0.8);
            setCachedImage(src, dataUrl);
          } catch (e) {
            // CORS - can't cache cross-origin images this way, that's OK
          }
        }
      } catch (e) {
        // Ignore canvas errors
      }
    }
  };

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallback);
      onError?.();
    }
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={className}
      crossOrigin="anonymous"
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}
