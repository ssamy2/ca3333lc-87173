"""
Hybrid Crypto API - Best of Free Sources
Combines multiple free APIs for comprehensive data
"""

import requests
import asyncio
import aiohttp
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import json

class HybridCryptoAPI:
    def __init__(self):
        self.sources = {
            'binance': BinanceSource(),
            'coingecko': CoinGeckoSource(),
            'cryptocompare': CryptoCompareSource(),
            'kraken': KrakenSource()
        }
    
    async def get_complete_data(self, symbol: str, coin_id: str = None) -> Dict:
        """Get comprehensive data from all sources"""
        results = {}
        
        # Fetch from all sources concurrently
        tasks = []
        for name, source in self.sources.items():
            if name == 'binance':
                tasks.append(source.get_data(symbol))
            elif name == 'coingecko' and coin_id:
                tasks.append(source.get_data(coin_id))
            else:
                tasks.append(source.get_data(symbol.lower()))
        
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Combine results
        source_names = list(self.sources.keys())
        for i, response in enumerate(responses):
            if not isinstance(response, Exception):
                results[source_names[i]] = response
        
        # Merge data with priority: Binance > CoinGecko > Others
        merged = self.merge_data(results)
        return merged
    
    def merge_data(self, results: Dict) -> Dict:
        """Merge data from multiple sources"""
        merged = {
            'symbol': '',
            'name': '',
            'price': 0,
            'change_24h': 0,
            'change_24h_percent': 0,
            'high_24h': 0,
            'low_24h': 0,
            'volume_24h': 0,
            'market_cap': 0,
            'chart_data': {'prices': [], 'volumes': [], 'times': []},
            'sources': list(results.keys())
        }
        
        # Priority order for data
        priority = ['binance', 'coingecko', 'cryptocompare', 'kraken']
        
        for source in priority:
            if source in results:
                data = results[source]
                
                # Basic info
                if not merged['symbol'] and data.get('symbol'):
                    merged['symbol'] = data['symbol']
                if not merged['name'] and data.get('name'):
                    merged['name'] = data['name']
                
                # Price data (Binance has most accurate)
                if source == 'binance' or not merged['price']:
                    merged['price'] = data.get('price', merged['price'])
                    merged['change_24h'] = data.get('change_24h', merged['change_24h'])
                    merged['change_24h_percent'] = data.get('change_24h_percent', merged['change_24h_percent'])
                    merged['high_24h'] = data.get('high_24h', merged['high_24h'])
                    merged['low_24h'] = data.get('low_24h', merged['low_24h'])
                    merged['volume_24h'] = data.get('volume_24h', merged['volume_24h'])
                
                # Market cap (CoinGecko has this)
                if source == 'coingecko' or not merged['market_cap']:
                    merged['market_cap'] = data.get('market_cap', merged['market_cap'])
                
                # Chart data (use most complete)
                chart = data.get('chart_data', {})
                if len(chart.get('prices', [])) > len(merged['chart_data']['prices']):
                    merged['chart_data'] = chart
        
        return merged

class BinanceSource:
    async def get_data(self, symbol: str) -> Dict:
        """Get data from Binance API"""
        try:
            # Get ticker data
            ticker_url = f"https://api.binance.com/api/v3/ticker/24hr?symbol={symbol}USDT"
            async with aiohttp.ClientSession() as session:
                async with session.get(ticker_url) as response:
                    if response.status == 200:
                        ticker = await response.json()
                        
                        # Get chart data
                        chart_url = f"https://api.binance.com/api/v3/klines?symbol={symbol}USDT&interval=1h&limit=168"
                        async with session.get(chart_url) as chart_response:
                            chart_data = []
                            if chart_response.status == 200:
                                klines = await chart_response.json()
                                chart_data = {
                                    'prices': [float(k[4]) for k in klines],
                                    'volumes': [float(k[5]) for k in klines],
                                    'times': [k[0] for k in klines]
                                }
                        
                        return {
                            'symbol': ticker['symbol'],
                            'price': float(ticker['lastPrice']),
                            'change_24h': float(ticker['priceChange']),
                            'change_24h_percent': float(ticker['priceChangePercent']),
                            'high_24h': float(ticker['highPrice']),
                            'low_24h': float(ticker['lowPrice']),
                            'volume_24h': float(ticker['volume']),
                            'chart_data': chart_data
                        }
        except Exception as e:
            print(f"Binance error: {e}")
            return {}

class CoinGeckoSource:
    async def get_data(self, coin_id: str) -> Dict:
        """Get data from CoinGecko API"""
        try:
            # Get market data
            url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart?vs_currency=usd&days=365"
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Get coin info
                        info_url = f"https://api.coingecko.com/api/v3/coins/{coin_id}"
                        async with session.get(info_url) as info_response:
                            info = await info_response.json() if info_response.status == 200 else {}
                        
                        # Process chart data (sample every 24 hours for daily data)
                        prices = data.get('prices', [])
                        daily_prices = []
                        daily_volumes = []
                        daily_times = []
                        
                        for i in range(0, len(prices), 24):  # Sample every 24 hours
                            if i < len(prices):
                                daily_prices.append(prices[i][1])
                                daily_times.append(prices[i][0])
                        
                        volumes = data.get('total_volumes', [])
                        for i in range(0, len(volumes), 24):
                            if i < len(volumes):
                                daily_volumes.append(volumes[i][1])
                        
                        # Calculate 24h change
                        current_price = prices[-1][1] if prices else 0
                        prev_price = prices[-2][1] if len(prices) > 1 else current_price
                        change_24h = current_price - prev_price
                        change_24h_percent = (change_24h / prev_price * 100) if prev_price > 0 else 0
                        
                        return {
                            'symbol': info.get('symbol', '').upper(),
                            'name': info.get('name', ''),
                            'price': current_price,
                            'change_24h': change_24h,
                            'change_24h_percent': change_24h_percent,
                            'market_cap': info.get('market_data', {}).get('market_cap', {}).get('usd', 0),
                            'chart_data': {
                                'prices': daily_prices,
                                'volumes': daily_volumes,
                                'times': daily_times
                            }
                        }
        except Exception as e:
            print(f"CoinGecko error: {e}")
            return {}

class CryptoCompareSource:
    async def get_data(self, symbol: str) -> Dict:
        """Get data from CryptoCompare API (free tier)"""
        try:
            # Get daily data for last 2 years
            url = f"https://min-api.cryptocompare.com/data/v2/histoday?fsym={symbol.upper()}&tsym=USD&limit=730"
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if data['Response'] == 'Success':
                            daily_data = data['Data']['Data']
                            
                            prices = [d['close'] for d in daily_data]
                            volumes = [d['volumeto'] for d in daily_data]
                            times = [d['time'] * 1000 for d in daily_data]  # Convert to milliseconds
                            
                            # Calculate 24h change
                            current_price = prices[-1] if prices else 0
                            prev_price = prices[-2] if len(prices) > 1 else current_price
                            change_24h = current_price - prev_price
                            change_24h_percent = (change_24h / prev_price * 100) if prev_price > 0 else 0
                            
                            return {
                                'symbol': symbol.upper(),
                                'price': current_price,
                                'change_24h': change_24h,
                                'change_24h_percent': change_24h_percent,
                                'volume_24h': volumes[-1] if volumes else 0,
                                'chart_data': {
                                    'prices': prices,
                                    'volumes': volumes,
                                    'times': times
                                }
                            }
        except Exception as e:
            print(f"CryptoCompare error: {e}")
            return {}

class KrakenSource:
    async def get_data(self, symbol: str) -> Dict:
        """Get data from Kraken API"""
        try:
            # Map symbols to Kraken format
            symbol_map = {
                'BTC': 'XXBTZUSD',
                'ETH': 'XETHZUSD',
                'TON': 'TONUSDT',
                'NOT': 'NOTUSDT'
            }
            
            kraken_symbol = symbol_map.get(symbol.upper(), f"{symbol.upper()}USD")
            
            # Get ticker data
            url = f"https://api.kraken.com/0/public/Ticker?pair={kraken_symbol}"
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if data['error']:
                            return {}
                        
                        result = list(data['result'].values())[0]
                        
                        return {
                            'symbol': symbol.upper(),
                            'price': float(result['c'][0]),
                            'change_24h_percent': float(result['p']) if result['p'] else 0,
                            'volume_24h': float(result['v'][1]) if len(result['v']) > 1 else 0,
                            'high_24h': float(result['h'][1]) if len(result['h']) > 1 else 0,
                            'low_24h': float(result['l'][1]) if len(result['l']) > 1 else 0
                        }
        except Exception as e:
            print(f"Kraken error: {e}")
            return {}

# Test the hybrid API
async def test_hybrid_api():
    api = HybridCryptoAPI()
    
    # Test different coins
    test_coins = [
        ('BTC', 'bitcoin'),
        ('ETH', 'ethereum'),
        ('TON', 'the-open-network'),
        ('NOT', 'notcoin')
    ]
    
    print("🚀 Testing Hybrid Crypto API")
    print("=" * 60)
    
    for symbol, coin_id in test_coins:
        print(f"\n📊 Testing {symbol}:")
        data = await api.get_complete_data(symbol, coin_id)
        
        print(f"  Symbol: {data['symbol']}")
        print(f"  Name: {data['name']}")
        print(f"  Price: ${data['price']:,.6f}")
        print(f"  24h Change: {data['change_24h_percent']:+.2f}%")
        print(f"  High 24h: ${data['high_24h']:,.6f}")
        print(f"  Low 24h: ${data['low_24h']:,.6f}")
        print(f"  Volume 24h: {data['volume_24h']:,.0f}")
        print(f"  Market Cap: ${data['market_cap']:,.0f}")
        print(f"  Chart Points: {len(data['chart_data']['prices'])}")
        print(f"  Sources: {', '.join(data['sources'])}")
    
    print("\n✅ Hybrid API Test Complete!")

if __name__ == "__main__":
    asyncio.run(test_hybrid_api())
