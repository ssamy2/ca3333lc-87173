import requests
import json

# Test Binance API endpoints
base_url = "https://api.binance.com"

def test_endpoint(endpoint, params=None):
    """Test an API endpoint and return response"""
    try:
        url = f"{base_url}{endpoint}"
        response = requests.get(url, params=params, timeout=10)
        
        print(f"\n{'='*60}")
        print(f"Testing: {endpoint}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response Type: {type(data)}")
            
            if isinstance(data, list):
                print(f"Array Length: {len(data)}")
                if len(data) > 0:
                    print(f"First Item Keys: {list(data[0].keys()) if isinstance(data[0], dict) else 'Not a dict'}")
                    print(f"Sample Data (first item): {json.dumps(data[0], indent=2)[:500]}...")
            elif isinstance(data, dict):
                print(f"Object Keys: {list(data.keys())}")
                print(f"Sample Data: {json.dumps(data, indent=2)[:500]}...")
            
            return data
        else:
            print(f"Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"Exception: {e}")
        return None

# Test different endpoints
print("🚀 Testing Binance API Endpoints")

# 1. Get TON 24hr ticker data
print("\n1️⃣ TON 24hr Ticker Data:")
ton_data = test_endpoint("/api/v3/ticker/24hr", {"symbol": "TONUSDT"})

# 2. Get TON price
print("\n2️⃣ TON Current Price:")
price_data = test_endpoint("/api/v3/ticker/price", {"symbol": "TONUSDT"})

# 3. Get TON klines (chart data) - different timeframes
print("\n3️⃣ TON Chart Data (1h):")
klines_1h = test_endpoint("/api/v3/klines", {"symbol": "TONUSDT", "interval": "1h", "limit": 5})

print("\n4️⃣ TON Chart Data (1d):")
klines_1d = test_endpoint("/api/v3/klines", {"symbol": "TONUSDT", "interval": "1d", "limit": 7})

# 5. Get order book
print("\n5️⃣ TON Order Book:")
order_book = test_endpoint("/api/v3/depth", {"symbol": "TONUSDT", "limit": 5})

# 6. Get recent trades
print("\n6️⃣ TON Recent Trades:")
trades = test_endpoint("/api/v3/trades", {"symbol": "TONUSDT", "limit": 5})

# 7. Get server time
print("\n7️⃣ Server Time:")
server_time = test_endpoint("/api/v3/time")

# 8. Get exchange info
print("\n8️⃣ Exchange Info (TON):")
exchange_info = test_endpoint("/api/v3/exchangeInfo", {"symbol": "TONUSDT"})

# 9. Test with multiple symbols
print("\n9️⃣ Multiple Symbols Ticker:")
symbols_data = test_endpoint("/api/v3/ticker/24hr", {"symbols": json.dumps(['TONUSDT', 'BTCUSDT', 'ETHUSDT'])})

# 10. Get all 24hr tickers (first 5)
print("\n🔟 All 24hr Tickers (first 5):")
all_tickers = test_endpoint("/api/v3/ticker/24hr")
if all_tickers and len(all_tickers) > 0:
    print(f"Total tickers: {len(all_tickers)}")
    print("First 5 tickers:")
    for i, ticker in enumerate(all_tickers[:5]):
        print(f"  {i+1}. {ticker.get('symbol', 'N/A')}: ${float(ticker.get('lastPrice', 0)):,.6f}")

print("\n" + "="*60)
print("✅ API Testing Complete!")
print("="*60)
