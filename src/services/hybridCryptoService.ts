/**
 * Hybrid Crypto Service - Best of Both Worlds
 * Binance for real-time data + CryptoCompare for historical charts
 */

export interface HybridCryptoData {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  marketCap?: number;
  chartData: HybridChartData;
}

export interface HybridChartData {
  prices: number[];
  volumes: number[];
  times: number[];
  highs: number[];
  lows: number[];
  opens: number[];
}

const BINANCE_BASE_URL = 'https://api.binance.com';
const CRYPTOCOMPARE_BASE_URL = 'https://min-api.cryptocompare.com/data/v2';

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 seconds for Binance
const CHART_CACHE_DURATION = 60000; // 1 minute for charts

/**
 * Get cached data or fetch new
 */
function getFromCache<T>(key: string, duration: number = CACHE_DURATION): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < duration) {
    return cached.data;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch real-time data from Binance
 */
export async function fetchBinanceTicker(symbol: string) {
  const cacheKey = `binance_ticker_${symbol}`;
  const cached = getFromCache(cacheKey);
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
    console.error(`[HybridCryptoService] Binance ticker error for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch chart data from CryptoCompare
 */
export async function fetchCryptoCompareChart(symbol: string, interval: string = 'hour', limit: number = 168) {
  const cacheKey = `cc_chart_${symbol}_${interval}_${limit}`;
  const cached = getFromCache(cacheKey, CHART_CACHE_DURATION);
  if (cached) return cached;

  try {
    // Map interval to CryptoCompare function
    const functionMap: Record<string, string> = {
      'minute': 'histominute',
      'hour': 'histohour',
      'day': 'histoday'
    };

    const func = functionMap[interval] || 'histohour';
    
    const response = await fetch(
      `${CRYPTOCOMPARE_BASE_URL}/${func}?fsym=${symbol}&tsym=USD&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error(`CryptoCompare API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.Response !== 'Success') {
      throw new Error(data.Message || 'CryptoCompare API error');
    }
    
    // Transform data to our format
    const chartData = data.Data.Data.map((item: any) => ({
      time: item.time * 1000, // Convert to milliseconds
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volumeto
    }));
    
    setCache(cacheKey, chartData);
    return chartData;
  } catch (error) {
    console.error(`[HybridCryptoService] CryptoCompare chart error for ${symbol}:`, error);
    return [];
  }
}

/**
 * Get comprehensive crypto data combining both APIs
 */
export async function fetchHybridCryptoData(coinId: string, symbol: string): Promise<HybridCryptoData | null> {
  try {
    // Fetch both data sources concurrently
    const [binanceData, chartData] = await Promise.all([
      fetchBinanceTicker(symbol),
      fetchCryptoCompareChart(symbol)
    ]);
    
    if (!binanceData) {
      throw new Error('Failed to fetch Binance data');
    }
    
    // Transform Binance data
    const hybridData: HybridCryptoData = {
      symbol: binanceData.symbol,
      name: binanceData.symbol.replace('USDT', ''),
      currentPrice: parseFloat(binanceData.lastPrice),
      priceChange: parseFloat(binanceData.priceChange),
      priceChangePercent: parseFloat(binanceData.priceChangePercent),
      highPrice: parseFloat(binanceData.highPrice),
      lowPrice: parseFloat(binanceData.lowPrice),
      volume: parseFloat(binanceData.volume),
      chartData: {
        prices: chartData.map((d: any) => d.close),
        volumes: chartData.map((d: any) => d.volume),
        times: chartData.map((d: any) => d.time),
        highs: chartData.map((d: any) => d.high),
        lows: chartData.map((d: any) => d.low),
        opens: chartData.map((d: any) => d.open)
      }
    };
    
    return hybridData;
  } catch (error) {
    console.error(`[HybridCryptoService] Hybrid fetch error for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get chart data for specific timeframe
 */
export async function fetchHybridChartData(
  symbol: string, 
  timeframe: string
): Promise<HybridChartData> {
  // Map timeframe to CryptoCompare parameters
  const timeframeMap: Record<string, { interval: string; limit: number }> = {
    '1H': { interval: 'minute', limit: 60 },
    '1D': { interval: 'minute', limit: 1440 },
    '1W': { interval: 'hour', limit: 168 },
    '1M': { interval: 'hour', limit: 720 },
    '1Y': { interval: 'day', limit: 365 },
    'ALL': { interval: 'day', limit: 2000 }
  };
  
  const config = timeframeMap[timeframe] || timeframeMap['1W'];
  const chartData = await fetchCryptoCompareChart(symbol, config.interval, config.limit);
  
  return {
    prices: chartData.map((d: any) => d.close),
    volumes: chartData.map((d: any) => d.volume),
    times: chartData.map((d: any) => d.time),
    highs: chartData.map((d: any) => d.high),
    lows: chartData.map((d: any) => d.low),
    opens: chartData.map((d: any) => d.open)
  };
}

/**
 * Format price with appropriate decimals
 */
export function formatHybridPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(4)}`;
  if (price >= 0.01) return `$${price.toFixed(6)}`;
  return `$${price.toFixed(8)}`;
}

/**
 * Format percentage
 */
export function formatHybridPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format volume
 */
export function formatHybridVolume(volume: number): string {
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
  return volume.toFixed(2);
}

/**
 * Convert CoinGecko ID to symbol for CryptoCompare
 */
export function coinIdToCryptoCompareSymbol(coinId: string): string {
  const symbolMap: Record<string, string> = {
    'bitcoin': 'BTC',
    'ethereum': 'ETH',
    'the-open-network': 'TON',
    'ton': 'TON',
    'notcoin': 'NOT',
    'not': 'NOT',
    'binancecoin': 'BNB',
    'ripple': 'XRP',
    'cardano': 'ADA',
    'solana': 'SOL',
    'dogecoin': 'DOGE',
    'polkadot': 'DOT',
    'avalanche-2': 'AVAX',
    'chainlink': 'LINK',
    'polygon': 'MATIC',
    'uniswap': 'UNI',
    'litecoin': 'LTC',
    'stellar': 'XLM',
    'cosmos': 'ATOM',
    'near': 'NEAR',
    'filecoin': 'FIL',
    'tron': 'TRX',
    'ethereum-classic': 'ETC',
    'monero': 'XMR',
    'zcash': 'ZEC',
    'dash': 'DASH',
    'neo': 'NEO',
    'maker': 'MKR',
    'compound': 'COMP',
    'aave': 'AAVE',
    'sushi': 'SUSHI',
    'curve-dao-token': 'CRV',
    'yearn-finance': 'YFI',
    'helium': 'HNT',
    'fantom': 'FTM',
    'arweave': 'AR',
    'the-sandbox': 'SAND',
    'decentraland': 'MANA',
    'axie-infinity': 'AXS',
    'enjincoin': 'ENJ',
    'chiliz': 'CHZ',
    'flow': 'FLOW',
    'quant': 'QNT',
    'theta-token': 'THETA',
    'klay': 'KLAY',
    'huobi-token': 'HT',
    'elrond-erd-2': 'EGLD',
    'harmony': 'ONE',
    'stacks': 'STX',
    'pancakeswap-token': 'CAKE',
    'crypto-com-chain': 'CRO',
    'the-graph': 'GRT',
    'okb': 'OKB',
    'ftx-token': 'FTT',
    'gatechain-token': 'GT',
    'telcoin': 'TEL',
    'bittorrent': 'BTT',
    'numeraire': 'NMR',
    'ren': 'REN',
    'kava': 'KAVA',
    'zilliqa': 'ZIL',
    '0x': 'ZRX',
    'basic-attention-token': 'BAT',
    'decred': 'DCR',
    'waves': 'WAVES',
    'status': 'SNT',
    'dai': 'DAI',
    'nexo': 'NEXO',
    'cdp': 'LDO',
    'gemini-dollar': 'GUSD',
    'true-usd': 'TUSD',
    'paxos-standard': 'PAX',
    'usd-coin': 'USDC',
    'tether': 'USDT',
    'binance-usd': 'BUSD',
    'wrapped-bitcoin': 'WBTC',
    'stasis-eurs': 'EURS',
    'leo-token': 'LEO',
    'havven': 'SNX',
    'icon': 'ICX',
    'iota': 'MIOTA',
    'vechain': 'VET',
    'thorchain': 'RUNE',
    'wink': 'WIN',
    'holo': 'HOT',
    'ontology': 'ONT',
    'digibyte': 'DGB',
    'qtum': 'QTUM',
    'zcoin': 'XZC',
    'bytecoin': 'BCN',
    'siacoin': 'SC',
    'lisk': 'LSK',
    'steem': 'STEEM',
    'bitshares': 'BTS',
    'golem': 'GNT',
    'augur': 'REP',
    'first-digital-usd': 'FDUSD'
  };
  
  return symbolMap[coinId] || coinId.toUpperCase();
}
