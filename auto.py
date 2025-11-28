import sqlite3, requests, json, time, asyncio, logging
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from pyrogram import Client
from pyrogram.raw.functions.messages import RequestAppWebView
from pyrogram.raw.types import InputBotAppShortName
from urllib.parse import unquote

API_ID = 28907635
API_HASH = "fa6c3335de68283781976ae20f813f73"
SESSION_STRING = "AQG5GHMAp84QVg9pR-f-P1WGdzFP-fRyvq6jZMSr1cnzc10M1pJ3rqHBQg0MvFIGizSJ3SrbCFqTJxwPoZGioh_uPks1aTHXGx-MzhsgG4x98M1OCV4EK-RoQwv8WadYZtJ8ZZsM3x1N9HA9AYmb2458VjUMIbobhf1SvOx9UXLdWvBxtoJxA3XGvudygdrikY3OqyBErNIvwKggvvNlPhUPSW77wSj0z6SfPfRqjFK-phGxxvunGqDnFdvQUwd4IVyROWFNSYC82F92Cwe2EXGnoufl-qNiWGnMJBfxP8hL5NWSRZOYTqwysA94tdhaqc81vcF0-2P7TWgmsN8sVvXAsJKp8wAAAAHaR-9SAA"

TELEGRAM_BOT_TOKEN = "8466580267:AAEY317Frg8aBRCR86dipKC7hYRsGvnOfEs"
TELEGRAM_CHAT_ID = -1003244677600



MAX_WORKERS = 3
MAX_RETRIES = 3
INITIAL_DELAY = 2
DELAY_GROWTH = 1.5

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

def send_telegram(msg):
    try:
        with open("gifts_data.db", "rb") as f:
            files = {"document": ("gifts_data.db", f)}
            data = {
                "chat_id": TELEGRAM_CHAT_ID,
                "caption": msg,
                "parse_mode": "HTML"
            }
            r = requests.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendDocument",
                data=data, files=files, timeout=60
            )
        logging.info("Telegram DB sent" if r.status_code == 200 else f"Telegram send failed ({r.status_code})")
        return r
    except Exception as e:
        logging.error(f"Telegram error: {e}")
        return None

def create_database():
    import sqlite3
    conn=sqlite3.connect("gifts_data.db");c=conn.cursor()
    c.execute("PRAGMA journal_mode=WAL;")
    c.execute("""CREATE TABLE IF NOT EXISTS gifts(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    data_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
    c.execute("""CREATE TABLE IF NOT EXISTS market_data(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    price_ton REAL,
    price_usd REAL,
    change_24h_ton_percent REAL,
    change_24h_usd_percent REAL,
    market_cap_ton TEXT,
    market_cap_usd TEXT,
    fdv_ton TEXT,
    fdv_usd TEXT,
    image_url TEXT,
    raw_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)""")
    c.execute("""CREATE TABLE IF NOT EXISTS black_floor_history(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gift_name TEXT,
    short_name TEXT,
    black_price REAL,
    recorded_at TEXT DEFAULT (datetime('now','localtime')))""")
    
    # 🆕 جداول جديدة للنظام المحسن
    c.execute("""CREATE TABLE IF NOT EXISTS special_models_cache(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT,
    backdrop_name TEXT,
    price_ton REAL,
    collection_name TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model_name, backdrop_name, collection_name))""")
    
    c.execute("""CREATE TABLE IF NOT EXISTS collections_cache(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_name TEXT UNIQUE,
    backdrop_name TEXT,
    floor_price REAL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    raw_data TEXT)""")
    
    c.execute("""CREATE TABLE IF NOT EXISTS system_status(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component TEXT UNIQUE,
    status TEXT,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error TEXT)""")
    
    conn.commit();conn.close()


def create_session():
    s = requests.Session()
    retry = Retry(total=MAX_RETRIES, backoff_factor=1.5, status_forcelist=[429, 500, 502, 503, 504])
    s.mount("https://", HTTPAdapter(max_retries=retry))
    return s
TOKEN_FILE = "black_token.json"

async def get_auth_token():
    async with Client("temp", api_id=API_ID, api_hash=API_HASH, session_string=SESSION_STRING) as app:
        peer = await app.resolve_peer("portals")
        bot_app = InputBotAppShortName(bot_id=peer, short_name="market")
        web_view = await app.invoke(RequestAppWebView(peer=peer, app=bot_app, platform="android"))
        url = web_view.url
        if "tgWebAppData=" not in url:
            raise RuntimeError("tgWebAppData not found in returned URL")
        init_data = unquote(url.split("tgWebAppData=", 1)[1].split("&tgWebAppVersion", 1)[0])
        token = f"tma {init_data}"

        # 🕑 حفظ التوكن مع صلاحية ساعة واحدة
        data = {
            "token": token, 
            "time": time.time(),
            "expires_in": 3600  # ساعة واحدة
        }
        with open(TOKEN_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)

        return token
    
def all_gifts():
    try:
        s = create_session()
        r = s.get("https://giftcharts-api.onrender.com/gifts", timeout=25)
        return [x["name"] for x in r.json()] if r.status_code == 200 else []
    except Exception as e:
        logging.error(f"Gift list error: {e}")
        return []

def get_gift_data(name, auth):
    s = create_session()
    short = name.lower().replace(" ", "").replace("-", "").replace("'", "")
    url = f"https://portal-market.com/api/collections/filters?short_names={short}"
    delay = INITIAL_DELAY
    for attempt in range(MAX_RETRIES):
        try:
            print(f"\n[REQUEST] {name} ({short})")
            print(f"URL: {url}")
            r = s.get(url, headers={"authorization": auth}, timeout=25)
            print(f"STATUS: {r.status_code}")
            try:
                print("RESPONSE:", r.text[:800])
            except:
                pass
            if r.status_code == 200:
                return name, json.dumps(r.json()), None
            if r.status_code == 429:
                print(f"RATE LIMITED → retry in {delay}s")
                time.sleep(delay)
                delay *= DELAY_GROWTH
                continue
            print("FAILED NON-200")
            return name, None, f"Status {r.status_code}"
        except Exception as e:
            print(f"ERROR: {e}")
            time.sleep(delay)
            delay *= DELAY_GROWTH
    return name, None, "Max retries reached"

async def run_cycle():
    start = time.time()
    try:
        token = await get_auth_token()
        print("[TOKEN OK]")
    except Exception as e:
        print("[TOKEN FAIL]", e)
        return

    create_database()
    gifts = all_gifts()
    print(f"[GIFTS LOADED] {len(gifts)}")

    ok = 0
    fail = 0
    errors = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futures = {ex.submit(get_gift_data, g, token): g for g in gifts}
        for f in as_completed(futures):
            name, data, err = f.result()
            if data:
                save_gift(name, data)
                ok += 1
                print(f"[OK] {name}")
            else:
                fail += 1
                errors.append((name, err))
                print(f"[FAIL] {name} → {err}")

    market = get_market_data()
    save_market_data_to_db(market)
    print(f"[MARKET SAVED] {len(market)} items")

    black_count = fetch_black_floor(token)
    print(f"[BLACK FLOOR] {black_count} collections")

    total = round(time.time() - start, 2)
    print(f"\nDONE | OK={ok} FAIL={fail} TIME={total}s")

    if errors:
        print("\n--- FAIL LOG ---")
        for name, err in errors:
            print(name, "→", err)

async def main():
    while True:
        await run_cycle()
        time.sleep(300)

def save_gift(n, j):
    conn = sqlite3.connect("gifts_data.db")
    c = conn.cursor()
    c.execute("INSERT OR REPLACE INTO gifts (name,data_json) VALUES (?,?)", (n, j))
    conn.commit(); conn.close()

import sqlite3, requests, logging
import requests, sqlite3, logging

def shorten_number(num):
    """اختصار الأرقام مثل 1.23K / 4.56M / 1.2B"""
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


def get_market_data():
    try:
        r = requests.get("https://giftcharts-api.onrender.com/gifts", timeout=25)
        if r.status_code != 200:
            raise Exception(f"Status {r.status_code}")
        data = r.json()
        result = {}

        for x in data:
            try:
                name = x.get("name", "Unknown NFT")
                ton = float(x.get("priceTon") or 0)
                usd = float(x.get("priceUsd") or 0)
                ton_24h = x.get("tonPrice24hAgo")
                usd_24h = x.get("usdPrice24hAgo")
                upgraded = float(x.get("upgradedSupply") or 0)
                supply = float(x.get("supply") or 0)

                # حساب التغيّر اليومي
                change_ton = round(((ton - ton_24h) / ton_24h) * 100, 2) if ton_24h else None
                change_usd = round(((usd - usd_24h) / usd_24h) * 100, 2) if usd_24h else None

                # حساب Market Cap و FDV
                market_cap_ton = ton * upgraded
                market_cap_usd = usd * upgraded
                fdv_ton = ton * (supply or upgraded)
                fdv_usd = usd * (supply or upgraded)

                # لو القيمتين متساويتين، نخفي FDV (اختياري)
                if abs(fdv_ton - market_cap_ton) < 0.01:
                    fdv_ton = fdv_usd = None

                result[name] = {
                    **x,
                    "change_24h_ton_%": change_ton,
                    "change_24h_usd_%": change_usd,
                    "market_cap_ton": shorten_number(market_cap_ton),
                    "market_cap_usd": shorten_number(market_cap_usd),
                    "fdv_ton": shorten_number(fdv_ton) if fdv_ton else None,
                    "fdv_usd": shorten_number(fdv_usd) if fdv_usd else None,
                    "image_url": f"https://giftcharts-api.onrender.com/api/image/{x.get('image')}" if x.get("image") else None
                }

            except Exception as e:
                logging.warning(f"Error parsing {x.get('name')}: {e}")
                continue

        return result

    except Exception as e:
        logging.error(f"Market data error: {e}")
        return {}


def save_market_data_to_db(data):
    conn = sqlite3.connect("gifts_data.db")
    c = conn.cursor()

    c.execute('''
        CREATE TABLE IF NOT EXISTS market_data (
            name TEXT PRIMARY KEY,
            price_ton REAL,
            price_usd REAL,
            change_24h_ton_percent REAL,
            change_24h_usd_percent REAL,
            market_cap_ton TEXT,
            market_cap_usd TEXT,
            fdv_ton TEXT,
            fdv_usd TEXT,
            image_url TEXT,
            raw_json TEXT
        )
    ''')

    for name, x in data.items():
        c.execute('''
            INSERT OR REPLACE INTO market_data 
            (name, price_ton, price_usd, change_24h_ton_percent, change_24h_usd_percent,
             market_cap_ton, market_cap_usd, fdv_ton, fdv_usd, image_url, raw_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            name,
            x.get("priceTon"),
            x.get("priceUsd"),
            x.get("change_24h_ton_%"),
            x.get("change_24h_usd_%"),
            x.get("market_cap_ton"),
            x.get("market_cap_usd"),
            x.get("fdv_ton"),
            x.get("fdv_usd"),
            x.get("image_url"),
            str(x)
        ))

    conn.commit()
    conn.close()


import sqlite3, requests, logging
from datetime import datetime

def create_session():
    s = requests.Session()
    s.headers.update({"User-Agent": "Mozilla/5.0"})
    return s

def fetch_black_floor(h):
    count = 0
    try:
        s = create_session()
        r = s.get(
            "https://portal-market.com/api/collections/filters/preview?owned_only=false",
            headers={"authorization": h}, timeout=20
        )
        data = r.json()

        conn = sqlite3.connect("gifts_data.db")
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS black_floor_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                gift_name TEXT,
                short_name TEXT,
                black_price REAL,
                recorded_at TEXT
            )
        """)

        for i in data.get("collections", []):
            n, sname = i["name"], i["short_name"]
            try:
                x = s.get(
                    "https://portal-market.com/api/collections/filters",
                    params={"short_names": sname},
                    headers={"authorization": h},
                    timeout=20
                )
                val = x.json().get("floor_prices", {}).get(sname, {}).get("backdrops", {}).get("Black")
                if val:
                    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    cur.execute(
                        "INSERT INTO black_floor_history (gift_name, short_name, black_price, recorded_at) VALUES (?,?,?,?)",
                        (n, sname, float(val), now)
                    )
                    count += 1
            except Exception as e:
                logging.warning(f"Error for {sname}: {e}")
                continue

        conn.commit()
        conn.close()
        return count

    except Exception as e:
        logging.error(f"Black floor error: {e}")
        return count


async def run_cycle():
    start = time.time()
    report_lines = []
    try:
        token = await get_auth_token()
        report_lines.append("🔐 Auth token retrieved successfully.")
    except Exception as e:
        report_lines.append(f"❌ Auth token failed: {e}")
        send_telegram("\n".join(report_lines))
        return

    create_database()
    gifts = all_gifts()
    report_lines.append(f"🎁 Loaded {len(gifts)} gifts from API.")

    ok, fail = 0, 0
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futures = {ex.submit(get_gift_data, g, token): g for g in gifts}
        for f in as_completed(futures):
            n, d, e = f.result()
            if d:
                save_gift(n, d)
                ok += 1
            else:
                fail += 1

    market = get_market_data()
    save_market_data_to_db(market)
    report_lines.append(f"📊 Market data saved for {len(market)} items.")

    black_count = fetch_black_floor(token)
    report_lines.append(f"🕳️ Black floor prices fetched for {black_count} collections.")

    total_time = round(time.time() - start, 2)
    report_lines.append(f"\n🟢 Cycle completed\n✅ {ok} success | ❌ {fail} failed\n⏱️ Time: {total_time}s\n🕒 {datetime.now().strftime('%H:%M:%S')}")

    final_report = "\n".join(report_lines)
    print(final_report)
    send_telegram(final_report)

async def main():
    while True:
        await run_cycle()
        time.sleep(300)

if __name__ == "__main__":
    asyncio.run(main())
