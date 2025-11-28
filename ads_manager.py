#!/usr/bin/env python3
"""
📢 نظام إدارة الإعلانات
"""

import sqlite3
import json
import time
import os
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)

# إنشاء قاعدة البيانات
def init_ads_db():
    """إنشاء جداول قاعدة البيانات"""
    conn = sqlite3.connect('ads_database.db')
    c = conn.cursor()
    
    # جدول الإعلانات
    c.execute('''
        CREATE TABLE IF NOT EXISTS ads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            image_path TEXT NOT NULL,
            target_url TEXT NOT NULL,
            click_count INTEGER DEFAULT 0,
            view_count INTEGER DEFAULT 0,
            max_clicks INTEGER DEFAULT NULL,  -- الحد الأقصى للنقرات
            max_views INTEGER DEFAULT NULL,   -- الحد الأقصى للمشاهدات
            expiry_date TIMESTAMP DEFAULT NULL,  -- تاريخ الانتهاء
            status TEXT DEFAULT 'active',  -- active, completed, paused
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER NOT NULL,
            priority INTEGER DEFAULT 0,  -- الأولوية في العرض
            width INTEGER NOT NULL,
            height INTEGER NOT NULL,
            file_size INTEGER NOT NULL,
            original_filename TEXT NOT NULL
        )
    ''')
    
    # جدول سجل النقرات
    c.execute('''
        CREATE TABLE IF NOT EXISTS ad_clicks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ad_id INTEGER NOT NULL,
            user_id INTEGER,
            clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT,
            FOREIGN KEY (ad_id) REFERENCES ads(id)
        )
    ''')
    
    # جدول سجل المشاهدات
    c.execute('''
        CREATE TABLE IF NOT EXISTS ad_views (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ad_id INTEGER NOT NULL,
            user_id INTEGER,
            viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ad_id) REFERENCES ads(id)
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Ads database initialized successfully")

class AdsManager:
    def __init__(self):
        init_ads_db()
        # استخدام دليل العمل الحالي (cwd) حيث يعمل السيرفر
        self.ads_folder = "ads_images"
        if not os.path.exists(self.ads_folder):
            os.makedirs(self.ads_folder)
            logger.info(f"Created ads folder: {self.ads_folder}")
    
    def validate_image(self, image_data: bytes, filename: str) -> Tuple[bool, str, Dict]:
        """التحقق من صحة الصورة"""
        try:
            import io
            from PIL import Image
            
            # فتح الصورة للتحقق
            img = Image.open(io.BytesIO(image_data))
            width, height = img.size
            
            # التحقق من الأبعاد
            if width < 320 or height < 50:
                return False, "Image too small. Minimum: 320x50", {}
            
            if width > 3000 or height > 600:
                return False, "Image too large. Maximum: 3000x600", {}
            
            # التحقق من الحجم (5MB max)
            if len(image_data) > 5 * 1024 * 1024:
                return False, "File size too large. Maximum: 5MB", {}
            
            # التحقق من الصيغة
            allowed_formats = ['JPEG', 'PNG', 'GIF', 'WEBP']
            if img.format not in allowed_formats:
                return False, f"Invalid format. Allowed: {', '.join(allowed_formats)}", {}
            
            return True, "Valid", {
                "width": width,
                "height": height,
                "format": img.format,
                "size": len(image_data)
            }
            
        except Exception as e:
            logger.error(f"Image validation error: {e}")
            return False, f"Invalid image: {str(e)}", {}
    
    def save_image(self, image_data: bytes, filename: str) -> str:
        """حفظ الصورة وإرجاع المسار"""
        try:
            # إنشاء اسم فريد للملف
            timestamp = str(int(time.time()))
            file_hash = hashlib.md5(image_data).hexdigest()[:8]
            ext = os.path.splitext(filename)[1] or '.jpg'
            safe_filename = f"ad_{timestamp}_{file_hash}{ext}"
            
            file_path = os.path.join(self.ads_folder, safe_filename)
            
            # حفظ الصورة
            with open(file_path, 'wb') as f:
                f.write(image_data)
            
            logger.info(f"Saved ad image: {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"Failed to save image: {e}")
            raise
    
    def add_ad(self, 
               title: str,
               image_data: bytes,
               filename: str,
               target_url: str,
               created_by: int,
               max_clicks: Optional[int] = None,
               max_views: Optional[int] = None,
               duration_hours: Optional[int] = None,
               priority: int = 0) -> Tuple[bool, str, Optional[int]]:
        """إضافة إعلان جديد"""
        try:
            # التحقق من الصورة
            is_valid, message, img_info = self.validate_image(image_data, filename)
            if not is_valid:
                return False, message, None
            
            # التحقق من الرابط
            if not target_url or not (target_url.startswith('http://') or target_url.startswith('https://')):
                return False, "Invalid target URL", None
            
            # حفظ الصورة
            image_path = self.save_image(image_data, filename)
            
            # حساب تاريخ الانتهاء
            expiry_date = None
            if duration_hours:
                expiry_date = datetime.now() + timedelta(hours=duration_hours)
            
            # إضافة للقاعدة
            conn = sqlite3.connect('ads_database.db')
            c = conn.cursor()
            
            c.execute('''
                INSERT INTO ads (
                    title, image_path, target_url, created_by,
                    max_clicks, max_views, expiry_date, priority,
                    width, height, file_size, original_filename
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                title, image_path, target_url, created_by,
                max_clicks, max_views, expiry_date, priority,
                img_info['width'], img_info['height'], 
                img_info['size'], filename
            ))
            
            ad_id = c.lastrowid
            conn.commit()
            conn.close()
            
            logger.info(f"Added new ad #{ad_id}: {title}")
            return True, "Ad added successfully", ad_id
            
        except Exception as e:
            logger.error(f"Failed to add ad: {e}")
            return False, f"Error: {str(e)}", None
    
    def get_active_ads(self, include_admin: bool = False) -> List[Dict]:
        """جلب الإعلانات النشطة"""
        try:
            conn = sqlite3.connect('ads_database.db')
            c = conn.cursor()
            
            if include_admin:
                # للأدمن: جميع الإعلانات
                query = '''
                    SELECT id, title, image_path, target_url, click_count, 
                           view_count, max_clicks, max_views, expiry_date, 
                           status, created_at, priority
                    FROM ads
                    ORDER BY status ASC, priority DESC, created_at DESC
                '''
            else:
                # للمستخدمين: الإعلانات النشطة فقط
                query = '''
                    SELECT id, title, image_path, target_url, priority
                    FROM ads
                    WHERE status = 'active'
                    AND (expiry_date IS NULL OR expiry_date > datetime('now'))
                    AND (max_clicks IS NULL OR click_count < max_clicks)
                    AND (max_views IS NULL OR view_count < max_views)
                    ORDER BY priority DESC, created_at DESC
                '''
            
            c.execute(query)
            ads = []
            
            for row in c.fetchall():
                if include_admin:
                    ad = {
                        'id': row[0],
                        'title': row[1],
                        'image_url': f"/api/ads/image/{os.path.basename(row[2])}",
                        'target_url': row[3],
                        'click_count': row[4],
                        'view_count': row[5],
                        'max_clicks': row[6],
                        'max_views': row[7],
                        'expiry_date': row[8],
                        'status': row[9],
                        'created_at': row[10],
                        'priority': row[11]
                    }
                else:
                    ad = {
                        'id': row[0],
                        'title': row[1],
                        'image_url': f"/api/ads/image/{os.path.basename(row[2])}",
                        'target_url': f"/api/ads/click/{row[0]}",  # رابط التتبع
                        'priority': row[4]
                    }
                ads.append(ad)
            
            conn.close()
            return ads
            
        except Exception as e:
            logger.error(f"Failed to get active ads: {e}")
            return []
    
    def record_click(self, ad_id: int, user_id: Optional[int] = None, 
                    ip_address: Optional[str] = None, 
                    user_agent: Optional[str] = None) -> Tuple[bool, str]:
        """تسجيل نقرة على إعلان"""
        try:
            conn = sqlite3.connect('ads_database.db')
            c = conn.cursor()
            
            # التحقق من وجود الإعلان
            c.execute('SELECT target_url, click_count, max_clicks FROM ads WHERE id = ?', (ad_id,))
            row = c.fetchone()
            
            if not row:
                conn.close()
                return False, "Ad not found"
            
            target_url, click_count, max_clicks = row
            
            # تسجيل النقرة
            c.execute('''
                INSERT INTO ad_clicks (ad_id, user_id, ip_address, user_agent)
                VALUES (?, ?, ?, ?)
            ''', (ad_id, user_id, ip_address, user_agent))
            
            # تحديث عداد النقرات
            new_count = click_count + 1
            c.execute('UPDATE ads SET click_count = ? WHERE id = ?', (new_count, ad_id))
            
            # التحقق من اكتمال الإعلان
            if max_clicks and new_count >= max_clicks:
                c.execute('UPDATE ads SET status = ? WHERE id = ?', ('completed', ad_id))
                logger.info(f"Ad #{ad_id} completed (reached max clicks: {max_clicks})")
            
            conn.commit()
            conn.close()
            
            return True, target_url
            
        except Exception as e:
            logger.error(f"Failed to record click: {e}")
            return False, "Error recording click"
    
    def record_view(self, ad_ids: List[int], user_id: Optional[int] = None):
        """تسجيل مشاهدة الإعلانات"""
        try:
            conn = sqlite3.connect('ads_database.db')
            c = conn.cursor()
            
            for ad_id in ad_ids:
                # تسجيل المشاهدة
                c.execute('''
                    INSERT INTO ad_views (ad_id, user_id)
                    VALUES (?, ?)
                ''', (ad_id, user_id))
                
                # تحديث عداد المشاهدات
                c.execute('''
                    UPDATE ads 
                    SET view_count = view_count + 1 
                    WHERE id = ?
                ''', (ad_id,))
                
                # التحقق من اكتمال الإعلان
                c.execute('''
                    SELECT view_count, max_views 
                    FROM ads 
                    WHERE id = ?
                ''', (ad_id,))
                
                row = c.fetchone()
                if row:
                    view_count, max_views = row
                    if max_views and view_count >= max_views:
                        c.execute('UPDATE ads SET status = ? WHERE id = ?', ('completed', ad_id))
                        logger.info(f"Ad #{ad_id} completed (reached max views: {max_views})")
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Failed to record views: {e}")
    
    def delete_ad(self, ad_id: int) -> Tuple[bool, str]:
        """حذف إعلان"""
        try:
            conn = sqlite3.connect('ads_database.db')
            c = conn.cursor()
            
            # جلب مسار الصورة
            c.execute('SELECT image_path FROM ads WHERE id = ?', (ad_id,))
            row = c.fetchone()
            
            if not row:
                conn.close()
                return False, "Ad not found"
            
            image_path = row[0]
            
            # حذف من قاعدة البيانات
            c.execute('DELETE FROM ads WHERE id = ?', (ad_id,))
            c.execute('DELETE FROM ad_clicks WHERE ad_id = ?', (ad_id,))
            c.execute('DELETE FROM ad_views WHERE ad_id = ?', (ad_id,))
            
            conn.commit()
            conn.close()
            
            # حذف ملف الصورة
            if os.path.exists(image_path):
                os.remove(image_path)
                logger.info(f"Deleted ad image: {image_path}")
            
            logger.info(f"Deleted ad #{ad_id}")
            return True, "Ad deleted successfully"
            
        except Exception as e:
            logger.error(f"Failed to delete ad: {e}")
            return False, f"Error: {str(e)}"
    
    def get_statistics(self) -> Dict:
        """جلب إحصائيات الإعلانات"""
        try:
            conn = sqlite3.connect('ads_database.db')
            c = conn.cursor()
            
            # إحصائيات عامة
            c.execute('''
                SELECT 
                    COUNT(*) as total_ads,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_ads,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_ads,
                    SUM(click_count) as total_clicks,
                    SUM(view_count) as total_views
                FROM ads
            ''')
            
            row = c.fetchone()
            stats = {
                'total_ads': row[0] or 0,
                'active_ads': row[1] or 0,
                'completed_ads': row[2] or 0,
                'total_clicks': row[3] or 0,
                'total_views': row[4] or 0
            }
            
            # أفضل الإعلانات أداءً
            c.execute('''
                SELECT id, title, click_count, view_count,
                       CAST(click_count AS FLOAT) / NULLIF(view_count, 0) * 100 as ctr
                FROM ads
                WHERE view_count > 0
                ORDER BY ctr DESC
                LIMIT 5
            ''')
            
            top_ads = []
            for row in c.fetchall():
                top_ads.append({
                    'id': row[0],
                    'title': row[1],
                    'clicks': row[2],
                    'views': row[3],
                    'ctr': round(row[4], 2) if row[4] else 0
                })
            
            stats['top_performing'] = top_ads
            
            conn.close()
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get statistics: {e}")
            return {}
    
    def check_expired_ads(self):
        """التحقق من الإعلانات المنتهية وتحديث حالتها"""
        try:
            conn = sqlite3.connect('ads_database.db')
            c = conn.cursor()
            
            # الإعلانات المنتهية بالوقت
            c.execute('''
                UPDATE ads 
                SET status = 'completed' 
                WHERE status = 'active' 
                AND expiry_date IS NOT NULL 
                AND expiry_date <= datetime('now')
            ''')
            
            expired_by_time = c.rowcount
            
            # الإعلانات المنتهية بالنقرات
            c.execute('''
                UPDATE ads 
                SET status = 'completed' 
                WHERE status = 'active' 
                AND max_clicks IS NOT NULL 
                AND click_count >= max_clicks
            ''')
            
            expired_by_clicks = c.rowcount
            
            # الإعلانات المنتهية بالمشاهدات
            c.execute('''
                UPDATE ads 
                SET status = 'completed' 
                WHERE status = 'active' 
                AND max_views IS NOT NULL 
                AND view_count >= max_views
            ''')
            
            expired_by_views = c.rowcount
            
            conn.commit()
            conn.close()
            
            total = expired_by_time + expired_by_clicks + expired_by_views
            if total > 0:
                logger.info(f"Updated {total} expired ads (time: {expired_by_time}, clicks: {expired_by_clicks}, views: {expired_by_views})")
            
        except Exception as e:
            logger.error(f"Failed to check expired ads: {e}")

# إنشاء instance واحد
ads_manager = AdsManager()
