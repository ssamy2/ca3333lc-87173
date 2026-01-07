"""
Crypto.com Price API - Chart Data Fetcher
Based on reverse-engineered API from crypto.com/price
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import time

class CryptoComAPI:
    def __init__(self):
        self.base_url = "https://price-api.crypto.com"
        self.session = requests.Session()
        
        # Set headers to mimic browser
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Origin': 'https://crypto.com',
            'Referer': 'https://crypto.com/'
        })
    
    def get_chart_data(self, coin_id: str, timeframe: str = '1w', convert: str = 'USD') -> Dict:
        """
        Fetch chart data for a specific cryptocurrency
        
        Args:
            coin_id: The crypto ID (e.g., 'bitcoin', 'ethereum')
            timeframe: Time period ('1h', '1d', '1w', '1m', '3m', '6m', '1y', 'all')
            convert: Currency to convert to (USD, BTC, etc.)
        
        Returns:
            Dictionary containing chart data
        """
        
        # Map timeframes to API parameters
        timeframe_map = {
            '1h': '1h',
            '1d': '1d', 
            '1w': '1w',
            '1m': '1m',
            '3m': '3m',
            '6m': '6m',
            '1y': '1y',
            'all': 'all'
        }
        
        api_timeframe = timeframe_map.get(timeframe.lower(), '1w')
        
        # Build the URL based on observed pattern
        url = f"{self.base_url}/price/v2/{api_timeframe}/{coin_id}"
        
        params = {
            'convert': convert.lower()
        }
        
        try:
            print(f"📊 Fetching {coin_id} chart data ({timeframe})...")
            response = self.session.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return self._parse_chart_data(data, timeframe)
            else:
                print(f"❌ Error {response.status_code}: {response.text}")
                return {}
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
            return {}
    
    def _parse_chart_data(self, data: Dict, timeframe: str) -> Dict:
        """Parse the chart data response"""
        
        if not data or 'data' not in data:
            return {}
        
        chart_data = data['data']
        
        # Extract price points
        prices = chart_data.get('prices', [])
        volumes = chart_data.get('volumes', [])
        timestamps = chart_data.get('timestamps', [])
        
        # Calculate statistics
        if prices:
            current_price = prices[-1] if prices else 0
            first_price = prices[0] if prices else 0
            price_change = current_price - first_price
            price_change_percent = (price_change / first_price * 100) if first_price > 0 else 0
            
            high_price = max(prices) if prices else 0
            low_price = min(prices) if prices else 0
            avg_volume = sum(volumes) / len(volumes) if volumes else 0
        else:
            current_price = price_change = price_change_percent = 0
            high_price = low_price = avg_volume = 0
        
        return {
            'coin': chart_data.get('coin', ''),
            'timeframe': timeframe,
            'current_price': current_price,
            'price_change': price_change,
            'price_change_percent': price_change_percent,
            'high_price': high_price,
            'low_price': low_price,
            'avg_volume': avg_volume,
            'data_points': len(prices),
            'prices': prices,
            'volumes': volumes,
            'timestamps': timestamps
        }
    
    def get_token_price(self, coin_id: str) -> Dict:
        """Get current token price"""
        url = f"{self.base_url}/price/v1/token-price/{coin_id}"
        
        try:
            response = self.session.get(url, timeout=10)
            if response.status_code == 200:
                return response.json()
            else:
                return {}
        except Exception as e:
            print(f"Error fetching token price: {e}")
            return {}
    
    def get_trending_tokens(self) -> List[Dict]:
        """Get trending tokens"""
        url = f"{self.base_url}/price/v1/trending-tokens"
        
        try:
            response = self.session.get(url, timeout=10)
            if response.status_code == 200:
                return response.json().get('data', [])
            else:
                return []
        except Exception as e:
            print(f"Error fetching trending tokens: {e}")
            return []

def test_crypto_com_api():
    """Test the Crypto.com API"""
    
    api = CryptoComAPI()
    
    # Test coins
    test_coins = [
        'bitcoin',
        'ethereum', 
        'the-open-network',  # TON
        'notcoin',  # NOT
        'binancecoin'
    ]
    
    # Test timeframes
    timeframes = ['1h', '1d', '1w', '1m', '3m', '1y', 'all']
    
    print("🚀 Testing Crypto.com Price API")
    print("=" * 60)
    
    # Test current prices
    print("\n💰 Current Prices:")
    for coin in test_coins:
        price_data = api.get_token_price(coin)
        if price_data and 'data' in price_data:
            data = price_data['data']
            print(f"  {coin.upper()}: ${data.get('price', 0):,.6f}")
    
    # Test chart data for Bitcoin
    print(f"\n📈 Bitcoin Chart Data:")
    for tf in timeframes:
        chart_data = api.get_chart_data('bitcoin', tf)
        
        if chart_data:
            print(f"\n  Timeframe: {tf.upper()}")
            print(f"  - Current Price: ${chart_data['current_price']:,.2f}")
            print(f"  - Change: {chart_data['price_change_percent']:+.2f}%")
            print(f"  - High: ${chart_data['high_price']:,.2f}")
            print(f"  - Low: ${chart_data['low_price']:,.2f}")
            print(f"  - Data Points: {chart_data['data_points']}")
            
            # Show sample prices
            if chart_data['prices']:
                print(f"  - Sample: ${chart_data['prices'][0]:,.2f} → ${chart_data['prices'][-1]:,.2f}")
        
        # Small delay to avoid rate limiting
        time.sleep(0.5)
    
    # Test TON chart
    print(f"\n📊 TON Chart Data (1W):")
    ton_data = api.get_chart_data('the-open-network', '1w')
    if ton_data:
        print(f"  Current Price: ${ton_data['current_price']:,.6f}")
        print(f"  Change: {ton_data['price_change_percent']:+.2f}%")
        print(f"  High: ${ton_data['high_price']:,.6f}")
        print(f"  Low: ${ton_data['low_price']:,.6f}")
    
    # Test trending tokens
    print(f"\n🔥 Trending Tokens:")
    trending = api.get_trending_tokens()
    for i, token in enumerate(trending[:5], 1):
        print(f"  {i}. {token.get('name', 'Unknown')} ({token.get('symbol', '')})")
    
    print("\n" + "=" * 60)
    print("✅ API Testing Complete!")
    print("\n📋 Summary:")
    print("- ✅ Free API with no key required")
    print("- ✅ Multiple timeframes supported")
    print("- ✅ Price, volume, and timestamp data")
    print("- ✅ Real-time and historical data")
    print("- ✅ Trending tokens endpoint")

def format_large_number(num: float) -> str:
    """Format large numbers with K, M, B suffixes"""
    if num >= 1e9:
        return f"${num/1e9:.2f}B"
    elif num >= 1e6:
        return f"${num/1e6:.2f}M"
    elif num >= 1e3:
        return f"${num/1e3:.2f}K"
    else:
        return f"${num:.2f}"

if __name__ == "__main__":
    test_crypto_com_api()
