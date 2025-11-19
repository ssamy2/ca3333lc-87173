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
  autoPlayInterval = 5000 
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

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  const handleAdClick = (ad: Ad) => {
    const targetUrl = ad.target_url.startsWith('/api/ads/click/') 
      ? `https://www.channelsseller.site${ad.target_url}`
      : ad.target_url;
    
    window.open(targetUrl, '_blank');
  };

  if (!ads.length || !isVisible) return null;

  const currentAd = ads[currentIndex];

  return (
    <div className="w-full px-3 pt-3 pb-2">
      <div className="relative group">
        {/* Modern Card Container */}
        <div 
          className="relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
          onClick={() => handleAdClick(currentAd)}
        >
          {/* Gradient Background Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-pink-600/20 z-10 pointer-events-none" />
          
          {/* Image */}
          <div className="relative aspect-[21/9] sm:aspect-[25/9] md:aspect-[30/9]">
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

          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
            }}
            className="absolute top-3 right-3 z-30 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white rounded-full p-1.5 transition-all duration-200 hover:scale-110"
            aria-label="Close banner"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Navigation Buttons */}
          {ads.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 rounded-full p-2 transition-all duration-200 hover:scale-110 shadow-lg opacity-0 group-hover:opacity-100"
                aria-label="Previous ad"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 rounded-full p-2 transition-all duration-200 hover:scale-110 shadow-lg opacity-0 group-hover:opacity-100"
                aria-label="Next ad"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Indicators */}
          {ads.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
              {ads.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentIndex 
                      ? 'bg-white w-6 h-2' 
                      : 'bg-white/50 hover:bg-white/70 w-2 h-2'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}

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
