import sqlite3
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from contextlib import contextmanager
import threading

DB_PATH = 'user_preferences.db'
_local = threading.local()

LANGUAGE_COUNTRY_MAP = {
    'ar': 'Iraq',
    'en': 'USA',
    'ru': 'Russia',
    'zh': 'China'
}

@contextmanager
def get_db():
    try:
        if not hasattr(_local, 'conn'):
            _local.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
            _local.conn.row_factory = sqlite3.Row
        yield _local.conn
    except Exception:
        if hasattr(_local, 'conn'):
            _local.conn.rollback()
        raise
    else:
        if hasattr(_local, 'conn'):
            _local.conn.commit()

def init_preferences_db():
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            cursor.execute("PRAGMA journal_mode=WAL;")
            cursor.execute("PRAGMA synchronous=NORMAL;")
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_preferences (
                    user_id INTEGER PRIMARY KEY,
                    username TEXT,
                    language TEXT DEFAULT 'en',
                    country TEXT DEFAULT 'USA',
                    theme TEXT DEFAULT 'dark',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_premium BOOLEAN DEFAULT 0,
                    settings TEXT DEFAULT '{}'
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS gift_statistics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    gift_count INTEGER DEFAULT 0,
                    channel_gift_count INTEGER DEFAULT 0,
                    total_checked INTEGER DEFAULT 0,
                    last_check TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES user_preferences(user_id)
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS global_statistics (
                    id INTEGER PRIMARY KEY DEFAULT 1,
                    total_users INTEGER DEFAULT 0,
                    total_gifts_checked INTEGER DEFAULT 0,
                    total_channel_gifts INTEGER DEFAULT 0,
                    total_user_gifts INTEGER DEFAULT 0,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS country_statistics (
                    country TEXT PRIMARY KEY,
                    user_count INTEGER DEFAULT 0,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_user_language 
                ON user_preferences(language)
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_user_country 
                ON user_preferences(country)
            """)
            
            cursor.execute("""
                INSERT OR IGNORE INTO global_statistics (id) VALUES (1)
            """)
            
            for country in LANGUAGE_COUNTRY_MAP.values():
                cursor.execute("""
                    INSERT OR IGNORE INTO country_statistics (country, user_count) 
                    VALUES (?, 0)
                """, (country,))
            
            conn.commit()
            return True
    except Exception as e:
        print(f"Error initializing preferences DB: {e}")
        return False

def get_or_create_user_preferences(user_id: int, username: Optional[str] = None, language: Optional[str] = None) -> Dict[str, Any]:
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM user_preferences WHERE user_id = ?
            """, (user_id,))
            
            user = cursor.fetchone()
            
            if not user:
                lang = language or 'en'
                country = LANGUAGE_COUNTRY_MAP.get(lang, 'USA')
                
                cursor.execute("""
                    INSERT INTO user_preferences (user_id, username, language, country)
                    VALUES (?, ?, ?, ?)
                """, (user_id, username, lang, country))
                
                cursor.execute("""
                    UPDATE global_statistics 
                    SET total_users = total_users + 1,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE id = 1
                """)
                
                cursor.execute("""
                    UPDATE country_statistics 
                    SET user_count = user_count + 1,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE country = ?
                """, (country,))
                
                cursor.execute("""
                    INSERT INTO gift_statistics (user_id)
                    VALUES (?)
                """, (user_id,))
                
                cursor.execute("""
                    SELECT * FROM user_preferences WHERE user_id = ?
                """, (user_id,))
                
                user = cursor.fetchone()
            
            return dict(user)
    except Exception as e:
        print(f"Error getting user preferences: {e}")
        return {
            'user_id': user_id,
            'language': 'en',
            'country': 'USA',
            'theme': 'dark'
        }

def update_user_language(user_id: int, language: str) -> bool:
    try:
        if language not in LANGUAGE_COUNTRY_MAP:
            return False
        
        with get_db() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT language, country FROM user_preferences WHERE user_id = ?
            """, (user_id,))
            
            result = cursor.fetchone()
            if result:
                old_lang = result['language']
                old_country = result['country']
                new_country = LANGUAGE_COUNTRY_MAP[language]
                
                if old_country != new_country:
                    cursor.execute("""
                        UPDATE country_statistics 
                        SET user_count = user_count - 1
                        WHERE country = ? AND user_count > 0
                    """, (old_country,))
                    
                    cursor.execute("""
                        UPDATE country_statistics 
                        SET user_count = user_count + 1
                        WHERE country = ?
                    """, (new_country,))
                
                cursor.execute("""
                    UPDATE user_preferences 
                    SET language = ?, country = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ?
                """, (language, new_country, user_id))
                
                return True
            
            return False
    except Exception as e:
        print(f"Error updating language: {e}")
        return False

def update_user_theme(user_id: int, theme: str) -> bool:
    try:
        if theme not in ['light', 'dark', 'system']:
            return False
        
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE user_preferences 
                SET theme = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            """, (theme, user_id))
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Error updating theme: {e}")
        return False

def increment_gift_check(user_id: int, is_channel: bool = False, gift_count: int = 0) -> bool:
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            if is_channel:
                cursor.execute("""
                    UPDATE gift_statistics 
                    SET channel_gift_count = channel_gift_count + ?,
                        total_checked = total_checked + 1,
                        last_check = CURRENT_TIMESTAMP
                    WHERE user_id = ?
                """, (gift_count, user_id))
                
                cursor.execute("""
                    UPDATE global_statistics 
                    SET total_channel_gifts = total_channel_gifts + ?,
                        total_gifts_checked = total_gifts_checked + ?,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE id = 1
                """, (gift_count, gift_count))
            else:
                cursor.execute("""
                    UPDATE gift_statistics 
                    SET gift_count = gift_count + ?,
                        total_checked = total_checked + 1,
                        last_check = CURRENT_TIMESTAMP
                    WHERE user_id = ?
                """, (gift_count, user_id))
                
                cursor.execute("""
                    UPDATE global_statistics 
                    SET total_user_gifts = total_user_gifts + ?,
                        total_gifts_checked = total_gifts_checked + ?,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE id = 1
                """, (gift_count, gift_count))
            
            return True
    except Exception as e:
        print(f"Error incrementing gift check: {e}")
        return False

def get_global_statistics() -> Dict[str, Any]:
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM global_statistics WHERE id = 1
            """)
            global_stats = cursor.fetchone()
            
            cursor.execute("""
                SELECT country, user_count 
                FROM country_statistics 
                ORDER BY user_count DESC
            """)
            countries = cursor.fetchall()
            
            cursor.execute("""
                SELECT COUNT(*) as active_today
                FROM user_preferences
                WHERE DATE(last_active) = DATE('now')
            """)
            active_today = cursor.fetchone()['active_today']
            
            return {
                'total_users': global_stats['total_users'] if global_stats else 0,
                'total_gifts_checked': global_stats['total_gifts_checked'] if global_stats else 0,
                'total_channel_gifts': global_stats['total_channel_gifts'] if global_stats else 0,
                'total_user_gifts': global_stats['total_user_gifts'] if global_stats else 0,
                'active_today': active_today,
                'countries': [dict(c) for c in countries],
                'top_country': countries[0]['country'] if countries else 'USA'
            }
    except Exception as e:
        print(f"Error getting global statistics: {e}")
        return {
            'total_users': 0,
            'total_gifts_checked': 0,
            'total_channel_gifts': 0,
            'total_user_gifts': 0,
            'active_today': 0,
            'countries': [],
            'top_country': 'USA'
        }

def get_user_statistics(user_id: int) -> Dict[str, Any]:
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM gift_statistics WHERE user_id = ?
            """, (user_id,))
            
            stats = cursor.fetchone()
            
            if stats:
                return dict(stats)
            
            return {
                'gift_count': 0,
                'channel_gift_count': 0,
                'total_checked': 0
            }
    except Exception as e:
        print(f"Error getting user statistics: {e}")
        return {
            'gift_count': 0,
            'channel_gift_count': 0,
            'total_checked': 0
        }

def update_user_activity(user_id: int) -> bool:
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE user_preferences 
                SET last_active = CURRENT_TIMESTAMP
                WHERE user_id = ?
            """, (user_id,))
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Error updating user activity: {e}")
        return False

init_preferences_db()
