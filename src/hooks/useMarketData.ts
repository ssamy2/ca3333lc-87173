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
  const { DEV_MODE } = await import('@/config/devMode');
  const baseUrl = DEV_MODE ? 'http://localhost:5002' : 'https://www.channelsseller.site';
  const apiUrl = `${baseUrl}/api/market-data`;
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
      // Read change percentages from API - handle both naming conventions
      const change24hTon = value['change_24h_ton_%'] ?? value.change_24h_ton_percent ?? 0;
      const change24hUsd = value['change_24h_usd_%'] ?? value.change_24h_usd_percent ?? 0;
      const change7dTon = value['change_7d_ton_%'] ?? value.change_7d_ton_percent ?? 0;
      const change7dUsd = value['change_7d_usd_%'] ?? value.change_7d_usd_percent ?? 0;
      const change30dTon = value['change_30d_ton_%'] ?? value.change_30d_ton_percent ?? 0;
      const change30dUsd = value['change_30d_usd_%'] ?? value.change_30d_usd_percent ?? 0;
      
      data[key] = {
        ...value,
        priceTon: value.priceTon || value.price_ton || 0,
        priceUsd: value.priceUsd || value.price_usd || 0,
        price_ton: value.priceTon || value.price_ton || 0,
        price_usd: value.priceUsd || value.price_usd || 0,
        'change_24h_ton_%': change24hTon,
        'change_24h_usd_%': change24hUsd,
        'change_7d_ton_%': change7dTon,
        'change_7d_usd_%': change7dUsd,
        'change_30d_ton_%': change30dTon,
        'change_30d_usd_%': change30dUsd,
        image_url: normalizeImageUrl(value.image_url),
        is_upgraded: true
      };
    });
    
    // Process unupgraded gifts
    if (rawData.unupgraded && typeof rawData.unupgraded === 'object') {
      console.log('📦 [API] Raw unupgraded data sample:', Object.entries(rawData.unupgraded).slice(0, 3));
      
      Object.entries(rawData.unupgraded).forEach(([key, value]: [string, any]) => {
        // البيانات الغير مطورة بتيجي بـ priceTon/priceUsd مباشرة
        const currentPriceTon = value.priceTon || value.price_ton || 0;
        const currentPriceUsd = value.priceUsd || value.price_usd || 0;
        
        // قراءة نسبة التغير من الـ API مباشرة
        // البيانات الغير مطورة بتيجي بـ change_24h_ton_% و change_24h_usd_%
        let change24hTon = value['change_24h_ton_%'];
        let change24hUsd = value['change_24h_usd_%'];
        
        // التعامل مع القيم null أو undefined
        if (change24hTon === null || change24hTon === undefined) {
          change24hTon = 0;
        }
        if (change24hUsd === null || change24hUsd === undefined) {
          change24hUsd = 0;
        }
        
        // محاولة قراءة الأسعار التاريخية من الـ API
        const ton24hAgo = value.tonPrice24hAgo || value.ton_price_24h_ago || value.price_ton_24h_ago;
        const usd24hAgo = value.usdPrice24hAgo || value.usd_price_24h_ago || value.price_usd_24h_ago;
        
        // حساب الأسعار التاريخية من نسبة التغير
        let calculatedTon24hAgo = ton24hAgo;
        let calculatedUsd24hAgo = usd24hAgo;
        
        // إذا كان عندنا نسبة تغير، نحسب السعر التاريخي
        if (change24hTon !== 0 && currentPriceTon > 0) {
          calculatedTon24hAgo = currentPriceTon / (1 + change24hTon / 100);
          console.log(`📈 [CALC] ${key}: price=${currentPriceTon}, change=${change24hTon.toFixed(2)}%, calculated24hAgo=${calculatedTon24hAgo?.toFixed(4)}`);
        } else if (!ton24hAgo) {
          // إذا مفيش نسبة تغير ولا سعر تاريخي، نستخدم السعر الحالي
          calculatedTon24hAgo = currentPriceTon;
        }
        
        if (change24hUsd !== 0 && currentPriceUsd > 0) {
          calculatedUsd24hAgo = currentPriceUsd / (1 + change24hUsd / 100);
        } else if (!usd24hAgo) {
          calculatedUsd24hAgo = currentPriceUsd;
        }
        
        // إذا مفيش نسبة تغير من الـ API ولكن عندنا أسعار تاريخية، نحسب النسبة
        if (change24hTon === 0 && ton24hAgo && ton24hAgo > 0 && currentPriceTon > 0 && ton24hAgo !== currentPriceTon) {
          change24hTon = ((currentPriceTon - ton24hAgo) / ton24hAgo) * 100;
        }
        if (change24hUsd === 0 && usd24hAgo && usd24hAgo > 0 && currentPriceUsd > 0 && usd24hAgo !== currentPriceUsd) {
          change24hUsd = ((currentPriceUsd - usd24hAgo) / usd24hAgo) * 100;
        }
        
        // استخدام اسم الهدية من البيانات
        const giftName = value.name || key;
        
        // Log للتصحيح
        console.log(`🎁 [Unupgraded] ${giftName}:`, {
          currentPriceTon,
          apiChange: value['change_24h_ton_%'],
          calculatedChange: change24hTon,
          apiTon24hAgo: ton24hAgo,
          calculatedTon24hAgo,
          change24hTon: change24hTon.toFixed(2) + '%'
        });
        
        data[`[Regular] ${giftName}`] = {
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
    // Old format - process as before (direct object without upgraded/unupgraded sections)
    Object.entries(rawData).forEach(([key, value]: [string, any]) => {
      // Read change percentages from API - handle both naming conventions
      const change24hTon = value['change_24h_ton_%'] ?? value.change_24h_ton_percent ?? 0;
      const change24hUsd = value['change_24h_usd_%'] ?? value.change_24h_usd_percent ?? 0;
      
      data[key] = {
        ...value,
        'change_24h_ton_%': change24hTon,
        'change_24h_usd_%': change24hUsd,
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
