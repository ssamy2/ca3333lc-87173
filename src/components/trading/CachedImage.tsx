import { useState, useEffect } from 'react';
import { fetchAndCacheImage, getCachedImage } from '@/utils/imageCache';

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  onError?: () => void;
}

export function CachedImage({ src, alt, className, fallback = '/placeholder.svg', onError }: CachedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!src) {
        setImageSrc(fallback);
        setIsLoading(false);
        return;
      }

      try {
        // Check cache first
        const cached = getCachedImage(src);
        if (cached) {
          if (isMounted) {
            setImageSrc(cached);
            setIsLoading(false);
          }
          return;
        }

        // Fetch and cache
        const dataUrl = await fetchAndCacheImage(src);
        if (isMounted) {
          setImageSrc(dataUrl);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading image:', error);
        if (isMounted) {
          setImageSrc(fallback);
          setIsLoading(false);
          setHasError(true);
          onError?.();
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [src, fallback, onError]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        if (!hasError) {
          (e.target as HTMLImageElement).src = fallback;
          setHasError(true);
          onError?.();
        }
      }}
    />
  );
}
