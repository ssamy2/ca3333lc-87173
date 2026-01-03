import { useState, memo } from 'react';

const BACKEND_URL = 'https://channelsseller.site';

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  onError?: () => void;
}

/**
 * Get the correct image URL - CDN URLs are used directly, others go through backend
 */
function getImageUrl(url: string): string {
  if (!url) return '';
  
  // CDN URLs - use directly (fastest)
  if (url.startsWith('https://cdn.swap.coffee') || 
      url.startsWith('https://cdn.changes.tg')) {
    return url;
  }
  
  // Any full URL - use directly
  if (url.startsWith('https://') || url.startsWith('http://')) {
    return url;
  }
  
  // Backend API paths - add backend URL
  if (url.startsWith('/api/')) {
    return `${BACKEND_URL}${url}`;
  }
  
  return url;
}

/**
 * Simple, fast image component with error handling
 * Uses browser's native image caching instead of localStorage
 */
export const CachedImage = memo(function CachedImage({ 
  src, 
  alt, 
  className, 
  fallback = '/placeholder.svg', 
  onError 
}: CachedImageProps) {
  const [hasError, setHasError] = useState(false);
  
  const imageUrl = hasError ? fallback : getImageUrl(src);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      onError?.();
    }
  };

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={handleError}
    />
  );
});
