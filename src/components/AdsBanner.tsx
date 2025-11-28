import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Ad {
  id: number;
  title: string;
  image_url: string;
  target_url: string;
  priority?: number;
}

interface AdsBannerProps {
  ads?: Ad[];
  autoPlayInterval?: number;
}

export const AdsBanner: React.FC<AdsBannerProps> = ({ 
  ads: propAds, 
  autoPlayInterval = 4000 
}) => {
  const [ads, setAds] = useState<Ad[]>(propAds || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const { ads: contextAds } = useAuth();

  // جلب الإعلانات من context
  useEffect(() => {
    console.log('[AdsBanner] contextAds:', contextAds?.length || 0, 'ads');
    console.log('[AdsBanner] propAds:', propAds?.length || 0, 'ads');
    
    if (!propAds && contextAds && contextAds.length > 0) {
      console.log('[AdsBanner] Setting ads from context');
      setAds(contextAds);
    }
  }, [contextAds, propAds]);

  // Auto-play
  useEffect(() => {
    if (ads.length <= 1 || !isVisible) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, autoPlayInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ads.length, autoPlayInterval, isVisible]);

  const handleAdClick = (ad: Ad) => {
    const targetUrl = ad.target_url.startsWith('/api/ads/click/') 
      ? `https://www.channelsseller.site${ad.target_url}`
      : ad.target_url;
    
    window.open(targetUrl, '_blank');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    // Swipe from right to left (positive diff)
    if (diff > swipeThreshold) {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }
    // Swipe from left to right (negative diff)
    else if (diff < -swipeThreshold) {
      setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
    }
  };

  if (!ads.length || !isVisible) return null;

  const currentAd = ads[currentIndex];

  return (
    <div className="w-full px-3 pt-3 pb-2">
      <div className="relative group">
        {/* Modern Card Container */}
        <div 
          className="relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer select-none"
          onClick={() => handleAdClick(currentAd)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Gradient Background Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-pink-600/20 z-10 pointer-events-none" />
          
          {/* Image */}
          <div className="relative h-[80px] w-full">
            <img
              src={currentAd.image_url.startsWith('/api/') 
                ? `https://www.channelsseller.site${currentAd.image_url}`
                : currentAd.image_url
              }
              alt={currentAd.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
          </div>

          {/* Floating Effect Border */}
          <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10 pointer-events-none z-20" />
        </div>

        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 rounded-3xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-300 -z-10" />
      </div>
    </div>
  );
};

export default AdsBanner;
