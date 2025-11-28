import asyncio
import os
import re
import time
import logging
import sqlite3
import unicodedata
import html
import hashlib
import hmac
from typing import Optional, Dict, Any, Tuple, List
from contextlib import contextmanager
from urllib.parse import parse_qsl, unquote, quote_plus
from concurrent.futures import ThreadPoolExecutor

try:
    import ujson as json
except ImportError:
    import json

import aiohttp
import requests
from bs4 import BeautifulSoup
from fastapi import HTTPException

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_FILE = os.path.join(BASE_DIR, "black_token.json")
DB_PATH = os.path.join(BASE_DIR, "gifts_data.db")

DEVELOPMENT_MODE = os.environ.get("DEV_MODE", "false").lower() == "true"

_executor = ThreadPoolExecutor(max_workers=10)
_db_pool: List[sqlite3.Connection] = []
_db_pool_max_size = 10
_db_pool_lock = asyncio.Lock()

_http_session: Optional[aiohttp.ClientSession] = None
_http_session_lock = asyncio.Lock()


class GiftProcessingError(Exception):
    pass


class DataFetchError(Exception):
    pass


class RarityCalculationError(Exception):
    pass


class PriceCalculationError(Exception):
    pass


class CacheManager:
    def __init__(self):
        self.black_floors: Dict[str, float] = {}
        self.black_floors_timestamp: float = 0
        self.api_backdrops: Dict[str, Any] = {}
        self.api_backdrops_timestamps: Dict[str, float] = {}
        self.price_cache: Dict[str, Any] = {}
        self.price_cache_timestamps: Dict[str, float] = {}
        self.ton_price: float = 2.77
        self.ton_price_timestamp: float = 0
        self.CACHE_DURATION = 600
        self.PRICE_CACHE_DURATION = 300
        self.TON_CACHE_DURATION = 120
        self._lock = asyncio.Lock()

    def is_cache_valid(self, timestamp: float, duration: Optional[float] = None) -> bool:
        if duration is None:
            duration = self.CACHE_DURATION
        return time.time() - timestamp < duration

    async def clear_expired_cache(self):
        async with self._lock:
            current_time = time.time()
            expired_keys = [k for k, ts in self.api_backdrops_timestamps.items() 
                          if not self.is_cache_valid(ts)]
            for key in expired_keys:
                self.api_backdrops.pop(key, None)
                self.api_backdrops_timestamps.pop(key, None)
            
            expired_price_keys = [k for k, ts in self.price_cache_timestamps.items() 
                                 if not self.is_cache_valid(ts, self.PRICE_CACHE_DURATION)]
            for key in expired_price_keys:
                self.price_cache.pop(key, None)
                self.price_cache_timestamps.pop(key, None)

    def get_black_floors_cache(self) -> Optional[Dict[str, float]]:
        if self.is_cache_valid(self.black_floors_timestamp):
            return self.black_floors
        return None

    def set_black_floors_cache(self, data: Dict[str, float]):
        self.black_floors = data
        self.black_floors_timestamp = time.time()

    def get_api_backdrop_cache(self, key: str) -> Optional[Any]:
        timestamp = self.api_backdrops_timestamps.get(key, 0)
        if self.is_cache_valid(timestamp):
            return self.api_backdrops.get(key)
        return None

    def set_api_backdrop_cache(self, key: str, data: Any):
        self.api_backdrops[key] = data
        self.api_backdrops_timestamps[key] = time.time()

    def get_price_cache(self, key: str) -> Optional[Any]:
        timestamp = self.price_cache_timestamps.get(key, 0)
        if self.is_cache_valid(timestamp, self.PRICE_CACHE_DURATION):
            return self.price_cache.get(key)
        return None

    def set_price_cache(self, key: str, data: Any):
        self.price_cache[key] = data
        self.price_cache_timestamps[key] = time.time()

    def get_ton_price(self) -> Optional[float]:
        if self.is_cache_valid(self.ton_price_timestamp, self.TON_CACHE_DURATION):
            return self.ton_price
        return None

    def set_ton_price(self, price: float):
        self.ton_price = price
        self.ton_price_timestamp = time.time()

    def get_cache_stats(self) -> Dict[str, Any]:
        return {
            "black_floors": len(self.black_floors),
            "api_backdrops": len(self.api_backdrops),
            "prices": len(self.price_cache),
            "ton_price": self.ton_price,
            "black_floors_valid": self.is_cache_valid(self.black_floors_timestamp),
            "ton_price_valid": self.is_cache_valid(self.ton_price_timestamp, self.TON_CACHE_DURATION),
        }


cache_manager = CacheManager()


@contextmanager
def get_db_connection():
    conn = None
    try:
        if _db_pool:
            conn = _db_pool.pop()
        else:
            conn = sqlite3.connect(DB_PATH, check_same_thread=False, timeout=10)
            conn.row_factory = sqlite3.Row
        yield conn
    except Exception as e:
        logger.error(f"Database error: {e}")
        raise DataFetchError(f"Database connection failed: {e}")
    finally:
        if conn:
            if len(_db_pool) < _db_pool_max_size:
                _db_pool.append(conn)
            else:
                conn.close()


async def get_http_session() -> aiohttp.ClientSession:
    global _http_session
    async with _http_session_lock:
        if _http_session is None or _http_session.closed:
            timeout = aiohttp.ClientTimeout(total=30, connect=10)
            connector = aiohttp.TCPConnector(limit=100, limit_per_host=30, ttl_dns_cache=300)
            _http_session = aiohttp.ClientSession(
                timeout=timeout, 
                connector=connector, 
                json_serialize=json.dumps
            )
        return _http_session


async def close_http_session():
    global _http_session
    async with _http_session_lock:
        if _http_session and not _http_session.closed:
            await _http_session.close()
            _http_session = None


async def cleanup_resources():
    try:
        await close_http_session()
        for conn in _db_pool:
            conn.close()
        _db_pool.clear()
        logger.info("Resources cleaned up successfully")
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")


async def get_auth_token() -> Optional[str]:
    try:
        if not os.path.exists(TOKEN_FILE):
            return None
        
        loop = asyncio.get_event_loop()
        def read_token():
            with open(TOKEN_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        
        data = await loop.run_in_executor(_executor, read_token)
        token = data.get("token")
        if not token:
            return None
        
        created = data.get("time", 0)
        expires_in = data.get("expires_in", 900)
        if time.time() - created > expires_in:
            return None
        
        return token
    except Exception as e:
        logger.warning(f"Failed to read auth token: {e}")
        return None


_black_token_cache: Optional[str] = None
_black_token_time: float = 0


async def _get_black_token_cached() -> Optional[str]:
    global _black_token_cache, _black_token_time
    try:
        if _black_token_cache and time.time() - _black_token_time < 900:
            return _black_token_cache
        _black_token_cache = await get_auth_token()
        _black_token_time = time.time()
        return _black_token_cache
    except Exception as e:
        logger.error(f"Failed to get black token: {e}")
        if _black_token_cache:
            return _black_token_cache
        return None


def normalize(s: Optional[str]) -> str:
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", s)
    s = s.replace("'", "").replace("'", "").replace("`", "")
    s = re.sub(r"[^a-zA-Z0-9]+", "", s)
    return s.lower()


async def get_ton_usdt_price() -> float:
    cached_price = cache_manager.get_ton_price()
    if cached_price is not None:
        return cached_price
    
    session = await get_http_session()
    
    try:
        async with session.get(
            "https://api.binance.com/api/v3/ticker/price",
            params={"symbol": "TONUSDT"},
            timeout=aiohttp.ClientTimeout(total=5)
        ) as r:
            if r.status == 200:
                data = await r.json()
                p = float(data.get("price", 0))
                if p > 0:
                    cache_manager.set_ton_price(p)
                    return p
    except Exception as e:
        logger.warning(f"Binance API failed: {e}")
    
    try:
        async with session.get(
            "https://api.coingecko.com/api/v3/simple/price",
            params={"ids": "the-open-network", "vs_currencies": "usd"},
            timeout=aiohttp.ClientTimeout(total=5)
        ) as r:
            if r.status == 200:
                data = await r.json()
                p = float(data.get("the-open-network", {}).get("usd", 0))
                if p > 0:
                    cache_manager.set_ton_price(p)
                    return p
    except Exception as e:
        logger.warning(f"CoinGecko API failed: {e}")
    
    return cache_manager.ton_price


SPECIAL_MODELS = [
    "Crypto Queen", "Hellcat", "8 Bit Diamond", "Arabica", "Atomic Bomb", "Eternal Life",
    "Cozy Galaxy", "Gucci Leap", "Louis Vuitton", "Magnate", "Marble", "Midas Pepe",
    "Ninja Mike", "Pink Galaxy", "Steel Frog", "Bitcoin", "Black Wing", "Mission Uranus",
    "Best Muscles", "Bicep Curls", "Colossus", "Infinity", "Night Bat", "Fifth Element",
    "Fight Club", "Gold Bar", "Gold Block", "USBrick", "Crypto Orange", "Premium",
    "Rich Green", "Tonfruit", "Salem", "Cherub", "Count Macaqula", "La Baboon", "Olympia",
    "Al Dogg", "Doberman", "Black Noir", "Skull", "First Class", "Golden Bike",
    "Golden Shine", "Goodbye Kitty", "Ape Puppet", "Bank Robber", "Chimp Imp", "Flammable",
    "Piggy Bank", "Utya", "Road Ape", "Obelisk", "Crypto Dream", "Golden Girl",
    "High Voltage", "Succubus", "Endercat", "Pepe Paws", "April", "Canis Major",
    "Crypto Boom", "TON", "Saturn V", "El Classico", "Far Out", "Ice Cold",
    "Jazz Cigarette", "Oil Baron", "Pink Plume", "Psychonaut", "Short Fuse",
    "Spectral Smoke", "Super Swirls", "The Shocker"
]


def get_special_backdrop_name(backdrop: Optional[str]) -> Optional[str]:
    if not backdrop:
        return None
    backdrop_lower = backdrop.lower()
    
    if "onyx black" in backdrop_lower:
        return "Onyx Black"
    elif "midnight blue" in backdrop_lower:
        return "Midnight Blue"
    elif backdrop_lower == "black" or backdrop_lower.startswith("black "):
        return "Black"
    
    return None


def is_high_rarity(rarity: Optional[float]) -> bool:
    if rarity is None:
        return False
    return rarity <= 0.5


async def fetch_black_floors(specific_models: Optional[List[str]] = None) -> Dict[str, float]:
    cached_data = cache_manager.get_black_floors_cache()
    if cached_data is not None:
        return cached_data
    
    token = await _get_black_token_cached()
    if not token:
        return cache_manager.black_floors
    
    if specific_models is None:
        priority_models = [
            "Saturn V", "El Classico", "Far Out", "Ice Cold", "Jazz Cigarette", "Oil Baron",
            "Pink Plume", "Psychonaut", "Short Fuse", "Spectral Smoke", "Super Swirls",
            "The Shocker", "Crypto Queen", "Bitcoin", "TON"
        ]
    else:
        priority_models = specific_models
    
    new_cache_data: Dict[str, float] = {}
    session = await get_http_session()
    headers = {"Authorization": token}
    
    try:
        tasks = []
        for model in priority_models:
            tasks.append(_fetch_model_floor(session, model, headers))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, dict):
                new_cache_data.update(result)
        
        if new_cache_data:
            cache_manager.set_black_floors_cache(new_cache_data)
        
    except Exception as e:
        logger.error(f"Error fetching black floors: {e}")
        return cache_manager.black_floors
    
    return new_cache_data


async def _fetch_model_floor(session: aiohttp.ClientSession, model: str, headers: dict) -> Dict[str, float]:
    result: Dict[str, float] = {}
    try:
        model_encoded = quote_plus(model)
        url = f"https://portal-market.com/api/collections/models/backgrounds/floors?models={model_encoded}"
        
        async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as r:
            if r.status == 200:
                data = await r.json()
                model_data = data.get("model_backgrounds", {}).get(model, {})
                
                for backdrop in ["Black", "Onyx Black", "Midnight Blue"]:
                    if model_data.get(backdrop):
                        price = float(model_data.get(backdrop))
                        result[f"{model}_{backdrop}_backdrop"] = price
                        result[f"{model}_{backdrop}_model"] = price
    except Exception as e:
        logger.debug(f"Error fetching data for model {model}: {e}")
    
    return result


async def get_black_model_price(model_name: str, backdrop_name: str = "Black", search_type: str = "backdrop") -> Optional[float]:
    cache = await fetch_black_floors()
    cache_key = f"{model_name}_{backdrop_name}_{search_type}"
    return cache.get(cache_key)


async def get_backdrop_price_from_api(gift_name: str, backdrop_name: str) -> Optional[float]:
    try:
        if not gift_name or not backdrop_name:
            return None
        
        short_name = normalize(gift_name)
        if not short_name:
            return None
        
        cache_key = f"{short_name}_{backdrop_name}"
        cached_price = cache_manager.get_api_backdrop_cache(cache_key)
        if cached_price is not None:
            return cached_price
        
        collection_data = cache_manager.get_api_backdrop_cache(short_name)
        if collection_data is not None:
            backdrop_price = collection_data.get("backdrops", {}).get(backdrop_name)
            if backdrop_price:
                price = float(backdrop_price)
                cache_manager.set_api_backdrop_cache(cache_key, price)
                return price
            return None
        
        token = await _get_black_token_cached()
        if not token:
            return None
        
        headers = {
            "accept": "application/json, text/plain, */*",
            "authorization": token,
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        session = await get_http_session()
        url = f"https://portal-market.com/api/collections/filters?short_names={short_name}"
        
        async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as response:
            if response.status == 200:
                raw_text = await response.text()
                if not raw_text or raw_text.strip() == "":
                    return None
                
                data = json.loads(raw_text)
                if not data or not isinstance(data, dict):
                    return None
                
                floor_prices = data.get("floor_prices", {})
                gift_data = floor_prices.get(short_name, {})
                
                if isinstance(gift_data, dict):
                    cache_manager.set_api_backdrop_cache(short_name, gift_data)
                    backdrops = gift_data.get("backdrops", {})
                    backdrop_price = backdrops.get(backdrop_name)
                    if backdrop_price:
                        price = float(backdrop_price)
                        cache_manager.set_api_backdrop_cache(cache_key, price)
                        return price
        
        return None
    except Exception as e:
        logger.error(f"Error fetching backdrop price from API: {e}")
        return None


async def get_price(search_type: str, name: str, gift_name: str, 
                   model_name: Optional[str] = None, model_rarity: Optional[float] = None) -> float:
    try:
        loop = asyncio.get_event_loop()
        
        def db_query():
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                market_price = None
                cursor.execute('SELECT price_ton FROM market_data WHERE name = ?', (gift_name,))
                r = cursor.fetchone()
                if r:
                    market_price = float(r[0])
                
                g_clean = normalize(gift_name)
                cursor.execute('SELECT data_json FROM gifts')
                rows = cursor.fetchall()
                
                collection_data = None
                for (raw,) in rows:
                    data = json.loads(raw)
                    floors = data.get("floor_prices", {})
                    for key in floors.keys():
                        if g_clean in key or key in g_clean:
                            collection_data = floors[key]
                            break
                    if collection_data:
                        break
                
                return market_price, collection_data
        
        mname = model_name if model_name else name
        special_backdrop = get_special_backdrop_name(name) if search_type == "backdrop" else None
        
        if special_backdrop:
            if is_high_rarity(model_rarity) or mname in SPECIAL_MODELS:
                black_price = await get_black_model_price(mname, special_backdrop, search_type)
                if black_price:
                    return black_price
            else:
                effective_gift_name = gift_name or mname or name
                if effective_gift_name:
                    api_price = await get_backdrop_price_from_api(effective_gift_name, special_backdrop)
                    if api_price:
                        return api_price
        
        if search_type == "model" and name in SPECIAL_MODELS:
            for backdrop_type in ["Black", "Onyx Black", "Midnight Blue"]:
                black_price = await get_black_model_price(name, backdrop_type, "model")
                if black_price:
                    return black_price
        
        market_price, collection_data = await loop.run_in_executor(_executor, db_query)
        
        if is_high_rarity(model_rarity) and search_type == "model" and collection_data:
            v = collection_data.get("models", {}).get(name)
            if v:
                logger.info(f"High rarity model price from DB: {name} = {v} TON")
                return float(v)
        
        if collection_data:
            if search_type == "backdrop":
                v = collection_data.get("backdrops", {}).get(name)
                if v:
                    return float(v)
            elif search_type == "model":
                v = collection_data.get("models", {}).get(name)
                if v:
                    return float(v)
            elif search_type == "symbol":
                v = collection_data.get("symbols", {}).get(name)
                if v:
                    return float(v)
        
        if market_price:
            return market_price
        
        return 0.0
        
    except Exception as e:
        logger.error(f"Error getting price for {gift_name}: {e}")
        return 0.0


def extract_hashtag_from_link(telegram_link: Optional[str]) -> Optional[int]:
    if not telegram_link:
        return None
    
    # Handle multiple numbers at the end (e.g., GiftName-123-456)
    match = re.search(r'-(\d+)-(\d+)$', telegram_link)
    if match:
        # Return the second number (the actual hashtag/mint number)
        return int(match.group(2))
    
    # Handle single number at the end (e.g., GiftName-123)
    match = re.search(r'/(\w+)-(\d+)$', telegram_link)
    if match:
        return int(match.group(2))
    
    # Fallback for any number at the end
    match = re.search(r'-(\d+)$', telegram_link)
    if match:
        return int(match.group(1))
    
    return None


def calculate_hashtag_price(hashtag_number: Optional[int], floor_price: float) -> float:
    if not hashtag_number or hashtag_number < 1:
        return floor_price
    
    special_cases = {
        11: {"multiplier": 3, "min_price": 95},
        22: {"multiplier": 2, "min_price": 45},
        33: {"multiplier": 3, "min_price": 55},
        44: {"multiplier": 1.5, "min_price": 49},
        55: {"multiplier": 1.5, "min_price": 55},
        66: {"multiplier": 1.5, "min_price": 45},
        77: {"multiplier": 2, "min_price": 60},
        88: {"multiplier": 3, "min_price": 65},
        99: {"multiplier": 1.5, "min_price": 60}
    }
    
    if hashtag_number in special_cases:
        case = special_cases[hashtag_number]
        calculated_price = floor_price * case["multiplier"]
        return max(calculated_price, case["min_price"])
    
    if hashtag_number == 1:
        return max(floor_price * 30, 3000)
    elif 2 <= hashtag_number <= 9:
        if hashtag_number in [7, 8]:
            return max(floor_price * 8, 200)
        return max(floor_price * 6, 100)
    elif 10 <= hashtag_number <= 19:
        return max(floor_price * 3, 45)
    elif 20 <= hashtag_number <= 29:
        return max(floor_price * 2, 30)
    elif 30 <= hashtag_number <= 49:
        return max(floor_price * 1.5, 20)
    elif 50 <= hashtag_number <= 60:
        return max(floor_price * 1.5, 18)
    elif 61 <= hashtag_number <= 98:
        return max(floor_price * 1, 12)
    
    return floor_price


async def get_cached_price(gift_name: str, model: Optional[str], backdrop: Optional[str], 
                          rarity: Optional[float], link: Optional[str] = None) -> Dict[str, Any]:
    try:
        hashtag_number = extract_hashtag_from_link(link) if link else None
        cache_key = f"{gift_name}_{model}_{backdrop}_{rarity}_{hashtag_number or 'no_hashtag'}"
        
        cached_price = cache_manager.get_price_cache(cache_key)
        if cached_price is not None:
            return cached_price
        
        await cache_manager.clear_expired_cache()
        
        rarity_float = None
        if rarity:
            try:
                rarity_float = float(str(rarity).replace('%', '').strip())
            except:
                pass
        
        ton_price = 0.0
        pricing_method = "unknown"
        
        special_backdrop = get_special_backdrop_name(backdrop)
        if special_backdrop:
            ton_price = await get_price("backdrop", special_backdrop, gift_name, model, rarity_float)
            pricing_method = f"special_backdrop_{special_backdrop}"
        elif model:
            ton_price = await get_price("model", model, gift_name, model, rarity_float)
            pricing_method = f"model_{model}"
        
        original_price = ton_price
        
        if hashtag_number and hashtag_number <= 99:
            ton_price = calculate_hashtag_price(hashtag_number, ton_price)
            pricing_method += f"_hashtag_{hashtag_number}"
        
        ton_usd_rate = await get_ton_usdt_price()
        ton_usd = ton_price * ton_usd_rate
        
        prices = {
            "price_ton": round(ton_price, 2),
            "price_usd": round(ton_usd, 2),
            "pricing_method": pricing_method,
            "original_base_price": round(original_price, 2),
            "hashtag_applied": hashtag_number if hashtag_number and hashtag_number <= 99 else None
        }
        
        cache_manager.set_price_cache(cache_key, prices)
        return prices
        
    except Exception as e:
        logger.error(f"Error calculating price for {gift_name}: {e}")
        raise PriceCalculationError(f"Failed to calculate price: {e}")


async def fetch_gifts_from_api(username: str) -> Dict[str, Any]:
    try:
        session = await get_http_session()
        
        async with session.post(
            "http://127.0.0.1:2004/gifts",
            json={"username": username},
            timeout=aiohttp.ClientTimeout(total=30)
        ) as response:
            if response.status == 200:
                return await response.json()
            elif response.status == 404:
                raise HTTPException(status_code=404, detail="User not found")
            elif response.status == 408:
                raise HTTPException(status_code=408, detail="Timeout fetching gifts")
            else:
                error_data = await response.json()
                raise HTTPException(status_code=response.status, detail=error_data.get("detail", "Unknown error"))
    except aiohttp.ClientError as e:
        logger.error(f"API connection error: {e}")
        raise DataFetchError(f"Failed to connect to API: {e}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching gifts from API: {e}")
        raise DataFetchError(f"Failed to fetch gifts: {e}")


async def process_upgraded_gifts(upgraded_list: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], float, float]:
    processed = []
    total_ton = 0.0
    total_usd = 0.0
    
    async def process_single_gift(gift: Dict[str, Any]) -> Dict[str, Any]:
        try:
            gift_name = gift.get("title") or gift.get("name", "Unknown")
            model = gift.get("model")
            backdrop = gift.get("backdrop")
            rarity = gift.get("rarity_per_mille")
            number = gift.get("number")
            
            link = gift.get("link")
            if not link and gift.get("hashtag") and number:
                hashtag = str(gift.get("hashtag"))
                str_number = str(number)
                if hashtag.endswith(f"-{str_number}"):
                    link = f"https://t.me/nft/{hashtag}"
                else:
                    link = f"https://t.me/nft/{hashtag}-{str_number}"
            
            prices = await get_cached_price(gift_name, model, backdrop, rarity, link)
            
            image_url = None
            if gift_name and model:
                gift_normalized = normalize(gift_name)
                model_normalized = normalize(model)
                if gift_normalized and model_normalized:
                    image_url = f"https://storage.googleapis.com/portals-market/gifts/{gift_normalized}/models/png/{model_normalized}.png"
            
            return {
                "id": gift.get("id"),
                "gift_name": gift_name,
                "model": model,
                "backdrop": backdrop,
                "rarity": rarity,
                "mint": number,
                "price_ton": prices["price_ton"],
                "price_usd": prices["price_usd"],
                "image": image_url,
                "link": link,
                "colors": gift.get("colors", {})
            }
        except Exception as e:
            logger.warning(f"Error processing gift: {e}")
            return {
                "id": gift.get("id"),
                "gift_name": gift.get("title") or gift.get("name", "Unknown"),
                "model": gift.get("model"),
                "backdrop": gift.get("backdrop"),
                "rarity": gift.get("rarity_per_mille"),
                "mint": gift.get("number"),
                "price_ton": 0.0,
                "price_usd": 0.0,
                "image": None,
                "link": None,
                "error": str(e)
            }
    
    tasks = [process_single_gift(gift) for gift in upgraded_list]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    for result in results:
        if isinstance(result, Exception):
            logger.error(f"Gift processing failed: {result}")
            continue
        if isinstance(result, dict):
            processed.append(result)
            total_ton += result.get("price_ton", 0.0)
            total_usd += result.get("price_usd", 0.0)
    
    return processed, total_ton, total_usd


async def get_user_nfts(username: str) -> Dict[str, Any]:
    max_retries = 3
    retry_delay = 1.0
    
    for attempt in range(max_retries):
        try:
            api_response = await fetch_gifts_from_api(username)
            
            upgraded_list = api_response.get("upgraded", [])
            unupgraded_list = api_response.get("unupgraded", [])
            
            processed_upgraded, total_ton, total_usd = await process_upgraded_gifts(upgraded_list)
            
            return {
                "success": True,
                "data": {
                    "username": username,
                    "user_id": api_response.get("user_id"),
                    "chat_id": api_response.get("chat_id"),
                    "profile_information": api_response.get("profile_information"),
                    "total_nfts": api_response.get("total_nfts", 0),
                    "total_upgraded": api_response.get("total_upgraded", 0),
                    "total_unupgraded": api_response.get("total_unupgraded", 0),
                    "total_value_ton": round(total_ton, 2),
                    "total_value_usd": round(total_usd, 2),
                    "nfts": processed_upgraded,
                    "regular_gifts": unupgraded_list
                }
            }
            
        except HTTPException:
            raise
        except DataFetchError as e:
            if attempt < max_retries - 1:
                logger.warning(f"Retry {attempt + 1}/{max_retries} for {username}: {e}")
                await asyncio.sleep(retry_delay * (attempt + 1))
            else:
                return {
                    "success": False,
                    "error": str(e),
                    "data": None
                }
        except Exception as e:
            logger.error(f"Unexpected error for {username}: {e}")
            return {
                "success": False,
                "error": str(e),
                "data": None
            }
    
    return {
        "success": False,
        "error": "Max retries exceeded",
        "data": None
    }


async def get_single_gift_price(url: str) -> Dict[str, Any]:
    try:
        def normalize_title(t):
            if not t:
                return t
            t = html.unescape(t)
            t = t.replace('\u00A0', ' ')
            t = t.replace("'", "'").replace("'", "'").replace(""", '"').replace(""", '"')
            t = re.sub(r"\s+", " ", t).strip()
            t = unicodedata.normalize("NFKC", t)
            t = re.sub(r"\s*#\d+\s*$", "", t).strip()
            return t
        
        session = await get_http_session()
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=20)) as r:
            text = await r.text()
        
        soup = BeautifulSoup(text, "html.parser")
        
        og_title = soup.select_one('meta[property="og:title"]')
        gift_name = normalize_title(og_title.get("content") if og_title else None)
        
        if not gift_name:
            match = re.search(r'/nft/([^-/]+)', url)
            if match:
                gift_name_slug = match.group(1)
                gift_name = re.sub(r'([a-z])([A-Z])', r'\1 \2', gift_name_slug)
        
        model = backdrop = rarity = backdrop_rarity = None
        
        for tr in soup.select(".tgme_gift_table tr"):
            th, td = tr.find("th"), tr.find("td")
            if not th or not td:
                continue
            k = th.get_text(strip=True).lower()
            v = td.get_text(" ", strip=True)
            
            if k == "model":
                m = re.match(r"(.+?)\s*(\d+(\.\d+)?%)?$", v)
                model = (m.group(1) or "").strip() if m else v
                if m and m.group(2):
                    rarity = float(m.group(2).replace("%", ""))
            
            if k == "backdrop":
                backdrop_match = re.match(r"(.+?)\s*(\d+(\.\d+)?%)?$", v)
                if backdrop_match:
                    backdrop = backdrop_match.group(1).strip()
                    if backdrop_match.group(2):
                        backdrop_rarity = float(backdrop_match.group(2).replace("%", ""))
                else:
                    backdrop = v.strip()
        
        prices = await get_cached_price(gift_name, model, backdrop, rarity, url)
        
        image_url = None
        if gift_name and model:
            gift_normalized = normalize(gift_name)
            model_normalized = normalize(model)
            if gift_normalized and model_normalized:
                image_url = f"https://storage.googleapis.com/portals-market/gifts/{gift_normalized}/models/png/{model_normalized}.png"
        
        return {
            "gift_name": gift_name,
            "model": model,
            "backdrop": backdrop,
            "rarity": rarity,
            "backdrop_rarity": backdrop_rarity,
            "price_ton": prices["price_ton"],
            "price_usd": prices["price_usd"],
            "image_url": image_url,
            "link": url
        }
        
    except Exception as e:
        logger.error(f"Error getting single gift price for {url}: {e}")
        raise GiftProcessingError(f"Failed to process gift: {e}")


def get_black_floor_changes() -> List[Dict[str, Any]]:
    try:
        with get_db_connection() as conn:
            c = conn.cursor()
            c.execute("""
                SELECT gift_name, short_name, black_price, recorded_at
                FROM black_floor_history
                WHERE black_price > 0
                ORDER BY short_name, recorded_at DESC
            """)
            rows = c.fetchall()
        
        latest = {}
        for r in rows:
            key = r[1]
            if key not in latest:
                latest[key] = {
                    "gift_name": r[0],
                    "short_name": r[1],
                    "black_price": r[2],
                    "recorded_at": r[3]
                }
        return list(latest.values())
    except Exception as e:
        logger.error(f"Error getting black floor changes: {e}")
        return []


_black_summary_cache = None
_black_summary_cache_time = 0
_BLACK_CACHE_TTL = 300


def get_black_summary() -> Dict[str, Any]:
    global _black_summary_cache, _black_summary_cache_time
    now = time.time()
    
    if _black_summary_cache and now - _black_summary_cache_time < _BLACK_CACHE_TTL:
        return _black_summary_cache
    
    try:
        with get_db_connection() as conn:
            c = conn.cursor()
            c.execute("""
                SELECT gift_name, short_name, black_price, recorded_at
                FROM black_floor_history
                WHERE black_price > 0
                ORDER BY short_name, recorded_at ASC
            """)
            rows = c.fetchall()
        
        data = {}
        for gift, short, price, ts in rows:
            if short not in data:
                data[short] = []
            data[short].append((gift, ts, price))
        
        def get_change(arr, days):
            t = time.time()
            back = t - days * 86400
            prev = None
            closest_diff = float('inf')
            
            for gift, ts, p in arr:
                try:
                    tsf = time.mktime(time.strptime(ts, "%Y-%m-%d %H:%M:%S"))
                except:
                    continue
                
                diff = abs(tsf - back)
                if tsf <= back and diff < closest_diff:
                    closest_diff = diff
                    prev = p
            
            nowp = arr[-1][2]
            
            if prev is None and len(arr) > 1:
                prev = arr[0][2]
            
            if prev is None:
                return None, None, nowp
            
            if prev == 0:
                return None, prev, nowp
            
            return round(((nowp - prev) / prev) * 100, 2), prev, nowp
        
        loop = asyncio.new_event_loop()
        ton_usd = loop.run_until_complete(get_ton_usdt_price())
        loop.close()
        
        res = {}
        for short, arr in data.items():
            gift = arr[-1][0]
            d, dp, c = get_change(arr, 1)
            w, wp, _ = get_change(arr, 7)
            m, mp, _ = get_change(arr, 30)
            q, qp, _ = get_change(arr, 90)
            
            res[short] = {
                "gift_name": gift,
                "current_black_price_ton": c,
                "current_black_price_usd": None if c is None else c * ton_usd,
                "daily_change_percent_ton": d,
                "daily_past_price_ton": dp,
                "daily_change_percent_usd": d,
                "weekly_change_percent_ton": w,
                "weekly_past_price_ton": wp,
                "weekly_change_percent_usd": w,
                "monthly_change_percent_ton": m,
                "monthly_past_price_ton": mp,
                "monthly_change_percent_usd": m,
                "quarterly_change_percent_ton": q,
                "quarterly_past_price_ton": qp,
                "quarterly_change_percent_usd": q
            }
        
        _black_summary_cache = res
        _black_summary_cache_time = now
        return res
        
    except Exception as e:
        logger.error(f"Error getting black summary: {e}")
        return _black_summary_cache or {}


_black_history_cache: Dict[str, Dict[str, Any]] = {}


def get_black_history(name: str) -> List[Dict[str, Any]]:
    global _black_history_cache
    
    short = name.lower().replace(" ", "").replace("-", "").replace("'", "")
    now = time.time()
    
    if short in _black_history_cache:
        if now - _black_history_cache[short]["t"] < _BLACK_CACHE_TTL:
            return _black_history_cache[short]["v"]
    
    try:
        with get_db_connection() as conn:
            c = conn.cursor()
            c.execute("""
                SELECT recorded_at, black_price
                FROM black_floor_history
                WHERE short_name = ?
                ORDER BY recorded_at ASC
            """, (short,))
            rows = c.fetchall()
        
        cleaned = []
        last = None
        for ts, p in rows:
            if last is None or p != last:
                cleaned.append({"timestamp": ts, "price_ton": p})
                last = p
        
        loop = asyncio.new_event_loop()
        ton_usd = loop.run_until_complete(get_ton_usdt_price())
        loop.close()
        
        for r in cleaned:
            r["price_usd"] = None if r["price_ton"] is None else r["price_ton"] * ton_usd
        
        _black_history_cache[short] = {"v": cleaned, "t": now}
        return cleaned
        
    except Exception as e:
        logger.error(f"Error getting black history for {name}: {e}")
        return _black_history_cache.get(short, {}).get("v", [])


_gift_data_cache: Dict[str, Any] = {}
_gift_data_cache_time: Dict[str, float] = {}
_GIFT_DATA_CACHE_TTL = 300


async def fetch_gift_data(name: str) -> Optional[Dict[str, Any]]:
    key = name.lower().strip()
    now = time.time()
    
    if key in _gift_data_cache and now - _gift_data_cache_time.get(key, 0) < _GIFT_DATA_CACHE_TTL:
        return _gift_data_cache[key]
    
    base = "https://giftcharts-api.onrender.com"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OGUxODg1OWQzOTI1YTc1OGNmODE5MTciLCJpYXQiOjE3NjA3MjgxNDEsImV4cCI6MTc2MzMyMDE0MX0.10Gg4XGJVl6iQ_2BsZQ9YV7lHiBpQUIilbWvfsvJ2Z8"
    h = {"accept": "application/json", "authorization": f"Bearer {token}"}
    
    try:
        session = await get_http_session()
        
        async with session.get(f"{base}/gifts", headers=h, timeout=aiohttp.ClientTimeout(total=15)) as r:
            gifts = await r.json()
        
        match = next((g for g in gifts if g.get("name") == name), None)
        if not match:
            return None
        
        gid = match["_id"]
        
        async with session.get(f"{base}/gifts/{gid}", headers=h) as a, \
                   session.get(f"{base}/weekChart?name={quote_plus(name)}", headers=h) as b, \
                   session.get(f"{base}/lifeChart?name={quote_plus(name)}", headers=h) as c, \
                   session.get(f"{base}/giftModels/{gid}", headers=h) as d:
            
            result = {
                "info": await a.json(),
                "week_chart": await b.json(),
                "life_chart": await c.json(),
                "models": (await d.json())[0].get("models", [])
            }
        
        _gift_data_cache[key] = result
        _gift_data_cache_time[key] = now
        return result
        
    except Exception as e:
        logger.error(f"Error fetching gift data for {name}: {e}")
        return _gift_data_cache.get(key)


market_cache_data = None
market_cache_time = 0
MARKET_CACHE_DURATION = 60


async def get_market_data_async(base_url: str) -> Dict[str, Any]:
    global market_cache_data, market_cache_time
    
    def shorten_number(num):
        try:
            num = float(num)
            if num >= 1_000_000_000:
                return f"{num / 1_000_000_000:.2f}B"
            elif num >= 1_000_000:
                return f"{num / 1_000_000:.2f}M"
            elif num >= 1_000:
                return f"{num / 1_000:.2f}K"
            else:
                return f"{num:.2f}"
        except:
            return None
    
    now = time.time()
    if market_cache_data and now - market_cache_time < MARKET_CACHE_DURATION:
        return market_cache_data
    
    try:
        session = await get_http_session()
        async with session.get(
            "https://giftcharts-api.onrender.com/gifts",
            headers={'accept': 'application/json, text/plain, */*'},
            timeout=aiohttp.ClientTimeout(total=15)
        ) as resp:
            if resp.status != 200:
                return market_cache_data or {"error": "API unavailable"}
            
            raw_data = await resp.json()
        
        result = {}
        for item in raw_data:
            try:
                name = item.get("name", "Unknown NFT")
                ton = float(item.get("priceTon") or 0)
                usd = float(item.get("priceUsd") or 0)
                ton_24h = float(item.get("tonPrice24hAgo") or 0)
                usd_24h = float(item.get("usdPrice24hAgo") or 0)
                
                upgraded_supply = float(item.get("upgradedSupply") or 0)
                total_supply = float(item.get("supply") or upgraded_supply)
                
                change_ton = round(((ton - ton_24h) / ton_24h) * 100, 2) if ton_24h else None
                change_usd = round(((usd - usd_24h) / usd_24h) * 100, 2) if usd_24h else None
                
                market_cap_ton = ton * upgraded_supply
                market_cap_usd = usd * upgraded_supply
                fdv_ton = ton * total_supply
                fdv_usd = usd * total_supply
                
                merged = {
                    **item,
                    "change_24h_ton_%": change_ton,
                    "change_24h_usd_%": change_usd,
                    "market_cap_ton": shorten_number(market_cap_ton),
                    "market_cap_usd": shorten_number(market_cap_usd),
                    "fdv_ton": shorten_number(fdv_ton),
                    "fdv_usd": shorten_number(fdv_usd),
                    "image_url": f"{base_url}/api/image/{item.get('image')}" if item.get("image") else None
                }
                result[name] = merged
            except:
                continue
        
        market_cache_data = result
        market_cache_time = now
        return result
        
    except Exception as e:
        logger.error(f"Error fetching market data: {e}")
        return market_cache_data or {"error": "Failed to fetch market data"}


def get_market_data(base_url: str) -> Dict[str, Any]:
    """Get market data with proper event loop handling"""
    global market_cache_data, market_cache_time
    
    # Check if cache is still valid
    now = time.time()
    if market_cache_data and now - market_cache_time < MARKET_CACHE_DURATION:
        logger.info("Returning cached market data")
        return market_cache_data
    
    try:
        # Try to get running loop (we're in an async context)
        loop = asyncio.get_running_loop()
        # If we're here, there's a running loop
        # We can't use run_until_complete, so return cached data
        logger.warning("Already in async context, returning cached market data")
        if market_cache_data:
            return market_cache_data
        # If no cache, return empty dict (will be fetched next time)
        return {}
    except RuntimeError:
        # No running loop, we can create one
        try:
            # Use asyncio.run() which is cleaner
            return asyncio.run(get_market_data_async(base_url))
        except Exception as e:
            logger.error(f"Error in get_market_data: {e}")
            # Return cached data if available
            if market_cache_data:
                return market_cache_data
            return {"error": f"Failed to fetch market data: {str(e)}"}


def verify_telegram_init_data(init_data: str, bot_token: str, max_age: int = 3600) -> Tuple[bool, Optional[int], bool]:
    if DEVELOPMENT_MODE:
        try:
            parsed = dict(parse_qsl(init_data, keep_blank_values=True))
            raw_user = parsed.get("user")
            if raw_user:
                try:
                    user = json.loads(raw_user)
                except:
                    user = json.loads(unquote(raw_user))
                user_id = user.get("id")
                if user_id:
                    logger.warning(f"[DEV MODE] Skipping auth verification for user {user_id}")
                    return True, user_id, True
        except:
            pass
        return True, 12345678, True
    
    try:
        parsed = dict(parse_qsl(init_data, keep_blank_values=True))
        
        if "hash" not in parsed:
            return False, None, False
        
        received_hash = parsed.pop("hash")
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
        
        secret_key = hmac.new(
            key="WebAppData".encode(),
            msg=bot_token.encode(),
            digestmod=hashlib.sha256
        ).digest()
        
        expected_hash = hmac.new(
            key=secret_key,
            msg=data_check_string.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        if expected_hash != received_hash:
            return False, None, False
        
        raw_user = parsed.get("user")
        try:
            user = json.loads(raw_user)
        except:
            user = json.loads(unquote(raw_user))
        
        user_id = user.get("id")
        if not user_id:
            return False, None, False
        
        subscribed = False
        channel = "@GT_Rolet"
        url = f"https://api.telegram.org/bot{bot_token}/getChatMember?chat_id={channel}&user_id={user_id}"
        
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("ok"):
                    result = data.get("result", {})
                    status = result.get("status")
                    subscribed = status in ("member", "administrator", "creator")
        except Exception as e:
            logger.warning(f"Subscription check failed: {e}")
        
        return True, user_id, subscribed
        
    except Exception as e:
        logger.error(f"Auth verification failed: {e}")
        return False, None, False


_market_cap_cache = None
_market_cap_cache_time = 0
_MARKET_CAP_CACHE_TTL = 300


async def get_market_cap_changes() -> Dict[str, Any]:
    global _market_cap_cache, _market_cap_cache_time
    now = time.time()
    
    if _market_cap_cache and now - _market_cap_cache_time < _MARKET_CAP_CACHE_TTL:
        return _market_cap_cache
    
    url = "https://giftcharts-api.onrender.com/indexMonthData/68493d064b37eed02b7ae5af"
    headers = {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "origin": "https://giftcharts.com",
        "referer": "https://giftcharts.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    try:
        session = await get_http_session()
        async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as response:
            if response.status == 200:
                data = await response.json()
                _market_cap_cache = data
                _market_cap_cache_time = now
                return data
            else:
                return _market_cap_cache or {"error": "Failed to fetch data"}
    except Exception as e:
        logger.error(f"Error fetching market cap changes: {e}")
        return _market_cap_cache or {"error": str(e)}


async def get_user_profile(username: str) -> Dict[str, Any]:
    try:
        api_response = await fetch_gifts_from_api(username)
        
        return {
            "user_id": api_response.get("user_id"),
            "username": username,
            "profile_information": api_response.get("profile_information", {}),
            "total_nfts": api_response.get("total_nfts", 0)
        }
    except HTTPException as e:
        return {"error": e.detail}
    except Exception as e:
        logger.error(f"Error getting user profile for {username}: {e}")
        return {"error": str(e)}
