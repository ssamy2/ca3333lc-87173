import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCachedData, setCachedData } from '@/services/marketCache';
import { getAuthHeaders } from '@/lib/telegramAuth';
import { normalizeImageUrl } from '@/utils/urlNormalizer';

interface NFTMarketData {
  priceTon: number;
  priceUsd: number;
  tonPrice24hAgo?: number;
  usdPrice24hAgo?: number;
  tonPriceWeekAgo?: number;
  usdPriceWeekAgo?: number;
  tonPriceMonthAgo?: number;
  usdPriceMonthAgo?: number;
  'change_24h_ton_%': number;
  'change_24h_usd_%': number;
  market_cap_ton?: string;
  market_cap_usd?: string;
  fdv_ton?: string;
  fdv_usd?: string;
  price_ton: number;
  price_usd: number;
  image_url: string;
  upgradedSupply?: number;
}

interface MarketData {
  [key: string]: NFTMarketData;
}

// Fetch market data from API
const fetchMarketData = async (): Promise<MarketData> => {
  const apiUrl = 'https://www.channelsseller.site/api/market-data';
  const headers = await getAuthHeaders();
  
  const response = await fetch(apiUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      console.log('Access Denied S2170');
    }
    throw new Error('Failed to fetch market data');
  }
  const rawData = await response.json();
  
  // Handle new format with upgraded/unupgraded sections
  const data: MarketData = {};
  
  // Check if response has the new format (upgraded/unupgraded)
  if (rawData.upgraded && typeof rawData.upgraded === 'object') {
    // Process upgraded gifts
    Object.entries(rawData.upgraded).forEach(([key, value]: [string, any]) => {
      data[key] = {
        ...value,
        image_url: normalizeImageUrl(value.image_url),
        is_upgraded: true
      };
    });
    
    // Process unupgraded gifts
    if (rawData.unupgraded && typeof rawData.unupgraded === 'object') {
      console.log('📦 [API] Raw unupgraded data sample:', Object.entries(rawData.unupgraded).slice(0, 3));
      
      Object.entries(rawData.unupgraded).forEach(([key, value]: [string, any]) => {
        const currentPriceTon = value.price_ton || 0;
        const currentPriceUsd = value.price_usd || 0;
        
        // استخدام الأسعار التاريخية من البيانات القادمة أو حسابها
        const ton24hAgo = value.tonPrice24hAgo || value.ton_price_24h_ago || value.price_ton_24h_ago;
        const usd24hAgo = value.usdPrice24hAgo || value.usd_price_24h_ago || value.price_usd_24h_ago;
        
        // حساب نسبة التغير - استخدم القيمة من API مباشرة إذا كانت موجودة
        // لا نعيد الحساب لأن الـ API قد يستخدم sticker_change_percent كـ fallback
        let change24hTon = value.change_24h ?? value['change_24h_ton_%'] ?? value.change_24h_ton_percent ?? 0;
        let change24hUsd = value.change_24h ?? value['change_24h_usd_%'] ?? value.change_24h_usd_percent ?? 0;
        
        // فقط نحسب يدوياً إذا كان change_24h = 0 والأسعار التاريخية مختلفة عن الحالية
        if (change24hTon === 0 && ton24hAgo && ton24hAgo > 0 && currentPriceTon > 0 && ton24hAgo !== currentPriceTon) {
          change24hTon = ((currentPriceTon - ton24hAgo) / ton24hAgo) * 100;
        }
        if (change24hUsd === 0 && usd24hAgo && usd24hAgo > 0 && currentPriceUsd > 0 && usd24hAgo !== currentPriceUsd) {
          change24hUsd = ((currentPriceUsd - usd24hAgo) / usd24hAgo) * 100;
        }
        
        // Log للتصحيح
        console.log(`🎁 [Unupgraded] ${key}:`, {
          currentPriceTon,
          ton24hAgo,
          change24hTon: change24hTon.toFixed(2) + '%',
          rawValue: value
        });
        
        // Calculate historical prices from change_24h if not available OR if they equal current price
        // This handles the case where backend sets tonPrice24hAgo = current_ton when no historical data
        // Formula: oldPrice = currentPrice / (1 + change/100)
        let calculatedTon24hAgo = ton24hAgo;
        let calculatedUsd24hAgo = usd24hAgo;
        
        // Helper to check if two numbers are approximately equal (for floating point comparison)
        const isApproxEqual = (a: number, b: number) => Math.abs(a - b) < 0.01;
        
        // If ton24hAgo is missing OR equals current price (meaning no real historical data),
        // but we have a non-zero change, calculate the old price from the change
        const needsCalculation = !ton24hAgo || isApproxEqual(ton24hAgo, currentPriceTon);
        if (change24hTon !== 0 && currentPriceTon > 0 && needsCalculation) {
          calculatedTon24hAgo = currentPriceTon / (1 + change24hTon / 100);
          console.log(`📈 [Calculated] ${key}: ton24hAgo=${calculatedTon24hAgo?.toFixed(2)} from change=${change24hTon.toFixed(2)}%, was=${ton24hAgo}`);
        }
        
        const needsCalculationUsd = !usd24hAgo || isApproxEqual(usd24hAgo, currentPriceUsd);
        if (change24hUsd !== 0 && currentPriceUsd > 0 && needsCalculationUsd) {
          calculatedUsd24hAgo = currentPriceUsd / (1 + change24hUsd / 100);
        }
        
        data[`[Regular] ${key}`] = {
          ...value,
          priceTon: currentPriceTon,
          priceUsd: currentPriceUsd,
          price_ton: currentPriceTon,
          price_usd: currentPriceUsd,
          'change_24h_ton_%': change24hTon,
          'change_24h_usd_%': change24hUsd,
          tonPrice24hAgo: calculatedTon24hAgo || currentPriceTon,
          usdPrice24hAgo: calculatedUsd24hAgo || currentPriceUsd,
          tonPriceWeekAgo: value.tonPriceWeekAgo || value.ton_price_week_ago || currentPriceTon,
          usdPriceWeekAgo: value.usdPriceWeekAgo || value.usd_price_week_ago || currentPriceUsd,
          tonPriceMonthAgo: value.tonPriceMonthAgo || value.ton_price_month_ago || currentPriceTon,
          usdPriceMonthAgo: value.usdPriceMonthAgo || value.usd_price_month_ago || currentPriceUsd,
          image_url: normalizeImageUrl(value.image_url),
          is_upgraded: false,
          is_unupgraded: true,
          multiplier: value.multiplier || ''
        };
      });
    }
  } else {
    // Old format - process as before
    Object.entries(rawData).forEach(([key, value]: [string, any]) => {
      data[key] = {
        ...value,
        image_url: normalizeImageUrl(value.image_url)
      };
    });
  }
  
  // Cache the normalized data
  setCachedData('market-data', data);
  
  // Immediately preload images after successful data fetch
  setTimeout(() => {
    import('@/services/imageCache').then(({ preloadImages }) => {
      preloadImages().catch(console.error);
    });
  }, 100); // Small delay to not block the UI
  
  return data;
};

// Custom hook for market data with caching
export const useMarketData = () => {
  return useQuery({
    queryKey: ['market-data'],
    queryFn: fetchMarketData,
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
    placeholderData: () => getCachedData('market-data'), // Show cached data while fetching
  });
};

// Prefetch market data
export const usePrefetchMarketData = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: ['market-data'],
      queryFn: fetchMarketData,
      staleTime: 30000,
    });
  };
};
