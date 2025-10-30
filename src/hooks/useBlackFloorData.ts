import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCachedData, setCachedData } from '@/services/marketCache';

interface BlackFloorItem {
  gift_name: string;
  short_name: string;
  black_price: number;
  recorded_at: string;
  change_24h_ton_percent?: number;
}

// Fetch black floor data from API
const fetchBlackFloorData = async (): Promise<BlackFloorItem[]> => {
  const response = await fetch('https://channelsseller.site/api/black-floor');
  if (!response.ok) {
    throw new Error('Failed to fetch black floor data');
  }
  const data: BlackFloorItem[] = await response.json();
  
  // Filter to get only the latest record for each gift
  const latestRecords = new Map<string, BlackFloorItem>();
  
  data.forEach(item => {
    const existing = latestRecords.get(item.gift_name);
    if (!existing || new Date(item.recorded_at) > new Date(existing.recorded_at)) {
      latestRecords.set(item.gift_name, item);
    }
  });
  
  const filteredData = Array.from(latestRecords.values());
  
  // Calculate daily change for each gift
  const dataWithChange = filteredData.map(item => {
    const dayAgo = new Date(new Date(item.recorded_at).getTime() - 24 * 60 * 60 * 1000);
    const oldRecords = data.filter(d => 
      d.gift_name === item.gift_name && 
      new Date(d.recorded_at) <= dayAgo
    );
    
    let change_24h = 0;
    if (oldRecords.length > 0) {
      const oldestRecord = oldRecords.sort((a, b) => 
        Math.abs(new Date(a.recorded_at).getTime() - dayAgo.getTime()) - 
        Math.abs(new Date(b.recorded_at).getTime() - dayAgo.getTime())
      )[0];
      
      const oldPrice = oldestRecord.black_price;
      const currentPrice = item.black_price;
      
      if (oldPrice > 0) {
        change_24h = ((currentPrice - oldPrice) / oldPrice) * 100;
      }
    }
    
    return {
      ...item,
      change_24h_ton_percent: change_24h
    };
  });
  
  // Cache the data
  setCachedData('black-floor-data', dataWithChange);
  
  return dataWithChange;
};

// Custom hook for black floor data with caching
export const useBlackFloorData = () => {
  return useQuery({
    queryKey: ['black-floor-data'],
    queryFn: fetchBlackFloorData,
    staleTime: 30000, // Data is fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: false,
    initialData: () => getCachedData('black-floor-data'), // Use cached data initially
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
