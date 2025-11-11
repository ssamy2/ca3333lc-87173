import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCachedData, setCachedData } from '@/services/marketCache';

interface BlackFloorItem {
  gift_name: string;
  short_name: string;
  black_price: number;
  market_cap_ton?: string;
  image_url?: string;
  change_24h_ton_percent?: number;
  change_1w_ton_percent?: number;
  change_1m_ton_percent?: number;
  change_3m_ton_percent?: number;
  change_1y_ton_percent?: number;
  available_periods?: string[];
  upgradedSupply?: number;
  // Past prices for accurate change calculations
  daily_past_price_ton?: number | null;
  weekly_past_price_ton?: number | null;
  monthly_past_price_ton?: number | null;
}

interface BlackAPIResponse {
  [key: string]: {
    gift_name: string;
    current_black_price_ton: number;
    current_black_price_usd: number;
    daily_change_percent_ton: number;
    daily_past_price_ton: number;
    weekly_change_percent_ton: number;
    weekly_past_price_ton: number;
    monthly_change_percent_ton: number | null;
    monthly_past_price_ton: number | null;
    quarterly_change_percent_ton: number | null;
    quarterly_past_price_ton: number | null;
  };
}

// Fetch black floor data from API
const fetchBlackFloorData = async (): Promise<BlackFloorItem[]> => {
  const apiUrl = 'https://www.channelsseller.site/api/black/summary';
  
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch black floor data');
  }
  const data: BlackAPIResponse = await response.json();
  
  // Convert object of objects to array
  const processedData: BlackFloorItem[] = Object.entries(data).map(([shortName, item]) => {
    const available_periods: string[] = [];
    
    // Check which periods have data
    if (item.daily_past_price_ton !== null && item.daily_change_percent_ton !== null) {
      available_periods.push('24h');
    }
    if (item.weekly_past_price_ton !== null && item.weekly_change_percent_ton !== null) {
      available_periods.push('1w');
    }
    if (item.monthly_past_price_ton !== null && item.monthly_change_percent_ton !== null) {
      available_periods.push('1m');
    }
    if (item.quarterly_past_price_ton !== null && item.quarterly_change_percent_ton !== null) {
      available_periods.push('3m');
    }
    
    return {
      gift_name: item.gift_name,
      short_name: shortName,
      black_price: item.current_black_price_ton,
      market_cap_ton: undefined,
      image_url: `https://www.channelsseller.site/api/image/${shortName}`,
      change_24h_ton_percent: item.daily_change_percent_ton,
      change_1w_ton_percent: item.weekly_change_percent_ton,
      change_1m_ton_percent: item.monthly_change_percent_ton ?? undefined,
      change_3m_ton_percent: item.quarterly_change_percent_ton ?? undefined,
      change_1y_ton_percent: undefined,
      available_periods,
      upgradedSupply: undefined,
      daily_past_price_ton: item.daily_past_price_ton,
      weekly_past_price_ton: item.weekly_past_price_ton,
      monthly_past_price_ton: item.monthly_past_price_ton,
    };
  });
  
  // Cache the data
  setCachedData('black-floor-data', processedData);
  
  return processedData;
};

// Custom hook for black floor data with caching
export const useBlackFloorData = () => {
  return useQuery({
    queryKey: ['black-floor-data'],
    queryFn: fetchBlackFloorData,
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
    initialData: () => getCachedData('black-floor-data'),
  });
};

// Prefetch black floor data
export const usePrefetchBlackFloorData = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: ['black-floor-data'],
      queryFn: fetchBlackFloorData,
      staleTime: 30000,
    });
  };
};
