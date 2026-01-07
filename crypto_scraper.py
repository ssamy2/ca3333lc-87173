import requests
import re
import json
import time

def calculate_loss_percentage(initial_price, current_price):
    """Calculate percentage loss from initial to current price"""
    if initial_price == 0:
        return 0
    return ((initial_price - current_price) / initial_price) * 100

def format_price(price, symbol=""):
    """Format price with appropriate decimals"""
    if price == "N/A":
        return f"{symbol}: N/A"
    try:
        price_float = float(price)
        if price_float >= 1:
            return f"{symbol}: ${price_float:.4f}"
        elif price_float >= 0.01:
            return f"{symbol}: ${price_float:.6f}"
        else:
            return f"{symbol}: ${price_float:.8f}"
    except:
        return f"{symbol}: {price}"

# Constants - Update these with actual initial prices
INITIAL_PX_PRICE = 0.05  # Example: initial PX price when launched
SECONDARY_PX_PRICE = 0.03  # Example: secondary PX price

while True:
    try:
        # Headers to avoid blocking
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
        
        # Fetch data
        print("=" * 50)
        print("Fetching data from CoinMarketCap...")
        
        s = requests.get("https://coinmarketcap.com/", timeout=10, headers=headers)
        px = requests.get("https://coinmarketcap.com/currencies/not-pixel/", timeout=10, headers=headers)
        ton = requests.get("https://coinmarketcap.com/currencies/toncoin/", timeout=10, headers=headers)

        if s.status_code != 200 or px.status_code != 200 or ton.status_code != 200:
            print(f"Failed to retrieve data. Status codes: main={s.status_code}, px={px.status_code}, ton={ton.status_code}")
            time.sleep(60)
            continue

        data = s.text
        cd = px.text
        cd2 = ton.text

        print("✓ Data fetched successfully")

        # Parse trending list
        print("\n--- Trending Coins ---")
        match = re.search(r'"highlightsData":\{"trendingList":(\[.*?\])', data)
        if match:
            try:
                trending_list = json.loads(match.group(1))
                for i, coin in enumerate(trending_list[:5], 1):  # Show first 5
                    name = coin.get("name", "Unknown Coin").replace(" ", "_").lower()
                    price = coin.get("priceChange", {}).get("price", "N/A")
                    symbol = coin.get("symbol", "")
                    print(f"{i}. {symbol} ({name}): ${price}")
                    globals()[name] = price  
            except json.JSONDecodeError:
                print("Error parsing trending list JSON")
        else:
            print("Highlights data not found.")

        # Parse TON statistics
        print("\n--- TON Statistics ---")
        match = re.search(r'"statistics":(\{.*?\})', cd2)
        name_match = re.search(r'"name":"(.*?)"', cd2)
        if match:
            try:
                statistics_json = match.group(1)
                statistics_dict = json.loads(statistics_json)
                price = statistics_dict.get("price", "N/A")
                coin_name = name_match.group(1).replace(" ", "_").lower() if name_match else "unknown_coin"  
                globals()[coin_name] = price
                x = price
                print(f"TON Price: ${price}")
            except json.JSONDecodeError:
                print("Error parsing TON statistics JSON")
        else:
            print("TON statistics data not found.")

        # Parse PX statistics
        print("\n--- PX (Not Pixel) Statistics ---")
        match = re.search(r'"statistics":(\{.*?\})', cd)
        name_match = re.search(r'"name":"(.*?)"', cd)
        if match:
            try:
                statistics_json = match.group(1)
                statistics_dict = json.loads(statistics_json)
                price = statistics_dict.get("price", "N/A")
                coin_name = name_match.group(1).replace(" ", "_").lower() if name_match else "unknown_coin"  
                globals()[coin_name] = price 

                print(f"PX Price: ${price}")

                if price != "N/A" and price != 0:
                    try:
                        current_price = float(price)
                        loss_percentage_initial = calculate_loss_percentage(INITIAL_PX_PRICE, current_price)
                        loss_percentage_secondary = calculate_loss_percentage(SECONDARY_PX_PRICE, current_price)
                        
                        print(f"Loss from initial price: {loss_percentage_initial:.2f}%")
                        print(f"Loss from secondary price: {loss_percentage_secondary:.2f}%")
                    except ValueError:
                        print(f"Invalid price for {coin_name}")
            except json.JSONDecodeError:
                print("Error parsing PX statistics JSON")
        else:
            print("PX statistics data not found.")

        # Format and display final prices
        print("\n--- Formatted Prices ---")
        try:
            # Get current PX price from the parsed data
            px_price = float(price) if price != "N/A" and price != 0 else 0
            ton_price = float(x) if x != "N/A" and x != 0 else 0
            
            formatted_px = format_price(px_price, "PX")
            formatted_ton = format_price(ton_price, "TON")
            
            print(formatted_px)
            print(formatted_ton)
            
            # Additional info
            print(f"\n--- Summary ---")
            print(f"Current PX Price: ${px_price:.8f}")
            print(f"Current TON Price: ${ton_price:.6f}")
            
        except Exception as e:
            print(f"Error formatting prices: {e}")

        print("\n" + "=" * 50)
        print("Waiting 60 seconds before next fetch...")
        time.sleep(60)
        
    except KeyboardInterrupt:
        print("\n\nScript stopped by user")
        break
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        print("Retrying in 60 seconds...")
        time.sleep(60)
