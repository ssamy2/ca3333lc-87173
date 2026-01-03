import { getAuthHeaders } from '@/lib/telegramAuth';

const BASE_URL = 'https://channelsseller.site';

// Types
export interface TradingGift {
  name: string;
  priceTon: number;
  priceUsd: number;
  change_24h_ton_percent?: number;
  change_24h_usd_percent?: number;
  image_url: string;
  bot_owners_count: number;
}

export interface TradingGiftsResponse {
  success: boolean;
  count: number;
  gifts: Record<string, TradingGift>;
}

export interface Holding {
  id: number;
  gift_name: string;
  gift_id: string;
  image_url: string;
  quantity: number;
  buy_price_ton: number;
  buy_price_usd: number;
  total_cost_ton: number;
  total_cost_usd: number;
  buy_timestamp: string;
  status: 'active' | 'sold';
  current_price_ton?: number;
  current_price_usd?: number;
  current_value_ton?: number;
  current_value_usd?: number;
  unrealized_pnl_ton?: number;
  unrealized_pnl_usd?: number;
  pnl_percent?: number;
  sell_price_ton?: number;
  sell_price_usd?: number;
  sell_timestamp?: string;
  realized_pnl_ton?: number;
  realized_pnl_usd?: number;
  model_id?: string;
  model_name?: string;
  model_image_url?: string;
}

export interface PortfolioData {
  user_id: number;
  balance_ton: number;
  total_deposited: number;
  portfolio_value_ton: number;
  total_holdings_value_ton: number;
  total_holdings_value_usd: number;
  total_cost_ton: number;
  total_cost_usd: number;
  unrealized_pnl_ton: number;
  unrealized_pnl_usd: number;
  realized_pnl_ton: number;
  realized_pnl_usd: number;
  total_pnl_ton: number;
  total_pnl_usd: number;
  total_return_percent: number;
  daily_return_percent: number;
  cumulative_return_percent: number;
  active_holdings_count: number;
  sold_holdings_count: number;
  holdings: Holding[];
  trade_history: Holding[];
}

export interface LeaderboardUser {
  rank: number;
  user_id: number;
  username: string;
  full_name: string;
  profile_image: string;
  photo_url: string;
  balance_ton: number;
  portfolio_value_ton: number;
  total_pnl_ton: number;
  return_percent: number;
  realized_pnl_ton: number;
}

export interface LeaderboardData {
  top_winners: LeaderboardUser[];
  top_losers: LeaderboardUser[];
  total_users: number;
  updated_at: string;
}

export interface TradingStats {
  total_users: number;
  active_holdings: number;
  total_trades_completed: number;
  total_invested_ton: number;
  total_realized_pnl_ton: number;
  popular_gifts: { gift_name: string; holders: number }[];
  updated_at: string;
}

export interface BuyResponse {
  success: boolean;
  message: string;
  data: {
    holding_id: number;
    gift_name: string;
    quantity: number;
    buy_price_ton: number;
    buy_price_usd: number;
    total_cost_ton: number;
    total_cost_usd: number;
    new_balance: number;
  };
}

export interface SellResponse {
  success: boolean;
  message: string;
  data: {
    holding_id: number;
    gift_name: string;
    quantity: number;
    buy_price_ton: number;
    sell_price_ton: number;
    realized_pnl_ton: number;
    realized_pnl_usd: number;
    pnl_percent: number;
    new_balance: number;
  };
}

// API Functions
export async function fetchTradingGifts(): Promise<TradingGiftsResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}/api/trading/gifts`, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch trading gifts');
  return response.json();
}

export async function fetchPortfolio(): Promise<{ success: boolean; data: PortfolioData }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}/api/trading/portfolio`, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch portfolio');
  }
  return response.json();
}

export async function fetchLeaderboard(): Promise<{ success: boolean; data: LeaderboardData }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}/api/trading/leaderboard`, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return response.json();
}

export async function fetchTradingStats(): Promise<{ success: boolean; data: TradingStats }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}/api/trading/stats`, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch trading stats');
  return response.json();
}

export async function buyGift(giftName: string, quantity: number = 1, modelNumber?: number, modelName?: string, modelImageUrl?: string): Promise<BuyResponse> {
  const headers = await getAuthHeaders();
  const body: { gift_name: string; quantity: number; model_number?: number; model_name?: string; model_image_url?: string } = { 
    gift_name: giftName, 
    quantity 
  };
  if (modelNumber !== undefined) {
    body.model_number = modelNumber;
  }
  if (modelName !== undefined) {
    body.model_name = modelName;
  }
  if (modelImageUrl !== undefined) {
    body.model_image_url = modelImageUrl;
  }
  const response = await fetch(`${BASE_URL}/api/trading/buy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to buy gift');
  }
  return data;
}

export async function sellGift(holdingId: number): Promise<SellResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}/api/trading/sell`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ holding_id: holdingId }),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to sell gift');
  }
  return data;
}

export async function resetAccount(): Promise<{ success: boolean; message: string }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}/api/trading/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({}),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to reset account');
  }
  return data;
}
