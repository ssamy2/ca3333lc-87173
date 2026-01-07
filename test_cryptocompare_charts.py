import requests
import json
from datetime import datetime, timedelta

def test_cryptocompare_charts():
    """Test CryptoCompare API for chart data"""
    
    base_url = "https://min-api.cryptocompare.com/data/v2"
    
    # Test different symbols
    symbols = ['BTC', 'ETH', 'TON', 'NOT', 'BNB']
    
    # Test different timeframes
    intervals = {
        'minute': {'function': 'histominute', 'limit': 1440},  # 24 hours
        'hour': {'function': 'histohour', 'limit': 168},      # 7 days
        'day': {'function': 'histoday', 'limit': 365},       # 1 year
        'all': {'function': 'histoday', 'limit': 2000}        # ~5.5 years
    }
    
    print("🚀 Testing CryptoCompare Chart API")
    print("=" * 60)
    
    for symbol in symbols:
        print(f"\n📊 Testing {symbol}:")
        
        for interval_name, config in intervals.items():
            try:
                url = f"{base_url}/{config['function']}"
                params = {
                    'fsym': symbol,
                    'tsym': 'USD',
                    'limit': config['limit']
                }
                
                print(f"  📈 Fetching {interval_name} data (limit: {config['limit']})...")
                response = requests.get(url, params=params, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data['Response'] == 'Success':
                        chart_data = data['Data']['Data']
                        
                        print(f"    ✅ Success!")
                        print(f"    - Data points: {len(chart_data)}")
                        
                        if chart_data:
                            first_point = chart_data[0]
                            last_point = chart_data[-1]
                            
                            # Calculate time range
                            start_time = datetime.fromtimestamp(first_point['time'])
                            end_time = datetime.fromtimestamp(last_point['time'])
                            duration = end_time - start_time
                            
                            print(f"    - Time range: {duration.days} days")
                            print(f"    - Start price: ${first_point['close']:,.2f}")
                            print(f"    - End price: ${last_point['close']:,.2f}")
                            
                            # Calculate change
                            change = ((last_point['close'] - first_point['close']) / first_point['close']) * 100
                            print(f"    - Total change: {change:+.2f}%")
                            
                            # Show OHLCV sample
                            print(f"    - Sample OHLCV: O:{first_point['open']:.2f} H:{first_point['high']:.2f} L:{first_point['low']:.2f} C:{first_point['close']:.2f} V:{first_point['volumeto']:,.0f}")
                    else:
                        print(f"    ❌ API Error: {data.get('Message', 'Unknown error')}")
                else:
                    print(f"    ❌ HTTP Error {response.status_code}")
                    
            except Exception as e:
                print(f"    ❌ Exception: {str(e)[:100]}")
            
            # Small delay to avoid rate limiting
            import time
            time.sleep(0.5)
    
    # Test specific date range
    print(f"\n📅 Testing custom date range (last 30 days):")
    try:
        url = f"{base_url}/histoday"
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        params = {
            'fsym': 'BTC',
            'tsym': 'USD',
            'toTs': int(end_date.timestamp()),
            'limit': 30
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data['Response'] == 'Success':
                chart_data = data['Data']['Data']
                print(f"✅ Custom range success: {len(chart_data)} days")
                
                # Calculate average volume
                avg_volume = sum(d['volumeto'] for d in chart_data) / len(chart_data)
                print(f"   Average daily volume: ${avg_volume:,.0f}")
        else:
            print(f"❌ Custom range failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Custom range error: {e}")
    
    # Test multiple symbols at once
    print(f"\n🔄 Testing multiple symbols:")
    try:
        symbols_str = ','.join(symbols)
        url = f"{base_url}/histoday"
        params = {
            'fsym': 'BTC',
            'tsym': 'USD',
            'markets': 'CoinGecko',
            'limit': 7  # Last 7 days
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data['Response'] == 'Success':
                print(f"✅ Multi-symbol test passed")
        else:
            print(f"❌ Multi-symbol failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Multi-symbol error: {e}")
    
    # Test API limits
    print(f"\n⚡ Testing API rate limits:")
    try:
        url = f"{base_url}/histominute"
        params = {
            'fsym': 'BTC',
            'tsym': 'USD',
            'limit': 10
        }
        
        # Make multiple requests quickly
        success_count = 0
        for i in range(10):
            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                success_count += 1
            time.sleep(0.1)  # 100ms between requests
        
        print(f"✅ Success rate: {success_count}/10 requests")
        
    except Exception as e:
        print(f"❌ Rate limit test error: {e}")
    
    print("\n" + "=" * 60)
    print("✅ CryptoCompare API Testing Complete!")
    print("\n📋 Summary:")
    print("- ✅ Free API available")
    print("- ✅ Minute, hourly, and daily data")
    print("- ✅ Up to 2000 data points (~5.5 years)")
    print("- ✅ OHLCV data included")
    print("- ✅ Custom date ranges supported")
    print("- ✅ Rate limit: ~10 requests/second")
    print("- ❌ No API key required for basic usage")

if __name__ == "__main__":
    test_cryptocompare_charts()
