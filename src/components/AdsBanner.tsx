import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
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
  const [isVisible, setIsVisible] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();
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
    if (ads.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, autoPlayInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ads.length, autoPlayInterval]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
    // إعادة تشغيل التايمر
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, autoPlayInterval);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
    // إعادة تشغيل التايمر
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, autoPlayInterval);
  };

  const handleAdClick = (ad: Ad) => {
    // فتح الرابط في نافذة جديدة
    const targetUrl = ad.target_url.startsWith('/api/ads/click/') 
      ? `https://www.channelsseller.site${ad.target_url}`
      : ad.target_url;
    
    window.open(targetUrl, '_blank');
  };

  if (!ads.length || !isVisible) return null;

  const currentAd = ads[currentIndex];

  return (
    <div className="relative w-full bg-gradient-to-r from-purple-600 to-blue-600 overflow-hidden">
      {/* Close button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
        aria-label="Close banner"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Indicators */}
      {ads.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20 flex gap-1">
          {ads.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-6' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Navigation buttons */}
      {ads.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
            aria-label="Previous ad"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
            aria-label="Next ad"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Ad content */}
      <div className="relative w-full" style={{ paddingBottom: '18.8%' }}> {/* 470/2500 = 18.8% */}
        <div className="absolute inset-0">
          <button
            onClick={() => handleAdClick(currentAd)}
            className="w-full h-full block cursor-pointer group"
            aria-label={currentAd.title}
          >
            <img
              src={currentAd.image_url.startsWith('/api/') 
                ? `https://www.channelsseller.site${currentAd.image_url}`
                : currentAd.image_url
              }
              alt={currentAd.title}
              className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
              loading="lazy"
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        </div>
      </div>

      {/* Loading skeleton for image */}
      {!currentAd.image_url && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
      )}
    </div>
  );
};

export default AdsBanner;
