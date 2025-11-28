import json
import base64
import io
import asyncio
import time
import hashlib
import os
import re
import logging
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any
from collections import defaultdict

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, Response, FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

import aiohttp

from core import (
    verify_telegram_init_data,
    get_http_session,
    get_cached_price,
    get_market_data,
    get_user_nfts,
    get_single_gift_price,
    get_black_summary,
    get_black_history,
    fetch_gift_data,
    get_market_cap_changes,
    get_user_profile,
    cleanup_resources,
    DEVELOPMENT_MODE
)
from tokens_db import create_user_token, verify_token_and_increment, get_user_token_info, cleanup_expired_tokens
from user_preferences import (
    get_or_create_user_preferences,
    update_user_language,
    update_user_theme,
    increment_gift_check,
    get_global_statistics,
    get_user_statistics,
    update_user_activity
)
from ads_manager import ads_manager

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(BASE_DIR, "cached_images")
os.makedirs(CACHE_DIR, exist_ok=True)

ADMIN_IDS = [6213708507, 1437352242]
BOT_TOKEN = "8466580267:AAEY317Frg8aBRCR86dipKC7hYRsGvnOfEs"
LOCAL_ACCESS_PASSWORD = "nova_local_2024"

local_cache: Dict[str, Any] = {}
cache_timestamps: Dict[str, float] = {}
stale_cache: Dict[str, Any] = {}
request_counts = defaultdict(list)
blocked_ips = set()

CACHE_TTL = 300
IMAGE_CACHE_TTL = 172800
RATE_LIMIT_WINDOW = 60
MAX_REQUESTS_PER_MINUTE = 30
MAX_REQUESTS_PER_USER = 40
BLOCK_DURATION = 300
AUTH_TOKEN_TTL = 3600


def is_admin(user_id) -> bool:
    if not user_id or user_id == "local_access":
        return False
    try:
        return int(user_id) in ADMIN_IDS
    except:
        return False


def cache_get(key: str, allow_stale: bool = True) -> Optional[Any]:
    current_time = time.time()
    
    if key in local_cache:
        age = current_time - cache_timestamps[key]
        
        if key.startswith('image:'):
            ttl = IMAGE_CACHE_TTL
        elif key.startswith('gift:price:'):
            ttl = 60
        else:
            ttl = CACHE_TTL
        
        if age < ttl:
            return local_cache[key]
        else:
            if key.startswith('gift:price:'):
                del local_cache[key]
                del cache_timestamps[key]
            else:
                stale_cache[key] = local_cache[key]
    
    return None


def cache_set(key: str, value: Any, ttl: Optional[int] = None):
    local_cache[key] = value
    cache_timestamps[key] = time.time()
    if key in stale_cache:
        del stale_cache[key]


def check_rate_limit(ip: str) -> bool:
    now = time.time()
    if ip in blocked_ips:
        return False
    
    request_counts[ip] = [t for t in request_counts[ip] if now - t < RATE_LIMIT_WINDOW]
    
    if len(request_counts[ip]) >= MAX_REQUESTS_PER_MINUTE:
        blocked_ips.add(ip)
        asyncio.create_task(unblock_ip_later(ip))
        return False
    
    request_counts[ip].append(now)
    return True


async def unblock_ip_later(ip: str):
    await asyncio.sleep(BLOCK_DURATION)
    blocked_ips.discard(ip)


def verify_init_data_and_track(init_data: str):
    try:
        from urllib.parse import parse_qsl, unquote
        
        parsed = dict(parse_qsl(init_data, keep_blank_values=True))
        raw_user = parsed.get("user")
        if raw_user:
            try:
                user = json.loads(raw_user)
            except:
                user = json.loads(unquote(raw_user))
            user_id = user.get("id")
            
            if user_id:
                token_info = get_user_token_info(user_id)
                
                if token_info:
                    if token_info['request_count'] >= token_info['max_requests']:
                        return None, "Request limit exceeded"
                    
                    try:
                        result = verify_token_and_increment(token_info['token'])
                        if len(result) == 3:
                            user_id_verified, is_subscribed, error = result
                        else:
                            user_id_verified, error = result
                            is_subscribed = False
                        
                        if user_id_verified:
                            return user_id_verified, None
                        else:
                            return None, error
                    except Exception as e:
                        logger.error(f"Error in verify_token_and_increment: {e}")
                        return None, "Token verification error"
        
        ok, user_id, subscribed = verify_telegram_init_data(init_data, BOT_TOKEN)
        if not ok:
            return None, "Authentication failed"
        
        token = create_user_token(user_id, MAX_REQUESTS_PER_USER, subscribed)
        return user_id, None
        
    except Exception as e:
        logger.error(f"Auth error: {e}")
        return None, "Authentication error"


def verify_user_auth(request: Request):
    if DEVELOPMENT_MODE:
        logger.warning(f"[DEV MODE] Skipping auth for {request.url.path}")
        return "dev_user_123", None
    
    local_password = request.headers.get("X-Local-Password")
    if local_password == LOCAL_ACCESS_PASSWORD:
        return "local_access", None
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None, "Access Denied S2170"
    
    token = auth_header[7:]
    
    try:
        result = verify_token_and_increment(token)
        if len(result) == 3:
            user_id, is_subscribed, error = result
        else:
            user_id, error = result
            is_subscribed = False
        
        if user_id:
            return user_id, None
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        error = "Token verification error"
    
    if error != "Invalid or inactive token":
        return None, "Access Denied S2170"
    
    user_id, error = verify_init_data_and_track(token)
    
    if user_id:
        return user_id, None
    else:
        return None, "Access Denied S2170"


def generate_auth_token(user_id):
    return create_user_token(user_id, MAX_REQUESTS_PER_USER)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Nova Calculator API...")
    try:
        await get_http_session()
        logger.info("All resources initialized successfully")
        if DEVELOPMENT_MODE:
            logger.warning("⚠️ DEVELOPMENT MODE ENABLED - Auth verification is disabled!")
    except Exception as e:
        logger.error(f"Failed to initialize resources: {e}")
        raise
    
    yield
    
    logger.info("Shutting down Nova Calculator API...")
    await cleanup_resources()


app = FastAPI(
    title="Nova Calculator",
    version="3.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.middleware("http")
async def auth_and_rate_limit_middleware(request: Request, call_next):
    public_endpoints = [
        "/health",
        "/api/verify-auth",
    ]
    
    if (request.url.path in public_endpoints or
        request.url.path.startswith("/api/image/") or
        request.url.path.startswith("/api/ads/") or
        request.method == "OPTIONS"):
        response = await call_next(request)
        return response
    
    if request.url.path.startswith("/api/"):
        client_host = request.client.host if request.client else "unknown"
        if client_host in ["127.0.0.1", "localhost", "::1"]:
            response = await call_next(request)
            return response
        
        admin_password = request.headers.get("X-Admin-Password")
        if admin_password == "nova_admin_2024":
            response = await call_next(request)
            return response
        
        if DEVELOPMENT_MODE:
            response = await call_next(request)
            return response
        
        user_id, error = verify_user_auth(request)
        if error:
            return JSONResponse(
                status_code=401,
                content={"error": error}
            )
    
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip):
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded"}
        )
    
    response = await call_next(request)
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )


@app.get("/api/market-data")
async def api_market_data(request: Request):
    """Fetch market data with proper caching and error handling"""
    try:
        cache_key = "market:data"
        data = cache_get(cache_key)
        
        if data is None:
            try:
                base_url = str(request.base_url).rstrip("/")
                # Call get_market_data which handles event loop properly
                data = get_market_data(base_url)
                
                # Only cache if we got valid data (not an error)
                if data and "error" not in data:
                    cache_set(cache_key, data)
            except Exception as fetch_error:
                logger.error(f"Failed to fetch market-data: {fetch_error}")
                if cache_key in stale_cache:
                    data = stale_cache[cache_key]
                else:
                    # Return cached data if available, otherwise error
                    data = {"error": f"Failed to fetch market data: {str(fetch_error)}"}
        
        return JSONResponse(
            content=data,
            headers={"Cache-Control": "public, max-age=60"}
        )
    except Exception as e:
        logger.error(f"Error in api_market_data: {e}")
        return JSONResponse(
            content={"error": f"Server error: {str(e)}"},
            status_code=500
        )


@app.get("/api/user/{username}/nfts")
async def api_user_nfts(username: str, request: Request):
    try:
        if username.lower() == "giftstoportals":
            user_id, error = verify_user_auth(request)
            if not is_admin(user_id):
                raise HTTPException(status_code=403, detail="Access denied to this user")
        
        cache_key = f"user:{username}:nfts"
        data = cache_get(cache_key)
        if data is None:
            data = await get_user_nfts(username)
            cache_set(cache_key, data)
        
        try:
            user_id, _ = verify_user_auth(request)
            if user_id and user_id != "local_access":
                gift_count = len(data.get("data", {}).get("nfts", [])) if data.get("success") else 0
                is_channel = username.startswith("@") and "/" in username
                increment_gift_check(int(user_id), is_channel, gift_count)
        except:
            pass
        
        return JSONResponse(content=data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting NFTs for {username}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/gift/from-link")
async def api_gift_from_link(url: str):
    try:
        normalized_url = url.strip().replace(" ", "")
        
        if normalized_url.startswith("t.me/"):
            normalized_url = "https://" + normalized_url
        elif normalized_url.startswith("http://t.me/"):
            normalized_url = normalized_url.replace("http://", "https://")
        elif normalized_url.startswith("www.t.me/"):
            normalized_url = "https://" + normalized_url.replace("www.", "")
        
        if not normalized_url.startswith("https://t.me/nft/"):
            raise HTTPException(status_code=400, detail="Invalid URL format. Expected: https://t.me/nft/GiftName-123")
        
        cache_key = f"gift:price:{normalized_url}"
        data = cache_get(cache_key)
        if data is None:
            data = await get_single_gift_price(normalized_url)
            cache_set(cache_key, data)
        
        return JSONResponse(content={
            "success": True,
            "data": data
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting gift from link {url}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/black/summary")
async def api_black_summary():
    try:
        cache_key = "black:summary"
        data = cache_get(cache_key)
        
        if data is None:
            try:
                data = get_black_summary()
                cache_set(cache_key, data)
            except Exception as fetch_error:
                logger.error(f"Failed to fetch black summary: {fetch_error}")
                if cache_key in stale_cache:
                    data = stale_cache[cache_key]
                else:
                    raise
        
        return JSONResponse(
            content=data,
            headers={"Cache-Control": "public, max-age=300"}
        )
    except Exception as e:
        logger.error(f"Error in api_black_summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/black/{gift}")
async def api_black_history(gift: str):
    try:
        cache_key = f"black:history:{gift}"
        data = cache_get(cache_key)
        
        if data is None:
            try:
                data = get_black_history(gift)
                cache_set(cache_key, data)
            except Exception as fetch_error:
                logger.error(f"Failed to fetch black history for {gift}: {fetch_error}")
                if cache_key in stale_cache:
                    data = stale_cache[cache_key]
                else:
                    raise
        
        return JSONResponse(
            content=data,
            headers={"Cache-Control": "public, max-age=300"}
        )
    except Exception as e:
        logger.error(f"Error getting black history for {gift}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/image/{image_name}")
async def proxy_image(image_name: str):
    w, q = 128, 75
    ram_cache_key = f"image:{image_name}_{w}_{q}"
    
    cached_data = cache_get(ram_cache_key)
    if cached_data:
        return Response(cached_data, media_type="image/webp", headers={"X-Cache": "RAM-HIT"})
    
    cache_key = hashlib.sha256(f"{image_name}_{w}_{q}".encode()).hexdigest()
    cache_path = os.path.join(CACHE_DIR, f"{cache_key}.webp")
    if os.path.exists(cache_path):
        with open(cache_path, "rb") as f:
            data = f.read()
            cache_set(ram_cache_key, data)
            return Response(data, media_type="image/webp", headers={"X-Cache": "DISK-HIT"})
    
    headers = {"User-Agent": "Mozilla/5.0"}
    urls = [
        f"https://giftcharts.com/gifts/{image_name}.webp",
        f"https://giftcharts.com/_next/image?url=%2Fgifts%2F{image_name}.webp&w={w}&q={q}"
    ]
    
    session = await get_http_session()
    for url in urls:
        try:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=7)) as r:
                if r.status == 200:
                    data = await r.read()
                    with open(cache_path, "wb") as f:
                        f.write(data)
                    cache_set(ram_cache_key, data)
                    return Response(data, media_type="image/webp", headers={"X-Cache": "MISS"})
        except:
            pass
    
    return JSONResponse(content={"error": "Image not found"}, status_code=404)


@app.get("/api/gift/{name}/data")
async def api_gift_data(name: str):
    try:
        cache_key = f"gift:data:{name}"
        data = cache_get(cache_key)
        
        if data is None:
            try:
                data = await fetch_gift_data(name)
                cache_set(cache_key, data)
            except Exception as fetch_error:
                logger.error(f"Failed to fetch gift data for {name}: {fetch_error}")
                if cache_key in stale_cache:
                    data = stale_cache[cache_key]
                else:
                    raise
        
        if data and "error" in data:
            raise HTTPException(status_code=404, detail="Gift not found")
        
        return JSONResponse(
            content=data,
            headers={"Cache-Control": "public, max-age=300"}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting gift data for {name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/send-image")
async def send_image(req: Request):
    try:
        data = await req.json()
        img_b64 = data.get("image")
        user_id = data.get("id")
        
        if not img_b64 or not user_id:
            raise HTTPException(status_code=400, detail="Missing image or user_id")
        
        img = base64.b64decode(img_b64)
        session = await get_http_session()
        
        form = aiohttp.FormData()
        form.add_field("chat_id", str(user_id))
        form.add_field("caption", "Powered By Nova Calculator", content_type="text/plain")
        form.add_field("document", img, filename="image.png", content_type="image/png")
        
        async with session.post(f"https://api.telegram.org/bot{BOT_TOKEN}/sendDocument", data=form) as response:
            if response.status != 200:
                raise HTTPException(status_code=500, detail="Failed to send image")
            return {"done": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending image: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/verify-auth")
async def verify_auth(request: Request):
    try:
        data = await request.json()
        init_data = data.get("init_data")
        
        if not init_data:
            raise HTTPException(status_code=400, detail="init_data required")
        
        ok, user_id, subscribed = verify_telegram_init_data(init_data, BOT_TOKEN)
        
        if not ok:
            return JSONResponse({"valid": False}, status_code=401)
        
        token = create_user_token(user_id, MAX_REQUESTS_PER_USER, subscribed)
        
        try:
            user_is_admin = is_admin(user_id)
            ads = ads_manager.get_active_ads(include_admin=user_is_admin)
            
            if ads:
                ad_ids = [ad['id'] for ad in ads[:5]]
                ads_manager.record_view(ad_ids, int(user_id))
        except Exception as e:
            logger.warning(f"Failed to get ads: {e}")
            ads = []
        
        return {
            "valid": True,
            "user_id": user_id,
            "is_subscribed": subscribed,
            "token": token,
            "requests_remaining": MAX_REQUESTS_PER_USER,
            "ads": ads
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying auth: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/user-profile")
async def api_user_profile(username: str):
    try:
        data = cache_get(f"user:{username}:profile")
        if data is None:
            data = await get_user_profile(username)
            cache_set(f"user:{username}:profile", data)
        
        if data and "error" in data:
            raise HTTPException(status_code=400, detail=data["error"])
        
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user profile for {username}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/market-cap-changes")
async def api_market_cap_changes():
    try:
        cache_key = "market:cap:changes"
        data = cache_get(cache_key)
        
        if data is None:
            try:
                data = await get_market_cap_changes()
                cache_set(cache_key, data)
            except Exception as fetch_error:
                logger.error(f"Failed to fetch market cap changes: {fetch_error}")
                if cache_key in stale_cache:
                    data = stale_cache[cache_key]
                else:
                    raise
        
        return JSONResponse(
            content=data,
            headers={"Cache-Control": "public, max-age=300"}
        )
    except Exception as e:
        logger.error(f"Error in api_market_cap_changes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/user/preferences")
async def get_user_preferences_endpoint(request: Request):
    try:
        user_id, error = verify_user_auth(request)
        if error or not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        if user_id == "local_access":
            return {"error": "Local access not supported for preferences"}
        
        preferences = get_or_create_user_preferences(int(user_id))
        update_user_activity(int(user_id))
        
        return {
            "success": True,
            "data": {
                "language": preferences.get("language", "en"),
                "theme": preferences.get("theme", "dark"),
                "country": preferences.get("country", "USA"),
                "is_premium": preferences.get("is_premium", False)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/user/preferences")
async def update_user_preferences_endpoint(request: Request):
    try:
        user_id, error = verify_user_auth(request)
        if error or not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        if user_id == "local_access":
            return {"error": "Local access not supported for preferences"}
        
        data = await request.json()
        user_id = int(user_id)
        
        success = True
        if "language" in data:
            if data["language"] in ["ar", "en", "ru", "zh"]:
                success = update_user_language(user_id, data["language"])
        
        if "theme" in data:
            if data["theme"] in ["light", "dark", "system"]:
                success = update_user_theme(user_id, data["theme"])
        
        preferences = get_or_create_user_preferences(user_id)
        
        return {
            "success": success,
            "data": {
                "language": preferences.get("language", "en"),
                "theme": preferences.get("theme", "dark"),
                "country": preferences.get("country", "USA")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user preferences: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/statistics/global")
async def get_global_stats():
    try:
        stats = get_global_statistics()
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        logger.error(f"Error getting global statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/statistics/user")
async def get_user_stats(request: Request):
    try:
        user_id, error = verify_user_auth(request)
        if error or not user_id:
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        if user_id == "local_access":
            return {"error": "Local access not supported"}
        
        stats = get_user_statistics(int(user_id))
        return {
            "success": True,
            "data": stats
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "3.0", "dev_mode": DEVELOPMENT_MODE}


@app.get("/")
async def root():
    return {
        "name": "Nova Calculator API",
        "version": "3.0",
        "docs": "/docs",
        "health": "/health",
        "dev_mode": DEVELOPMENT_MODE
    }


@app.get("/api/ads/list")
async def get_ads_list(request: Request):
    try:
        user_id, error = verify_user_auth(request)
        user_is_admin = is_admin(user_id)
        
        ads = ads_manager.get_active_ads(include_admin=user_is_admin)
        
        if ads and user_id and user_id != "local_access":
            ad_ids = [ad['id'] for ad in ads[:5]]
            ads_manager.record_view(ad_ids, int(user_id) if user_id != "local_access" else None)
        
        return JSONResponse(content={
            "success": True,
            "ads": ads,
            "is_admin": user_is_admin
        })
        
    except Exception as e:
        logger.error(f"Error getting ads list: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ads/add")
async def add_new_ad(request: Request):
    try:
        user_id, error = verify_user_auth(request)
        
        if not is_admin(user_id):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        form = await request.form()
        
        title = form.get("title")
        target_url = form.get("target_url")
        max_clicks = form.get("max_clicks")
        max_views = form.get("max_views")
        duration_hours = form.get("duration_hours")
        priority = form.get("priority", 0)
        
        image_file = form.get("image")
        if not image_file:
            raise HTTPException(status_code=400, detail="Image is required")
        
        image_data = await image_file.read()
        filename = image_file.filename
        
        success, message, ad_id = ads_manager.add_ad(
            title=title,
            image_data=image_data,
            filename=filename,
            target_url=target_url,
            created_by=int(user_id),
            max_clicks=int(max_clicks) if max_clicks else None,
            max_views=int(max_views) if max_views else None,
            duration_hours=int(duration_hours) if duration_hours else None,
            priority=int(priority)
        )
        
        if not success:
            raise HTTPException(status_code=400, detail=message)
        
        return JSONResponse(content={
            "success": True,
            "message": message,
            "ad_id": ad_id
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding ad: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/ads/{ad_id}")
async def delete_ad(ad_id: int, request: Request):
    try:
        user_id, error = verify_user_auth(request)
        
        if not is_admin(user_id):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        success, message = ads_manager.delete_ad(ad_id)
        
        if not success:
            raise HTTPException(status_code=404, detail=message)
        
        return JSONResponse(content={
            "success": True,
            "message": message
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting ad: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ads/click/{ad_id}")
async def track_ad_click(ad_id: int, request: Request):
    try:
        user_id, _ = verify_user_auth(request)
        client_ip = request.client.host if request.client else None
        user_agent = request.headers.get("User-Agent")
        
        success, target_url = ads_manager.record_click(
            ad_id=ad_id,
            user_id=int(user_id) if user_id and user_id != "local_access" else None,
            ip_address=client_ip,
            user_agent=user_agent
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Ad not found")
        
        return RedirectResponse(url=target_url, status_code=302)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error tracking click: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ads/image/{filename}")
async def get_ad_image(filename: str):
    try:
        file_path = os.path.join(BASE_DIR, "ads_images", filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Image not found")
        
        ext = os.path.splitext(filename)[1].lower()
        media_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        }
        media_type = media_types.get(ext, 'image/jpeg')
        
        return FileResponse(
            file_path,
            media_type=media_type,
            headers={
                "Cache-Control": "public, max-age=86400",
                "Access-Control-Allow-Origin": "*"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting ad image: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ads/statistics")
async def get_ads_statistics(request: Request):
    try:
        user_id, error = verify_user_auth(request)
        
        if not is_admin(user_id):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        stats = ads_manager.get_statistics()
        
        return JSONResponse(content={
            "success": True,
            "statistics": stats
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=5002,
        reload=False,
        workers=1,
        log_level="info",
        access_log=True
    )
