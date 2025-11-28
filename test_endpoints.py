#!/usr/bin/env python3
"""
Test script for API endpoints
"""

import requests
import json
import sys
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def test_market_data_endpoint() -> bool:
    """Test /api/market-data endpoint"""
    print("\n" + "="*60)
    print("TEST: /api/market-data Endpoint")
    print("="*60)
    
    try:
        url = f"{BASE_URL}/api/market-data"
        print(f"GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if isinstance(data, dict):
                if "error" in data:
                    print(f"❌ FAILED: {data['error']}")
                    return False
                else:
                    item_count = len(data)
                    print(f"✅ SUCCESS: Fetched {item_count} items")
                    
                    # Show first 2 items
                    for i, (name, item) in enumerate(list(data.items())[:2]):
                        print(f"\n  {i+1}. {name}")
                        if isinstance(item, dict):
                            print(f"     Price TON: {item.get('priceTon', 'N/A')}")
                            print(f"     Price USD: {item.get('priceUsd', 'N/A')}")
                    
                    return True
            else:
                print(f"❌ FAILED: Unexpected response type: {type(data)}")
                return False
        else:
            print(f"❌ FAILED: Status {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT: Request took too long")
        return False
    except requests.exceptions.ConnectionError:
        print(f"❌ CONNECTION ERROR: Cannot connect to {BASE_URL}")
        print("Make sure the server is running: python server.py")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_prof_img_endpoint() -> bool:
    """Test /api/prof_img/{hashed} endpoint"""
    print("\n" + "="*60)
    print("TEST: /api/prof_img/{hashed} Endpoint")
    print("="*60)
    
    try:
        # Use a test hash
        test_hash = "test_image_hash"
        url = f"{BASE_URL}/api/prof_img/{test_hash}"
        print(f"GET {url}")
        
        response = requests.get(url, timeout=5)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 404:
            print("✅ SUCCESS: Endpoint accessible (404 for missing image is expected)")
            return True
        elif response.status_code == 200:
            print("✅ SUCCESS: Image served successfully")
            print(f"Content-Type: {response.headers.get('Content-Type', 'N/A')}")
            print(f"Content-Length: {len(response.content)} bytes")
            return True
        else:
            print(f"❌ FAILED: Unexpected status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ CONNECTION ERROR: Cannot connect to {BASE_URL}")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


def test_server_health() -> bool:
    """Test if server is running"""
    print("\n" + "="*60)
    print("TEST: Server Health Check")
    print("="*60)
    
    try:
        print(f"Checking {BASE_URL}...")
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        
        if response.status_code == 200:
            print("✅ Server is running and responding")
            return True
        else:
            print(f"⚠️  Server responded with status {response.status_code}")
            return True  # Server is running, just different response
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to {BASE_URL}")
        print("\nTo start the server, run:")
        print("  cd Calc-Backend")
        print("  python server.py")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


def main():
    """Run all endpoint tests"""
    print("\n" + "🌐 API ENDPOINT TESTS 🌐".center(60, "="))
    
    # Check server health first
    if not test_server_health():
        print("\n❌ Server is not running. Cannot proceed with tests.")
        return 1
    
    results = []
    
    # Test endpoints
    results.append(("Market Data", test_market_data_endpoint()))
    results.append(("Profile Image", test_prof_img_endpoint()))
    
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
