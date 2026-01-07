/**
 * Binance API Service
 * Real-time crypto data from Binance
 */

export interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}

export interface BinanceOrderBook {
  lastUpdateId: number;
  bids: string[][];
  asks: string[][];
}

export interface BinanceTrade {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

export interface BinanceCryptoData {
  symbol: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
  bidPrice: number;
  askPrice: number;
  openPrice: number;
  image?: string;
  name?: string;
}

export interface BinanceChartData {
  prices: number[];
  volumes: number[];
  times: number[];
}

const BINANCE_BASE_URL = 'https://api.binance.com';
const BINANCE_FUTURES_URL = 'https://fapi.binance.com';

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 seconds

/**
 * Get cached data or fetch new
 */
function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Convert CoinGecko ID to Binance symbol
 */
export function coinIdToBinanceSymbol(coinId: string): string {
  const symbolMap: Record<string, string> = {
    'bitcoin': 'BTCUSDT',
    'ethereum': 'ETHUSDT',
    'the-open-network': 'TONUSDT',
    'ton': 'TONUSDT',
    'notcoin': 'NOTUSDT',
    'not': 'NOTUSDT',
    'binancecoin': 'BNBUSDT',
    'ripple': 'XRPUSDT',
    'cardano': 'ADAUSDT',
    'solana': 'SOLUSDT',
    'dogecoin': 'DOGEUSDT',
    'polkadot': 'DOTUSDT',
    'avalanche-2': 'AVAXUSDT',
    'chainlink': 'LINKUSDT',
    'polygon': 'MATICUSDT',
    'uniswap': 'UNIUSDT',
    'litecoin': 'LTCUSDT',
    'stellar': 'XLMUSDT',
    'cosmos': 'ATOMUSDT',
    'near': 'NEARUSDT',
    'filecoin': 'FILUSDT',
    'tron': 'TRXUSDT',
    'ethereum-classic': 'ETCUSDT',
    'monero': 'XMRUSDT',
    'zcash': 'ZECUSDT',
    'dash': 'DASHUSDT',
    'neo': 'NEOUSDT',
    'maker': 'MKRUSDT',
    'compound': 'COMPUSDT',
    'aave': 'AAVEUSDT',
    'sushi': 'SUSHIUSDT',
    'curve-dao-token': 'CRVUSDT',
    'yearn-finance': 'YFIUSDT',
    'helium': 'HNTUSDT',
    'fantom': 'FTMUSDT',
    'arweave': 'ARUSDT',
    'the-sandbox': 'SANDUSDT',
    'decentraland': 'MANAUSDT',
    'axie-infinity': 'AXSUSDT',
    'enjincoin': 'ENJUSDT',
    'chiliz': 'CHZUSDT',
    'flow': 'FLOWUSDT',
    'quant': 'QNTUSDT',
    'theta-token': 'THETAUSDT',
    'klay': 'KLAYUSDT',
    'huobi-token': 'HTUSDT',
    'elrond-erd-2': 'EGLDUSDT',
    'harmony': 'ONEUSDT',
    'helmet': 'HELMETUSDT',
    'stacks': 'STXUSDT',
    'pancakeswap-token': 'CAKEUSDT',
    'terra-luna': 'LUNAUSDT',
    'crypto-com-chain': 'CROUSDT',
    'the-graph': 'GRTUSDT',
    'okb': 'OKBUSDT',
    'ftx-token': 'FTTUSDT',
    'gatechain-token': 'GTUSDT',
    'telcoin': 'TELUSDT',
    'bittorrent': 'BTTUSDT',
    'numeraire': 'NMRUSDT',
    'ren': 'RENUSDT',
    'kava': 'KAVAUSDT',
    'zilliqa': 'ZILUSDT',
    '0x': 'ZRXUSDT',
    'basic-attention-token': 'BATUSDT',
    'decred': 'DCRUSDT',
    'waves': 'WAVESUSDT',
    'status': 'SNTUSDT',
    'dai': 'DAIUSDT',
    'nexo': 'NEXOUSDT',
    'cdp': 'LDOUSDT',
    'gemini-dollar': 'GUSDUSDT',
    'true-usd': 'TUSDT',
    'paxos-standard': 'PAXUSDT',
    'usd-coin': 'USDCUSDT',
    'tether': 'USDTUSDT',
    'binance-usd': 'BUSDUSDT',
    'wrapped-bitcoin': 'WBTCUSDT',
    'stasis-eurs': 'EURSUSDT',
    'terrausd': 'USTUSDT',
    'leo-token': 'LEOUSDT',
    'havven': 'SNXUSDT',
    'icon': 'ICXUSDT',
    'iota': 'MIOTAUSDT',
    'vechain': 'VETUSDT',
    'thorchain': 'RUNEUSDT',
    'wink': 'WINUSDT',
    'holo': 'HOTUSDT',
    'ontology': 'ONTUSDT',
    'digibyte': 'DGBUSDT',
    'qtum': 'QTUMUSDT',
    'zcoin': 'XZCUSDT',
    'bytecoin': 'BCNUSDT',
    'siacoin': 'SCUSDT',
    'lisk': 'LSKUSDT',
    'steem': 'STEEMUSDT',
    'bitshares': 'BTSUSDT',
    'golem': 'GNTUSDT',
    'augur': 'REPUSDT',
    'first-digital-usd': 'FDUSDUSDT'
  };
  
  return symbolMap[coinId] || `${coinId.toUpperCase()}USDT`;
}

/**
 * Fetch 24hr ticker data
 */
export async function fetchBinanceTicker(symbol: string): Promise<BinanceTicker | null> {
  const cacheKey = `ticker_${symbol}`;
  const cached = getFromCache<BinanceTicker>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${BINANCE_BASE_URL}/api/v3/ticker/24hr?symbol=${symbol}`);
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`[BinanceService] Ticker fetch error for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch kline/candlestick data
 */
export async function fetchBinanceKlines(
  symbol: string, 
  interval: string = '1h', 
  limit: number = 100
): Promise<BinanceKline[]> {
  const cacheKey = `klines_${symbol}_${interval}_${limit}`;
  const cached = getFromCache<BinanceKline[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${BINANCE_BASE_URL}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Convert array to object format
    const klines: BinanceKline[] = data.map((k: any[]) => ({
      openTime: k[0],
      open: k[1],
      high: k[2],
      low: k[3],
      close: k[4],
      volume: k[5],
      closeTime: k[6],
      quoteAssetVolume: k[7],
      numberOfTrades: k[8],
      takerBuyBaseAssetVolume: k[9],
      takerBuyQuoteAssetVolume: k[10],
      ignore: k[11]
    }));
    
    setCache(cacheKey, klines);
    return klines;
  } catch (error) {
    console.error(`[BinanceService] Klines fetch error for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch order book
 */
export async function fetchBinanceOrderBook(symbol: string, limit: number = 20): Promise<BinanceOrderBook | null> {
  try {
    const response = await fetch(
      `${BINANCE_BASE_URL}/api/v3/depth?symbol=${symbol}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[BinanceService] Order book fetch error for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch recent trades
 */
export async function fetchBinanceTrades(symbol: string, limit: number = 20): Promise<BinanceTrade[]> {
  try {
    const response = await fetch(
      `${BINANCE_BASE_URL}/api/v3/trades?symbol=${symbol}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[BinanceService] Trades fetch error for ${symbol}:`, error);
    return [];
  }
}

/**
 * Get chart data formatted for Chart.js
 */
export async function fetchBinanceChartData(
  symbol: string, 
  interval: string = '1h', 
  limit: number = 100
): Promise<BinanceChartData> {
  const klines = await fetchBinanceKlines(symbol, interval, limit);
  
  const prices = klines.map(k => parseFloat(k.close));
  const volumes = klines.map(k => parseFloat(k.volume));
  const times = klines.map(k => k.openTime);
  
  return {
    prices,
    volumes,
    times
  };
}

/**
 * Get comprehensive crypto data
 */
export async function fetchBinanceCryptoData(coinId: string): Promise<BinanceCryptoData | null> {
  const symbol = coinIdToBinanceSymbol(coinId);
  const ticker = await fetchBinanceTicker(symbol);
  
  if (!ticker) return null;
  
  return {
    symbol: ticker.symbol,
    currentPrice: parseFloat(ticker.lastPrice),
    priceChange: parseFloat(ticker.priceChange),
    priceChangePercent: parseFloat(ticker.priceChangePercent),
    highPrice: parseFloat(ticker.highPrice),
    lowPrice: parseFloat(ticker.lowPrice),
    volume: parseFloat(ticker.volume),
    quoteVolume: parseFloat(ticker.quoteVolume),
    bidPrice: parseFloat(ticker.bidPrice),
    askPrice: parseFloat(ticker.askPrice),
    openPrice: parseFloat(ticker.openPrice)
  };
}

/**
 * Format price with appropriate decimals
 */
export function formatBinancePrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(4)}`;
  if (price >= 0.01) return `$${price.toFixed(6)}`;
  return `$${price.toFixed(8)}`;
}

/**
 * Format percentage
 */
export function formatBinancePercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format volume
 */
export function formatBinanceVolume(volume: number): string {
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
  return volume.toFixed(2);
}

/**
 * Get Binance interval from timeframe (optimized for 1000 candle limit)
 */
export function getBinanceInterval(timeFrame: TimeFrame): string {
  const intervalMap: Record<TimeFrame, string> = {
    '1H': '1m',      // 60 candles = 1 hour
    '1D': '5m',      // 288 candles = 24 hours
    '1W': '15m',     // 672 candles = 7 days
    '1M': '1h',      // 720 candles = 30 days
    '1Y': '1d',      // 365 candles = 1 year
    '3Y': '3d',      // 365 candles = 1095 days (~3 years)
    'ALL': '1d'      // 1000 candles = maximum
  };
  
  return intervalMap[timeFrame] || '1h';
}

/**
 * Get limit for chart based on timeframe (optimized for 1000 candle limit)
 */
export function getBinanceLimit(timeframe: string): number {
  const limitMap: Record<string, number> = {
    '1H': 60,      // 60 x 1m = 1 hour
    '1D': 288,     // 288 x 5m = 24 hours
    '1W': 672,     // 672 x 15m = 7 days
    '1M': 720,     // 720 x 1h = 30 days
    '1Y': 365,     // 365 x 1d = 1 year
    '3Y': 365,     // 365 x 3d = 1095 days (~3 years)
    'ALL': 1000    // Maximum allowed by Binance
  };
  
  return limitMap[timeframe] || 100;
}
