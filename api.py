import json
import platform
import threading
import queue
import hashlib
import os
import asyncio
from ctypes import cdll, c_void_p, c_char_p, c_double
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
import platform
from ctypes import cdll

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

if platform.system().lower() == "windows":
    LIB_PATH = os.path.join(BASE_DIR, "tdjson.dll")
else:
    local_so = os.path.join(BASE_DIR, "libtdjson.so")
    if os.path.exists(local_so):
        LIB_PATH = local_so
    else:
        possible_paths = [
            "/usr/local/lib/libtdjson.so",
            "/usr/lib/libtdjson.so",
            "/usr/lib/x86_64-linux-gnu/libtdjson.so",
            "/root/td/build/libtdjson.so"
        ]
        for p in possible_paths:
            if os.path.exists(p):
                LIB_PATH = p
                break
        else:
            raise RuntimeError("libtdjson.so not found on system")

GIFTS_PATH = os.path.join(BASE_DIR, "gifts.json")
PROFILE_DIR = os.path.join(BASE_DIR, "Profile Images")

lib = cdll.LoadLibrary(LIB_PATH)
lib.td_json_client_create.restype = c_void_p
lib.td_json_client_send.argtypes = [c_void_p, c_char_p]
lib.td_json_client_receive.argtypes = [c_void_p, c_double]
lib.td_json_client_receive.restype = c_char_p

client = lib.td_json_client_create()
client_lock = threading.Lock()
request_id_counter = 0
request_id_lock = threading.Lock()
pending_requests = {}
pending_lock = threading.Lock()
market_data = {}

def send(obj):
    with client_lock:
        lib.td_json_client_send(client, json.dumps(obj, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))

def receive(timeout=1.0):
    r = lib.td_json_client_receive(client, float(timeout))
    if not r:
        return None
    try:
        return json.loads(r.decode("utf-8"))
    except:
        return None

def get_request_id():
    global request_id_counter
    with request_id_lock:
        request_id_counter += 1
        return request_id_counter

def init_tdlib():
    send({"@type": "setLogVerbosityLevel", "new_verbosity_level": 0})
    send({"@type": "getAuthorizationState"})
    auth_set = False
    while True:
        data = receive(1.0)
        if not data:
            continue
        t = data.get("@type")
        if t == "updateAuthorizationState":
            state = data["authorization_state"]["@type"]
            if state == "authorizationStateWaitTdlibParameters" and not auth_set:
                send({
                    "@type": "setTdlibParameters",
                    "use_test_dc": False,
                    "database_directory": "td_db",
                    "files_directory": "td_files",
                    "use_file_database": True,
                    "use_chat_info_database": True,
                    "use_message_database": True,
                    "use_secret_chats": False,
                    "api_id": 28907635,
                    "api_hash": "fa6c3335de68283781976ae20f813f73",
                    "system_language_code": "en",
                    "device_model": "PC",
                    "system_version": platform.system(),
                    "application_version": "1.0",
                    "enable_storage_optimizer": True
                })
                auth_set = True
            elif state == "authorizationStateWaitPhoneNumber":
                phone = input("Enter phone number: ")
                send({"@type": "setAuthenticationPhoneNumber", "phone_number": phone})
            elif state == "authorizationStateWaitCode":
                code = input("Enter code: ")
                send({"@type": "checkAuthenticationCode", "code": code})
            elif state == "authorizationStateWaitPassword":
                password = input("Enter password: ")
                send({"@type": "checkAuthenticationPassword", "password": password})
            elif state == "authorizationStateReady":
                return True
        elif t == "error":
            return False

def load_market_data():
    global market_data
    with open(GIFTS_PATH, encoding="utf-8") as f:
        market_data = {str(x["id"]): x for x in json.load(f)}

def dispatch_response(data):
    req_id = data.get("@extra")
    if req_id is None:
        return
    with pending_lock:
        if req_id in pending_requests:
            q = pending_requests.pop(req_id)
            try:
                q.put_nowait(data)
            except:
                pass

def receiver_loop():
    while True:
        d = receive(0.5)
        if d:
            dispatch_response(d)

def process_channel_gifts(received):
    gifts = received.get("gifts", [])
    upgraded = []
    unupgraded_map = {}
    for item in gifts:
        gift_wrapper = item.get("gift", {})
        gtype = gift_wrapper.get("@type")
        if gtype == "sentGiftUpgraded":
            ug = gift_wrapper.get("gift", {})
            model_data = ug.get("model", {}) or {}
            rarity_raw = model_data.get("rarity_per_mille")
            rarity = rarity_raw / 10 if isinstance(rarity_raw, (int, float)) else None
            upgraded.append({
                "id": ug.get("id"),
                "regular_id": ug.get("regular_gift_id"),
                "title": ug.get("title"),
                "name": ug.get("name"),
                "number": ug.get("number"),
                "rarity_per_mille": rarity,
                "model": model_data.get("name"),
                "hashtag": ug.get("name"),
                "backdrop": ug.get("backdrop", {}).get("name"),
                "colors": {
                    "center": ug.get("backdrop", {}).get("colors", {}).get("center_color"),
                    "edge": ug.get("backdrop", {}).get("colors", {}).get("edge_color"),
                    "symbol": ug.get("backdrop", {}).get("colors", {}).get("symbol_color"),
                    "text": ug.get("backdrop", {}).get("colors", {}).get("text_color"),
                }
            })
        elif gtype == "sentGiftRegular":
            rg = gift_wrapper
            gid = str(rg.get("gift", {}).get("id"))
            info = market_data.get(gid)
            if info:
                if gid not in unupgraded_map:
                    unupgraded_map[gid] = {
                        "id": gid,
                        "short_name": info.get("short_name"),
                        "full_name": info.get("full_name"),
                        "image_url": info.get("image_url") or f"https://quant-marketplace.com/assets/gifts/{gid}/default.png",
                        "supply": info.get("supply"),
                        "count": 1
                    }
                else:
                    unupgraded_map[gid]["count"] += 1
    return {
        "total_nfts": len(gifts),
        "total_upgraded": len(upgraded),
        "total_unupgraded": sum(v["count"] for v in unupgraded_map.values()),
        "upgraded": upgraded,
        "unupgraded": list(unupgraded_map.values())
    }

def process_user_gifts(received):
    gifts = received.get("gifts", [])
    upgraded = []
    unupgraded = {}
    for item in gifts:
        g = item.get("gift", {})
        t = g.get("@type")
        if t == "sentGiftUpgraded":
            u = g.get("gift", {})
            m = u.get("model", {}) or {}
            r = m.get("rarity_per_mille")
            upgraded.append({
                "id": u.get("id"),
                "regular_id": u.get("regular_gift_id"),
                "title": u.get("title"),
                "name": u.get("name"),
                "number": u.get("number"),
                "rarity_per_mille": r / 10 if isinstance(r, (int, float)) else None,
                "model": m.get("name"),
                "hashtag": u.get("name"),
                "backdrop": u.get("backdrop", {}).get("name"),
                "colors": {
                    "center": u.get("backdrop", {}).get("colors", {}).get("center_color"),
                    "edge": u.get("backdrop", {}).get("colors", {}).get("edge_color"),
                    "symbol": u.get("backdrop", {}).get("colors", {}).get("symbol_color"),
                    "text": u.get("backdrop", {}).get("colors", {}).get("text_color")
                }
            })
        elif t == "sentGiftRegular":
            gid = str(g.get("gift", {}).get("id"))
            info = market_data.get(gid)
            if info:
                if gid not in unupgraded:
                    unupgraded[gid] = {
                        "id": gid,
                        "short_name": info.get("short_name"),
                        "full_name": info.get("full_name"),
                        "image_url": info.get("image_url") or f"https://quant-marketplace.com/assets/gifts/{gid}/default.png",
                        "supply": info.get("supply"),
                        "count": 1
                    }
                else:
                    unupgraded[gid]["count"] += 1
    return {
        "total_nfts": len(gifts),
        "total_upgraded": len(upgraded),
        "total_unupgraded": sum(v["count"] for v in unupgraded.values()),
        "upgraded": upgraded,
        "unupgraded": list(unupgraded.values())
    }

def download_profile(photo_obj):
    file_id = photo_obj.get("small", {}).get("id") or photo_obj.get("big", {}).get("id")
    if not file_id:
        return None
    req_id = get_request_id()
    q = queue.Queue(maxsize=1)
    with pending_lock:
        pending_requests[req_id] = q
    send({
        "@type": "downloadFile",
        "file_id": file_id,
        "priority": 1,
        "offset": 0,
        "limit": 0,
        "synchronous": True,
        "@extra": req_id
    })
    try:
        while True:
            d = q.get(timeout=10)
            if d.get("@type") == "file" and d.get("local", {}).get("is_downloading_completed"):
                return d.get("local", {}).get("path")
            if d.get("@type") == "updateFile":
                f = d.get("file", {})
                if f.get("id") == file_id and f.get("local", {}).get("is_downloading_completed"):
                    return f.get("local", {}).get("path")
    except queue.Empty:
        return None

def process_profile(user_obj):
    full_name = f"{user_obj.get('first_name', '')} {user_obj.get('last_name', '')}".strip()
    user_id = user_obj["id"]
    hashed = hashlib.sha256(str(user_id).encode()).hexdigest()
    saved_path = os.path.join(PROFILE_DIR, f"{hashed}.jpg")
    photo = user_obj.get("profile_photo")
    if not photo:
        return {
            "full_name": full_name,
            "profile_image": f"https://channelsseller.site/api/prof_img/{hashed}"
        }
    local = download_profile(photo)
    if local and os.path.exists(local):
        os.makedirs(PROFILE_DIR, exist_ok=True)
        with open(local, "rb") as src, open(saved_path, "wb") as dst:
            dst.write(src.read())
    return {
        "full_name": full_name,
        "profile_image": f"https://channelsseller.site/api/prof_img/{hashed}"
    }

def search_public_chat(username):
    req_id = get_request_id()
    q = queue.Queue(maxsize=1)
    with pending_lock:
        pending_requests[req_id] = q
    send({"@type": "searchPublicChat", "username": username, "@extra": req_id})
    try:
        return q.get(timeout=10)
    except queue.Empty:
        return None

def get_user(user_id):
    req_id = get_request_id()
    q = queue.Queue(maxsize=1)
    with pending_lock:
        pending_requests[req_id] = q
    send({"@type": "getUser", "user_id": user_id, "@extra": req_id})
    try:
        return q.get(timeout=5)
    except queue.Empty:
        return None

def get_received_gifts(owner_id_obj):
    req_id = get_request_id()
    q = queue.Queue(maxsize=1)
    with pending_lock:
        pending_requests[req_id] = q
    send({
        "@type": "getReceivedGifts",
        "business_connection_id": "",
        "owner_id": owner_id_obj,
        "collection_id": 0,
        "exclude_unsaved": False,
        "exclude_saved": False,
        "exclude_unlimited": False,
        "exclude_upgradable": False,
        "exclude_non_upgradable": False,
        "exclude_upgraded": False,
        "sort_by_price": False,
        "offset": "",
        "limit": 100,
        "@extra": req_id
    })
    try:
        return q.get(timeout=10)
    except queue.Empty:
        return None

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_market_data()
    if not init_tdlib():
        raise RuntimeError("TDLib authentication failed")
    threading.Thread(target=receiver_loop, daemon=True).start()
    yield

app = FastAPI(lifespan=lifespan)

class GiftRequest(BaseModel):
    username: str

@app.post("/gifts")
async def get_gifts(req: GiftRequest):
    username = req.username.lstrip("@")
    loop = asyncio.get_event_loop()
    chat_data = await loop.run_in_executor(None, search_public_chat, username)
    if not chat_data:
        raise HTTPException(status_code=408, detail="Timeout searching for chat")
    if chat_data.get("@type") == "error":
        raise HTTPException(status_code=404, detail=chat_data.get("message", "Chat not found"))
    chat_type = chat_data.get("type", {})
    chat_type_name = chat_type.get("@type")
    if chat_type_name == "chatTypePrivate":
        user_id = chat_type.get("user_id")
        user_data = await loop.run_in_executor(None, get_user, user_id)
        if not user_data or user_data.get("@type") == "error":
            raise HTTPException(status_code=404, detail="User not found")
        profile_info = await loop.run_in_executor(None, process_profile, user_data)
        owner_id = {"@type": "messageSenderUser", "user_id": user_id}
        gifts_data = await loop.run_in_executor(None, get_received_gifts, owner_id)
        if not gifts_data:
            raise HTTPException(status_code=408, detail="Timeout getting gifts")
        if gifts_data.get("@type") == "error":
            raise HTTPException(status_code=400, detail=gifts_data.get("message", "Error getting gifts"))
        result = process_user_gifts(gifts_data)
        return {
            "username": username,
            "user_id": user_id,
            "profile_information": profile_info,
            **result
        }
    elif chat_type_name == "chatTypeSupergroup" and chat_type.get("is_channel"):
        chat_id = chat_data.get("id")
        owner_id = {"@type": "messageSenderChat", "chat_id": chat_id}
        gifts_data = await loop.run_in_executor(None, get_received_gifts, owner_id)
        if not gifts_data:
            raise HTTPException(status_code=408, detail="Timeout getting gifts")
        if gifts_data.get("@type") == "error":
            raise HTTPException(status_code=400, detail=gifts_data.get("message", "Error getting gifts"))
        result = process_channel_gifts(gifts_data)
        return {
            "username": username,
            "chat_id": chat_id,
            **result
        }
    else:
        raise HTTPException(status_code=400, detail="Unsupported chat type. Only users and channels are supported.")
@app.get("/api/prof_img/{hashed}")
async def serve_profile(hashed: str):
    """Serve profile image without authentication (public endpoint)"""
    path = os.path.join(PROFILE_DIR, f"{hashed}.jpg")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(path, media_type="image/jpeg", headers={"Cache-Control": "public, max-age=86400"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=2004)
