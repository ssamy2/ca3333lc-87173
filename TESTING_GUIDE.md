# Backend Testing Guide

## 🧪 Tests Available

### 1. Market Data Tests (`test_market_data.py`)
Tests the core market data functionality including:
- ✅ Synchronous fetch
- ✅ Asynchronous fetch
- ✅ Caching mechanism
- ✅ Concurrent access

**Run:**
```bash
python test_market_data.py
```

### 2. API Endpoint Tests (`test_endpoints.py`)
Tests the actual API endpoints:
- ✅ Server health check
- ✅ `/api/market-data` endpoint
- ✅ `/api/prof_img/{hashed}` endpoint (public access)

**Run:**
```bash
# Terminal 1: Start the server
python server.py

# Terminal 2: Run tests
python test_endpoints.py
```

---

## 🚀 Quick Start

### Prerequisites
```bash
pip install -r requirements.txt
pip install requests  # For endpoint tests
```

### Run All Tests

**Option 1: Test core functionality (no server needed)**
```bash
python test_market_data.py
```

**Option 2: Test API endpoints (requires running server)**
```bash
# Terminal 1
python server.py

# Terminal 2
python test_endpoints.py
```

---

## 🔧 Fixes Applied

### 1. Event Loop Error in `/api/market-data`
**Problem:** `"Cannot run the event loop while another loop is running"`

**Solution:**
- Changed from `asyncio.new_event_loop()` to `asyncio.run()`
- Added proper event loop detection
- Returns cached data when in async context

**File:** `core.py` - `get_market_data()` function

### 2. Public Access to `/api/prof_img/`
**Problem:** Endpoint required authentication

**Solution:**
- Removed authentication requirement
- Added cache headers for browser caching
- Made endpoint fully public

**File:** `api.py` - `/api/prof_img/{hashed}` endpoint

---

## 📊 Expected Test Results

### Market Data Tests
```
TEST 1: Synchronous Market Data Fetch
✅ SUCCESS: Fetched 150+ items

TEST 2: Asynchronous Market Data Fetch
✅ SUCCESS: Fetched 150+ items

TEST 3: Market Data Caching
✅ Cache working correctly (same data returned)

TEST 4: Concurrent Access to Market Data
✅ 3/3 requests successful
```

### Endpoint Tests
```
TEST: Server Health Check
✅ Server is running and responding

TEST: /api/market-data Endpoint
✅ SUCCESS: Fetched 150+ items

TEST: /api/prof_img/{hashed} Endpoint
✅ SUCCESS: Endpoint accessible (404 for missing image is expected)
```

---

## 🐛 Troubleshooting

### "Cannot connect to http://localhost:8000"
- Make sure the server is running: `python server.py`
- Check if port 8000 is available
- Try `netstat -ano | findstr :8000` to see what's using the port

### "Market data not available"
- The cache might be empty on first run
- Wait a few seconds and try again
- Check server logs for errors

### "Image not found" (404)
- This is expected for test hashes
- The endpoint is working correctly
- Upload a real image to test with actual data

---

## 📝 Test Output Examples

### Successful Market Data Fetch
```
TEST 1: Synchronous Market Data Fetch
============================================================
Fetching market data from http://localhost:8000...
✅ SUCCESS: Fetched 156 items

  1. Flamingo
     Price TON: 0.25
     Price USD: 0.53
     Market Cap: 2.50M

  2. Gem
     Price TON: 0.15
     Price USD: 0.32
     Market Cap: 1.50M
```

### Successful Endpoint Test
```
TEST: /api/market-data Endpoint
============================================================
GET http://localhost:8000/api/market-data
Status: 200
✅ SUCCESS: Fetched 156 items

  1. Flamingo
     Price TON: 0.25
     Price USD: 0.53
```

---

## 🔍 Debugging

### Enable Detailed Logging
Edit `core.py` and change:
```python
logging.basicConfig(level=logging.INFO)  # Change to DEBUG
```

### Check Cache Status
Add this to your test:
```python
from core import market_cache_data, market_cache_time
print(f"Cache size: {len(market_cache_data)} items")
print(f"Cache age: {time.time() - market_cache_time} seconds")
```

### Monitor API Calls
Run server with verbose output:
```bash
python server.py --log-level debug
```

---

## ✅ Verification Checklist

- [ ] `test_market_data.py` passes all 4 tests
- [ ] `test_endpoints.py` passes all 3 tests
- [ ] `/api/market-data` returns valid JSON with 100+ items
- [ ] `/api/prof_img/{hashed}` returns 404 (no auth required)
- [ ] No "event loop" errors in logs
- [ ] Cache is working (second fetch is faster)

---

## 📚 Related Files

- `core.py` - Market data fetching logic
- `server.py` - FastAPI server and endpoints
- `api.py` - Profile image endpoint
- `requirements.txt` - Python dependencies

---

**Last Updated:** 28 Nov 2025
**Status:** ✅ All fixes applied and tested
