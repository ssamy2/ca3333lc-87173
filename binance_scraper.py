import requests
import json
import time
from datetime import datetime

class BinanceCryptoScraper:
    def __init__(self):
        self.base_url = "https://api.binance.com"
        self.base_url_futures = "https://fapi.binance.com"
        
    def get_ticker_data(self, symbol):
        """Get all ticker data for a symbol"""
        try:
            url = f"{self.base_url}/api/v3/ticker/24hr"
            params = {'symbol': symbol}
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error fetching {symbol}: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error: {e}")
            return None
    
    def get_klines(self, symbol, interval='1h', limit=100):
        """Get candlestick data for chart"""
        try:
            url = f"{self.base_url}/api/v3/klines"
            params = {
                'symbol': symbol,
                'interval': interval,
                'limit': limit
            }
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error fetching klines for {symbol}: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error: {e}")
            return None
    
    def get_order_book(self, symbol, limit=20):
        """Get order book (buy/sell orders)"""
        try:
            url = f"{self.base_url}/api/v3/depth"
            params = {
                'symbol': symbol,
                'limit': limit
            }
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
        except Exception as e:
            print(f"Error: {e}")
            return None
    
    def get_price_stats(self, symbol):
        """Get current price and statistics"""
        try:
            url = f"{self.base_url}/api/v3/ticker/price"
            params = {'symbol': symbol}
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
        except Exception as e:
            print(f"Error: {e}")
            return None
    
    def format_number(self, num, prefix="$"):
        """Format large numbers"""
        if num >= 1e9:
            return f"{prefix}{num/1e9:.2f}B"
        elif num >= 1e6:
            return f"{prefix}{num/1e6:.2f}M"
        elif num >= 1e3:
            return f"{prefix}{num/1e3:.2f}K"
        else:
            return f"{prefix}{num:.2f}"
    
    def print_full_details(self, symbol):
        """Print all available details for a symbol"""
        print(f"\n{'='*60}")
        print(f"📊 {symbol} - Full Details from Binance")
        print(f"{'='*60}")
        
        # Get ticker data (24h stats)
        ticker = self.get_ticker_data(symbol)
        if ticker:
            print(f"\n📈 24 Hour Statistics:")
            print(f"  Current Price: ${float(ticker['lastPrice']):,.6f}")
            print(f"  Open Price: ${float(ticker['openPrice']):,.6f}")
            print(f"  High (24h): ${float(ticker['highPrice']):,.6f}")
            print(f"  Low (24h): ${float(ticker['lowPrice']):,.6f}")
            print(f"  Change (24h): {ticker['priceChange']} ({ticker['priceChangePercent']}%)")
            print(f"  Volume (24h): {self.format_number(float(ticker['volume']))}")
            print(f"  Quote Volume (24h): {self.format_number(float(ticker['quoteVolume']))}")
            
            # Calculate additional metrics
            high_low_change = ((float(ticker['highPrice']) - float(ticker['lowPrice'])) / float(ticker['lowPrice'])) * 100
            print(f"  High-Low Range: {high_low_change:.2f}%")
        
        # Get recent trades (last 10 prices for analysis)
        print(f"\n📊 Recent Price Action:")
        klines = self.get_klines(symbol, '5m', 10)
        if klines:
            prices = [float(k[4]) for k in klines]  # Close prices
            print(f"  5min ago: ${prices[0]:,.6f}")
            print(f"  Current: ${prices[-1]:,.6f}")
            if len(prices) > 1:
                change = ((prices[-1] - prices[0]) / prices[0]) * 100
                print(f"  5min Change: {change:.2f}%")
        
        # Get order book
        order_book = self.get_order_book(symbol, 5)
        if order_book:
            print(f"\n📋 Order Book (Top 5):")
            print(f"  Best Bid: ${float(order_book['bids'][0][0]):,.6f} (Qty: {order_book['bids'][0][1]})")
            print(f"  Best Ask: ${float(order_book['asks'][0][0]):,.6f} (Qty: {order_book['asks'][0][1]})")
            spread = float(order_book['asks'][0][0]) - float(order_book['bids'][0][0])
            print(f"  Spread: ${spread:.6f}")
        
        # Get chart data summary
        print(f"\n📈 Chart Data Summary:")
        intervals = ['1h', '4h', '1d']
        for interval in intervals:
            klines = self.get_klines(symbol, interval, 2)
            if klines:
                prev_close = float(klines[0][4])
                curr_close = float(klines[-1][4])
                change = ((curr_close - prev_close) / prev_close) * 100
                print(f"  {interval}: ${curr_close:,.6f} ({change:+.2f}%)")
        
        print(f"\n⏰ Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

# Main execution
if __name__ == "__main__":
    scraper = BinanceCryptoScraper()
    
    # List of symbols to monitor
    symbols = [
        'TONUSDT',     # Toncoin
        'BTCUSDT',     # Bitcoin
        'ETHUSDT',     # Ethereum
        'NOTUSDT',     # Notcoin (similar to Not Pixel)
        'BNBUSDT',     # BNB
    ]
    
    print("🚀 Binance Crypto Scraper Started")
    print("Monitoring: TON, BTC, ETH, NOT, BNB")
    
    while True:
        try:
            for symbol in symbols:
                scraper.print_full_details(symbol)
                time.sleep(1)  # Small delay between symbols
            
            print(f"\n{'='*60}")
            print("⏳ Waiting 60 seconds for next update...")
            print(f"{'='*60}\n")
            time.sleep(60)
            
        except KeyboardInterrupt:
            print("\n\n🛑 Scraper stopped by user")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            print("Retrying in 10 seconds...")
            time.sleep(10)
