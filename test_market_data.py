#!/usr/bin/env python3
"""
Test script for market data functionality
"""

import asyncio
import sys
import json
from core import get_market_data, get_market_data_async

def test_market_data_sync():
    """Test synchronous market data fetch"""
    print("\n" + "="*60)
    print("TEST 1: Synchronous Market Data Fetch")
    print("="*60)
    
    try:
        base_url = "http://localhost:8000"
        print(f"Fetching market data from {base_url}...")
        
        data = get_market_data(base_url)
        
        if data and "error" not in data:
            print(f"✅ SUCCESS: Fetched {len(data)} items")
            # Show first 3 items
            for i, (name, item) in enumerate(list(data.items())[:3]):
                print(f"\n  {i+1}. {name}")
                print(f"     Price TON: {item.get('priceTon', 'N/A')}")
                print(f"     Price USD: {item.get('priceUsd', 'N/A')}")
                print(f"     Market Cap: {item.get('market_cap_ton', 'N/A')}")
        else:
            print(f"❌ FAILED: {data}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


async def test_market_data_async():
    """Test asynchronous market data fetch"""
    print("\n" + "="*60)
    print("TEST 2: Asynchronous Market Data Fetch")
    print("="*60)
    
    try:
        base_url = "http://localhost:8000"
        print(f"Fetching market data asynchronously from {base_url}...")
        
        data = await get_market_data_async(base_url)
        
        if data and "error" not in data:
            print(f"✅ SUCCESS: Fetched {len(data)} items")
            # Show first 3 items
            for i, (name, item) in enumerate(list(data.items())[:3]):
                print(f"\n  {i+1}. {name}")
                print(f"     Price TON: {item.get('priceTon', 'N/A')}")
                print(f"     Price USD: {item.get('priceUsd', 'N/A')}")
                print(f"     Market Cap: {item.get('market_cap_ton', 'N/A')}")
        else:
            print(f"❌ FAILED: {data}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


def test_market_data_caching():
    """Test market data caching"""
    print("\n" + "="*60)
    print("TEST 3: Market Data Caching")
    print("="*60)
    
    try:
        base_url = "http://localhost:8000"
        
        print("First fetch (should fetch from API)...")
        data1 = get_market_data(base_url)
        if not data1 or "error" in data1:
            print(f"❌ First fetch failed: {data1}")
            return False
        print(f"✅ First fetch: {len(data1)} items")
        
        print("\nSecond fetch (should use cache)...")
        data2 = get_market_data(base_url)
        if not data2 or "error" in data2:
            print(f"❌ Second fetch failed: {data2}")
            return False
        print(f"✅ Second fetch: {len(data2)} items")
        
        if data1 == data2:
            print("✅ Cache working correctly (same data returned)")
        else:
            print("⚠️  Data differs between fetches (cache might not be working)")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


async def test_concurrent_access():
    """Test concurrent access to market data"""
    print("\n" + "="*60)
    print("TEST 4: Concurrent Access to Market Data")
    print("="*60)
    
    try:
        base_url = "http://localhost:8000"
        
        print("Making 3 concurrent requests...")
        tasks = [get_market_data_async(base_url) for _ in range(3)]
        results = await asyncio.gather(*tasks)
        
        success_count = sum(1 for r in results if r and "error" not in r)
        print(f"✅ {success_count}/3 requests successful")
        
        if success_count == 3:
            print("✅ All concurrent requests succeeded")
            return True
        else:
            print(f"❌ Some requests failed")
            for i, r in enumerate(results):
                if "error" in r:
                    print(f"   Request {i+1}: {r.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "🧪 MARKET DATA TESTS 🧪".center(60, "="))
    
    results = []
    
    # Test 1: Sync fetch
    results.append(("Sync Fetch", test_market_data_sync()))
    
    # Test 2: Async fetch
    results.append(("Async Fetch", asyncio.run(test_market_data_async())))
    
    # Test 3: Caching
    results.append(("Caching", test_market_data_caching()))
    
    # Test 4: Concurrent access
    results.append(("Concurrent Access", asyncio.run(test_concurrent_access())))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:.<40} {status}")
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
