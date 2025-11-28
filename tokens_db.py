#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Token Database Management System
قاعدة بيانات منفصلة لإدارة التوكنات والطلبات
"""

import sqlite3
import time
import hashlib
import os
from contextlib import contextmanager
from threading import Lock

# إعدادات قاعدة البيانات
TOKENS_DB_PATH = 'user_tokens.db'
DEFAULT_MAX_REQUESTS = 40
TOKEN_TTL = 3600  # ساعة واحدة

# كاش الـ RAM للسرعة
_tokens_cache = {}  # {token: {user_id, request_count, max_requests, expires_at, is_subscribed}}
_user_tokens_cache = {}  # {user_id: token}
_cache_lock = Lock()  # للحماية من race conditions

@contextmanager
def get_tokens_db():
    """الحصول على اتصال بقاعدة بيانات التوكنات"""
    conn = sqlite3.connect(TOKENS_DB_PATH, check_same_thread=False, timeout=10)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_tokens_database():
    """إنشاء قاعدة بيانات التوكنات"""
    with get_tokens_db() as conn:
        cursor = conn.cursor()
        
        # تفعيل WAL mode للأداء الأفضل
        cursor.execute("PRAGMA journal_mode=WAL;")
        
        # إنشاء جدول التوكنات
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_tokens(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT UNIQUE NOT NULL,
                request_count INTEGER DEFAULT 0,
                max_requests INTEGER DEFAULT 40,
                is_subscribed BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at REAL NOT NULL,
                is_active BOOLEAN DEFAULT 1
            )
        """)
        
        # إنشاء فهارس للبحث السريع
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_tokens_token ON user_tokens(token)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_tokens_active ON user_tokens(is_active)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_tokens_expires ON user_tokens(expires_at)")
        
        conn.commit()
        print(f"Tokens database initialized: {TOKENS_DB_PATH}")
        
        # تحميل التوكنات النشطة إلى الكاش
        _load_active_tokens_to_cache()

def _load_active_tokens_to_cache():
    """تحميل التوكنات النشطة من قاعدة البيانات إلى الكاش"""
    with get_tokens_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT token, user_id, request_count, max_requests, is_subscribed, expires_at
            FROM user_tokens 
            WHERE is_active = 1 AND expires_at > ?
        """, (time.time(),))
        
        with _cache_lock:
            _tokens_cache.clear()
            _user_tokens_cache.clear()
            
            for row in cursor.fetchall():
                token, user_id, request_count, max_requests, is_subscribed, expires_at = row
                
                _tokens_cache[token] = {
                    'user_id': user_id,
                    'request_count': request_count,
                    'max_requests': max_requests,
                    'is_subscribed': bool(is_subscribed),
                    'expires_at': expires_at
                }
                _user_tokens_cache[user_id] = token
        
        print(f"Loaded {len(_tokens_cache)} active tokens to RAM cache")

def _add_token_to_cache(token, user_id, request_count, max_requests, is_subscribed, expires_at):
    """إضافة توكن إلى الكاش"""
    with _cache_lock:
        # إزالة التوكن القديم للمستخدم إن وجد
        if user_id in _user_tokens_cache:
            old_token = _user_tokens_cache[user_id]
            _tokens_cache.pop(old_token, None)
        
        # إضافة التوكن الجديد
        _tokens_cache[token] = {
            'user_id': user_id,
            'request_count': request_count,
            'max_requests': max_requests,
            'is_subscribed': is_subscribed,
            'expires_at': expires_at
        }
        _user_tokens_cache[user_id] = token

def _get_token_from_cache(token):
    """الحصول على توكن من الكاش"""
    with _cache_lock:
        return _tokens_cache.get(token)

def _update_token_count_in_cache(token, new_count):
    """تحديث عداد الطلبات في الكاش"""
    with _cache_lock:
        if token in _tokens_cache:
            _tokens_cache[token]['request_count'] = new_count
            return True
        return False

def _remove_expired_from_cache():
    """إزالة التوكنات المنتهية الصلاحية من الكاش"""
    now = time.time()
    expired_tokens = []
    
    with _cache_lock:
        for token, data in _tokens_cache.items():
            if data['expires_at'] <= now:
                expired_tokens.append(token)
        
        for token in expired_tokens:
            token_data = _tokens_cache.pop(token, None)
            if token_data:
                user_id = token_data['user_id']
                if _user_tokens_cache.get(user_id) == token:
                    _user_tokens_cache.pop(user_id, None)
    
    return len(expired_tokens)

def create_user_token(user_id, max_requests=DEFAULT_MAX_REQUESTS, is_subscribed=False):
    """إنشاء توكن جديد للمستخدم وإلغاء التوكنات القديمة"""
    # توليد توكن جديد
    token_data = f"{user_id}_{time.time()}_{os.urandom(16).hex()}"
    token = hashlib.sha256(token_data.encode()).hexdigest()
    expires_at = time.time() + TOKEN_TTL
    
    with get_tokens_db() as conn:
        cursor = conn.cursor()
        
        try:
            # إلغاء جميع التوكنات النشطة للمستخدم
            cursor.execute(
                "UPDATE user_tokens SET is_active = 0 WHERE user_id = ? AND is_active = 1",
                (user_id,)
            )
            
            # إدراج التوكن الجديد مع حالة الاشتراك
            cursor.execute("""
                INSERT INTO user_tokens (user_id, token, request_count, max_requests, is_subscribed, expires_at) 
                VALUES (?, ?, 0, ?, ?, ?)
            """, (user_id, token, max_requests, is_subscribed, expires_at))
            
            conn.commit()
            
            # إضافة التوكن إلى الكاش
            _add_token_to_cache(token, user_id, 0, max_requests, is_subscribed, expires_at)
            
            print(f"[TOKEN_DB] Created new token for user {user_id} with {max_requests} requests (subscribed: {is_subscribed})")
            return token
            
        except Exception as e:
            print(f"[TOKEN_DB] Error creating token: {e}")
            conn.rollback()
            raise

def verify_token_and_increment(token):
    """التحقق من التوكن وزيادة عداد الطلبات (RAM أولاً للسرعة)"""
    # تنظيف التوكنات المنتهية الصلاحية من الكاش
    _remove_expired_from_cache()
    
    # البحث في الكاش أولاً (سريع جداً!)
    token_data = _get_token_from_cache(token)
    
    if not token_data:
        return None, None, "Invalid or inactive token"
    
    user_id = token_data['user_id']
    request_count = token_data['request_count']
    max_requests = token_data['max_requests']
    expires_at = token_data['expires_at']
    is_subscribed = token_data['is_subscribed']
    
    # التحقق من انتهاء صلاحية التوكن
    if time.time() > expires_at:
        # إزالة من الكاش وقاعدة البيانات
        with _cache_lock:
            _tokens_cache.pop(token, None)
            if _user_tokens_cache.get(user_id) == token:
                _user_tokens_cache.pop(user_id, None)
        
        # تحديث قاعدة البيانات في الخلفية
        try:
            with get_tokens_db() as conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE user_tokens SET is_active = 0 WHERE token = ?", (token,))
                conn.commit()
        except:
            pass  # لا نريد أن نوقف العملية بسبب خطأ في قاعدة البيانات
        
        return None, None, "Token expired"
    
    # التحقق من حد الطلبات
    if request_count >= max_requests:
        return None, None, f"Request limit exceeded ({request_count}/{max_requests})"
    
    # زيادة عداد الطلبات في الكاش (سريع جداً!)
    new_count = request_count + 1
    _update_token_count_in_cache(token, new_count)
    
    # تحديث قاعدة البيانات في الخلفية (للاستقرار)
    try:
        with get_tokens_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE user_tokens SET request_count = ? WHERE token = ?",
                (new_count, token)
            )
            conn.commit()
    except Exception as e:
        print(f"[TOKEN_DB] Warning: Database update failed: {e}")
        # نستمر في العمل حتى لو فشل تحديث قاعدة البيانات
    
    print(f"[TOKEN_CACHE] User {user_id} authenticated, requests: {new_count}/{max_requests} (subscribed: {is_subscribed})")
    return user_id, is_subscribed, None

def get_user_token_info(user_id):
    """الحصول على معلومات التوكن النشط للمستخدم (من الكاش للسرعة)"""
    # تنظيف التوكنات المنتهية الصلاحية من الكاش
    _remove_expired_from_cache()
    
    # البحث في الكاش أولاً (سريع جداً!)
    with _cache_lock:
        token = _user_tokens_cache.get(user_id)
        if token and token in _tokens_cache:
            token_data = _tokens_cache[token]
            return {
                'token': token,
                'request_count': token_data['request_count'],
                'max_requests': token_data['max_requests'],
                'expires_at': token_data['expires_at'],
                'is_subscribed': token_data['is_subscribed'],
                'requests_remaining': token_data['max_requests'] - token_data['request_count']
            }
    
    # إذا لم يوجد في الكاش، البحث في قاعدة البيانات (احتياطي)
    try:
        with get_tokens_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT token, request_count, max_requests, expires_at, is_subscribed
                FROM user_tokens 
                WHERE user_id = ? AND is_active = 1 AND expires_at > ?
                ORDER BY created_at DESC LIMIT 1
            """, (user_id, time.time()))
            
            row = cursor.fetchone()
            if row:
                token, request_count, max_requests, expires_at, is_subscribed = row
                
                # إضافة إلى الكاش للمرات القادمة
                _add_token_to_cache(token, user_id, request_count, max_requests, bool(is_subscribed), expires_at)
                
                return {
                    'token': token,
                    'request_count': request_count,
                    'max_requests': max_requests,
                    'expires_at': expires_at,
                    'is_subscribed': bool(is_subscribed),
                    'requests_remaining': max_requests - request_count
                }
    except Exception as e:
        print(f"[TOKEN_DB] Warning: Database lookup failed: {e}")
    
    return None

def cleanup_expired_tokens():
    """تنظيف التوكنات المنتهية الصلاحية"""
    with get_tokens_db() as conn:
        cursor = conn.cursor()
        
        # إلغاء التوكنات المنتهية الصلاحية
        cursor.execute(
            "UPDATE user_tokens SET is_active = 0 WHERE expires_at < ? AND is_active = 1",
            (time.time(),)
        )
        
        # حذف التوكنات القديمة (أكثر من 7 أيام)
        week_ago = time.time() - (7 * 24 * 3600)
        cursor.execute(
            "DELETE FROM user_tokens WHERE expires_at < ? AND is_active = 0",
            (week_ago,)
        )
        
        conn.commit()
        print(f"[TOKEN_DB] Cleaned up expired tokens")

def get_database_stats():
    """إحصائيات قاعدة البيانات والكاش"""
    # إحصائيات الكاش
    with _cache_lock:
        cache_tokens = len(_tokens_cache)
        cache_users = len(_user_tokens_cache)
    
    # إحصائيات قاعدة البيانات
    try:
        with get_tokens_db() as conn:
            cursor = conn.cursor()
            
            # عدد التوكنات النشطة
            cursor.execute("SELECT COUNT(*) FROM user_tokens WHERE is_active = 1")
            active_tokens = cursor.fetchone()[0]
            
            # عدد المستخدمين النشطين
            cursor.execute("SELECT COUNT(DISTINCT user_id) FROM user_tokens WHERE is_active = 1")
            active_users = cursor.fetchone()[0]
            
            # عدد التوكنات المنتهية الصلاحية
            cursor.execute("SELECT COUNT(*) FROM user_tokens WHERE expires_at < ?", (time.time(),))
            expired_tokens = cursor.fetchone()[0]
            
            return {
                'cache_tokens': cache_tokens,
                'cache_users': cache_users,
                'db_active_tokens': active_tokens,
                'db_active_users': active_users,
                'db_expired_tokens': expired_tokens,
                'cache_hit_ratio': f"{(cache_tokens/max(active_tokens, 1)*100):.1f}%"
            }
    except Exception as e:
        return {
            'cache_tokens': cache_tokens,
            'cache_users': cache_users,
            'db_error': str(e)
        }

def get_cache_info():
    """معلومات مفصلة عن الكاش"""
    with _cache_lock:
        now = time.time()
        active_count = 0
        expired_count = 0
        
        for token_data in _tokens_cache.values():
            if token_data['expires_at'] > now:
                active_count += 1
            else:
                expired_count += 1
        
        return {
            'total_cached_tokens': len(_tokens_cache),
            'active_cached_tokens': active_count,
            'expired_cached_tokens': expired_count,
            'cached_users': len(_user_tokens_cache)
        }

# تهيئة قاعدة البيانات عند استيراد الملف
if __name__ == "__main__":
    init_tokens_database()
    print("Token database initialized successfully!")
else:
    # تهيئة تلقائية عند الاستيراد
    try:
        init_tokens_database()
    except Exception as e:
        print(f"Warning: Could not initialize tokens database: {e}")
