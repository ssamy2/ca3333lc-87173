#!/usr/bin/env python3
"""
🔥 Cache Warmer Script
يطلب APIs كل دقيقة للحفاظ على الكاش ساخن
"""

import requests
import time
import logging
from datetime import datetime
import threading
import json
import signal
import sys

# إعداد الـ logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - CacheWarmer - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CacheWarmer:
    def __init__(self, base_url="http://localhost:5002", local_password="nova_local_2024"):
        self.base_url = base_url
        self.local_password = local_password
        self.session = requests.Session()
        self.session.headers.update({
            'X-Local-Password': local_password,
            'User-Agent': 'CacheWarmer/1.0'
        })
        self.running = True
        self.stats = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'start_time': datetime.now()
        }
        # كاش محلي للمستخدمين (5 دقائق)
        self.user_cache = {}
        self.user_cache_time = {}
        self.USER_CACHE_TTL = 300  # 5 دقائق
    
    def warm_endpoint(self, endpoint, name):
        """طلب endpoint واحد"""
        try:
            url = f"{self.base_url}{endpoint}"
            start_time = time.time()
            
            response = self.session.get(url, timeout=30)
            duration = time.time() - start_time
            
            self.stats['total_requests'] += 1
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    data_size = len(str(data))
                    logger.info(f"✅ {name}: {response.status_code} - {data_size} chars - {duration:.2f}s")
                    self.stats['successful_requests'] += 1
                except:
                    logger.info(f"✅ {name}: {response.status_code} - Non-JSON - {duration:.2f}s")
                    self.stats['successful_requests'] += 1
            else:
                logger.warning(f"❌ {name}: {response.status_code} - {duration:.2f}s")
                self.stats['failed_requests'] += 1
                
        except Exception as e:
            logger.error(f"{name}: Error - {e}")
            self.stats['failed_requests'] += 1
    
    def get_popular_gifts(self):
        """جلب قائمة الهدايا الشائعة"""
        try:
            url = f"{self.base_url}/api/market-data"
            response = self.session.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'data' in data:
                    gifts = data['data'].get('gifts', [])
                    # أخذ أول 10 هدايا
                    gift_names = [g['name'] for g in gifts[:10] if 'name' in g]
                    logger.info(f"Found {len(gift_names)} popular gifts to warm")
                    return gift_names
                else:
                    logger.warning(f"Market data response missing 'success' or 'data' field")
            else:
                logger.warning(f"Failed to get market data: {response.status_code}")
        except Exception as e:
            logger.error(f"Failed to get popular gifts: {e}")
        return []
    
    def warm_cache_cycle(self):
        """دورة واحدة لتسخين الكاش"""
        logger.info("Starting cache warming cycle...")
        
        # قائمة الـ endpoints المهمة (مرتبة حسب الأولوية)
        endpoints = [
            ("/health", "Health Check"),
            ("/api/market-data", "Market Data"),
            ("/api/black/summary", "Black Summary"),
            ("/api/market-cap-changes", "Market Cap Changes"),
            ("/api/statistics/global", "Global Statistics"),
        ]
        
        # طلب كل endpoint
        for endpoint, name in endpoints:
            if not self.running:  # التحقق من الإيقاف
                break
            self.warm_endpoint(endpoint, name)
            time.sleep(0.3)  # توقف قصير بين الطلبات
        
        # جلب تفاصيل الهدايا الشائعة
        logger.info("Warming individual gift data...")
        popular_gifts = self.get_popular_gifts()
        for gift_name in popular_gifts:
            if not self.running:
                break
            self.warm_endpoint(f"/api/gift/{gift_name}/data", f"Gift: {gift_name}")
            time.sleep(0.5)  # توقف أطول قليلاً للهدايا
        
        # طباعة الإحصائيات
        uptime = datetime.now() - self.stats['start_time']
        success_rate = (self.stats['successful_requests'] / max(self.stats['total_requests'], 1)) * 100
        
        logger.info(f"📊 Stats: {self.stats['successful_requests']}/{self.stats['total_requests']} "
                   f"({success_rate:.1f}%) - Uptime: {str(uptime).split('.')[0]}")
        
        if self.stats['failed_requests'] > 0:
            logger.warning(f"⚠️  Failed requests: {self.stats['failed_requests']}")
    
    def run_forever(self, interval=300):
        """تشغيل مستمر كل interval ثانية"""
        logger.info(f"Cache Warmer started - Interval: {interval}s (5 minutes)")
        logger.info(f"Target: {self.base_url}")
        logger.info(f"Local Password: {'***' + self.local_password[-4:]}")
        
        try:
            while self.running:
                self.warm_cache_cycle()
                
                # انتظار للدورة التالية
                logger.info(f"Waiting {interval}s for next cycle...")
                time.sleep(interval)
                
        except KeyboardInterrupt:
            logger.info("🛑 Cache Warmer stopped by user")
        except Exception as e:
            logger.error(f"💥 Cache Warmer crashed: {e}")
        finally:
            self.running = False
    
    def stop(self):
        """إيقاف الـ warmer"""
        self.running = False
        logger.info("Cache Warmer stopping...")

def main():
    """الدالة الرئيسية"""
    print("Nova Calculator Cache Warmer")
    print("=" * 50)
    
    # إنشاء الـ warmer
    warmer = CacheWarmer()
    
    # إعداد معالج الإشارات للإيقاف الأنيق
    def signal_handler(signum, frame):
        logger.info(f"📡 Received signal {signum}, shutting down gracefully...")
        warmer.stop()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # اختبار الاتصال أولاً
        logger.info("🔍 Testing connection...")
        warmer.warm_endpoint("/health", "Health Check")
        
        if warmer.stats['successful_requests'] > 0:
            logger.info("✅ Connection successful, starting cache warming...")
            logger.info("💡 Press Ctrl+C to stop gracefully")
            warmer.run_forever(interval=300)  # كل 5 دقائق
        else:
            logger.error("❌ Cannot connect to server, check if it's running on port 5002")
            logger.error("💡 Make sure server.py is running with the correct port")
            return 1
            
    except Exception as e:
        logger.error(f"💥 Failed to start: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    main()
