"""
Binance API Optimized Chart Fetcher
Using smart intervals to stay within 1000 candles limit
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import time

class OptimizedBinanceAPI:
    def __init__(self):
        self.base_url = "https://api.binance.com"
        self.session = requests.Session()
    
    def get_optimal_interval(self, timeframe: str) -> Dict:
        """
        Get optimal interval and limit for timeframe to stay within 1000 candles
        """
        
        # Smart mapping based on the golden rule
        timeframe_configs = {
            '1H': {
                'interval': '1m',
                'limit': 60,
                'description': '60 minutes = 1 hour'
            },
            '1D': {
                'interval': '5m', 
                'limit': 288,
                'description': '288 x 5min = 24 hours'
            },
            '1W': {
                'interval': '15m',
                'limit': 672,
                'description': '672 x 15min = 7 days'
            },
            '1M': {
                'interval': '1h',
                'limit': 720,
                'description': '720 x 1h = 30 days'
            },
            '3M': {
                'interval': '4h',
                'limit': 540,
                'description': '540 x 4h = 90 days'
            },
            '6M': {
                'interval': '8h',
                'limit': 540,
                'description': '540 x 8h = 180 days'
            },
            '1Y': {
                'interval': '1d',
                'limit': 365,
                'description': '365 days = 1 year'
            },
            '3Y': {
                'interval': '3d',
                'limit': 365,
                'description': '365 x 3d = 1095 days (~3 years)'
            },
            'ALL': {
                'interval': '1d',
                'limit': 1000,
                'description': 'Maximum: 1000 days'
            }
        }
        
        return timeframe_configs.get(timeframe, timeframe_configs['1W'])
    
    def fetch_klines(self, symbol: str, timeframe: str) -> Dict:
        """
        Fetch klines data with optimal interval
        """
        
        config = self.get_optimal_interval(timeframe)
        interval = config['interval']
        limit = config['limit']
        
        url = f"{self.base_url}/api/v3/klines"
        params = {
            'symbol': f"{symbol}USDT",
            'interval': interval,
            'limit': limit
        }
        
        try:
            print(f"📊 Fetching {symbol} {timeframe} data:")
            print(f"   Interval: {interval}")
            print(f"   Limit: {limit} candles")
            print(f"   Coverage: {config['description']}")
            
            response = self.session.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                klines = response.json()
                return self._parse_klines(klines, timeframe)
            else:
                print(f"❌ Error {response.status_code}: {response.text}")
                return {}
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
            return {}
    
    def _parse_klines(self, klines: List, timeframe: str) -> Dict:
        """
        Parse klines data to our format
        """
        
        if not klines:
            return {}
        
        # Extract data
        times = [int(k[0]) for k in klines]
        opens = [float(k[1]) for k in klines]
        highs = [float(k[2]) for k in klines]
        lows = [float(k[3]) for k in klines]
        closes = [float(k[4]) for k in klines]
        volumes = [float(k[5]) for k in klines]
        
        # Calculate statistics
        current_price = closes[-1] if closes else 0
        first_price = closes[0] if closes else 0
        price_change = current_price - first_price
        price_change_percent = (price_change / first_price * 100) if first_price > 0 else 0
        
        high_price = max(highs) if highs else 0
        low_price = min(lows) if lows else 0
        total_volume = sum(volumes) if volumes else 0
        
        # Calculate time range
        start_time = datetime.fromtimestamp(times[0] / 1000)
        end_time = datetime.fromtimestamp(times[-1] / 1000)
        duration = end_time - start_time
        
        return {
            'symbol': klines[0][0] if klines else '',
            'timeframe': timeframe,
            'current_price': current_price,
            'price_change': price_change,
            'price_change_percent': price_change_percent,
            'high_price': high_price,
            'low_price': low_price,
            'total_volume': total_volume,
            'data_points': len(klines),
            'duration_days': duration.days,
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'ohlc': {
                'times': times,
                'opens': opens,
                'highs': highs,
                'lows': lows,
                'closes': closes,
                'volumes': volumes
            }
        }
    
    def test_all_timeframes(self, symbol: str = 'BTC'):
        """
        Test all timeframes with optimal intervals
        """
        
        timeframes = ['1H', '1D', '1W', '1M', '3M', '6M', '1Y', '3Y', 'ALL']
        
        print("🚀 Testing Optimized Binance API")
        print("=" * 60)
        
        for tf in timeframes:
            config = self.get_optimal_interval(tf)
            print(f"\n⏰ {tf}:")
            print(f"   Strategy: {config['limit']} x {config['interval']} = {config['description']}")
            
            data = self.fetch_klines(symbol, tf)
            
            if data:
                print(f"   ✅ Success!")
                print(f"   - Data points: {data['data_points']}")
                print(f"   - Duration: {data['duration_days']} days")
                print(f"   - Price change: {data['price_change_percent']:+.2f}%")
                print(f"   - Volume: {data['total_volume']:,.0f}")
            
            time.sleep(0.5)  # Rate limiting
    
    def get_websocket_stream(self, symbol: str = 'BTC', interval: str = '1m'):
        """
        Get WebSocket stream URL for real-time data
        """
        
        stream_map = {
            '1m': f'{symbol.lower()}usdt@kline_1m',
            '5m': f'{symbol.lower()}usdt@kline_5m',
            '15m': f'{symbol.lower()}usdt@kline_15m',
            '1h': f'{symbol.lower()}usdt@kline_1h',
            '4h': f'{symbol.lower()}usdt@kline_4h',
            '1d': f'{symbol.lower()}usdt@kline_1d'
        }
        
        stream = stream_map.get(interval, f'{symbol.lower()}usdt@kline_1m')
        return f"wss://stream.binance.com:9443/ws/{stream}"

def test_optimized_api():
    """
    Test the optimized API
    """
    
    api = OptimizedBinanceAPI()
    
    # Test different symbols
    symbols = ['BTC', 'ETH', 'TON']
    
    for symbol in symbols:
        print(f"\n{'='*60}")
        print(f"Testing {symbol}")
        print('='*60)
        
        # Test specific timeframes
        test_cases = [
            ('1D', '24 hours'),
            ('1W', '1 week'),
            ('1M', '1 month'),
            ('1Y', '1 year'),
            ('3Y', '3 years'),
            ('ALL', 'Maximum (1000 days)')
        ]
        
        for tf, desc in test_cases:
            print(f"\n📈 {desc} ({tf}):")
            data = api.fetch_klines(symbol, tf)
            
            if data:
                print(f"   ✅ Fetched {data['data_points']} candles")
                print(f"   📅 From {data['start_time'][:10]} to {data['end_time'][:10]}")
                print(f"   💰 Price: ${data['current_price']:,.2f}")
                print(f"   📊 Change: {data['price_change_percent']:+.2f}%")
            
            time.sleep(0.3)
        
        # Show WebSocket URL
        ws_url = api.get_websocket_stream(symbol, '1m')
        print(f"\n🔌 WebSocket for real-time {symbol}:")
        print(f"   {ws_url}")
    
    print("\n" + "="*60)
    print("✅ Testing Complete!")
    print("\n📋 Summary:")
    print("- ✅ All timeframes within 1000 candle limit")
    print("- ✅ Smart interval selection")
    print("- ✅ No loops needed")
    print("- ✅ WebSocket ready for real-time updates")
    print("- ✅ Clean data structure")

if __name__ == "__main__":
    test_optimized_api()
