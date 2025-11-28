#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
تحديث قاعدة بيانات التوكنات لإضافة عمود حالة الاشتراك
Migrate tokens database to add subscription status column
"""

import sqlite3
import os

def migrate_tokens_database():
    """إضافة عمود is_subscribed إلى قاعدة البيانات الموجودة"""
    db_path = 'user_tokens.db'
    
    if not os.path.exists(db_path):
        print(f"❌ Database {db_path} not found. Run init_tokens_db.py first.")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # التحقق من وجود العمود
        cursor.execute("PRAGMA table_info(user_tokens)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'is_subscribed' in columns:
            print("✅ Column 'is_subscribed' already exists")
            return True
        
        print("🔧 Adding 'is_subscribed' column...")
        
        # إضافة العمود الجديد
        cursor.execute("ALTER TABLE user_tokens ADD COLUMN is_subscribed BOOLEAN DEFAULT 0")
        
        # تحديث التوكنات الموجودة (افتراضياً غير مشتركين)
        cursor.execute("UPDATE user_tokens SET is_subscribed = 0 WHERE is_subscribed IS NULL")
        
        conn.commit()
        
        print("✅ Migration completed successfully!")
        print("📊 All existing tokens marked as non-subscribed (default)")
        print("🔄 New tokens will have correct subscription status")
        
        # عرض إحصائيات
        cursor.execute("SELECT COUNT(*) FROM user_tokens WHERE is_active = 1")
        active_tokens = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM user_tokens")
        total_tokens = cursor.fetchone()[0]
        
        print(f"📈 Database stats: {active_tokens} active tokens, {total_tokens} total tokens")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def main():
    """تشغيل التحديث"""
    print("🚀 Migrating Tokens Database...")
    print("=" * 40)
    
    success = migrate_tokens_database()
    
    if success:
        print("\n🎉 Migration completed successfully!")
        print("💡 The system will now check subscription only once per token")
        print("⚡ This will significantly improve performance!")
    else:
        print("\n💥 Migration failed!")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
