import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTradingGifts,
  fetchPortfolio,
  fetchLeaderboard,
  fetchTradingStats,
  buyGift,
  sellGift,
  resetAccount,
} from '@/services/tradingService';

// Hook for fetching trading gifts (market data)
export function useTradingGifts() {
  return useQuery({
    queryKey: ['trading-gifts'],
    queryFn: fetchTradingGifts,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 2,
    retryDelay: 1000,
  });
}

// Hook for fetching user portfolio
export function usePortfolio() {
  return useQuery({
    queryKey: ['trading-portfolio'],
    queryFn: fetchPortfolio,
    staleTime: 10000,
    refetchInterval: 60000,
    retry: 2,
    retryDelay: 1000,
    enabled: true,
  });
}

// Hook for fetching leaderboard
export function useLeaderboard() {
  return useQuery({
    queryKey: ['trading-leaderboard'],
    queryFn: fetchLeaderboard,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 2,
    retryDelay: 1000,
  });
}

// Hook for fetching trading stats
export function useTradingStats() {
  return useQuery({
    queryKey: ['trading-stats'],
    queryFn: fetchTradingStats,
    staleTime: 30000,
  });
}

// Hook for buying a gift
export function useBuyGift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ giftName, quantity, modelNumber, modelName, modelImageUrl }: { giftName: string; quantity: number; modelNumber?: number; modelName?: string; modelImageUrl?: string }) =>
      buyGift(giftName, quantity, modelNumber, modelName, modelImageUrl),
    onSuccess: () => {
      // Invalidate portfolio and gifts to refresh data
      queryClient.invalidateQueries({ queryKey: ['trading-portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['trading-gifts'] });
      queryClient.invalidateQueries({ queryKey: ['trading-leaderboard'] });
    },
  });
}

// Hook for selling a gift
export function useSellGift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (holdingId: number) => sellGift(holdingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading-portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['trading-leaderboard'] });
    },
  });
}

// Hook for resetting account
export function useResetAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: resetAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trading-portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['trading-leaderboard'] });
    },
  });
}
