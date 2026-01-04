export interface MarketItem {
    id?: string;
    name: string;
    short_name: string;
    image: string;
    price_ton: number;
    price_usd?: number;
    change_24h: number;
    change_7d?: number;
    change_30d?: number;
    market_cap_ton?: number;
    market_cap_usd?: number;
    volume_24h?: number;
    supply?: number;
    holders?: number;
    is_black_market?: boolean;
}
