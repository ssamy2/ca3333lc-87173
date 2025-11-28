#!/usr/bin/env python3
"""
Production Startup Script for NFT Gift Calculator
Starts all required services in the correct order
"""

import os
import sys
import time
import subprocess
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_redis():
    """Check if Redis is running"""
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, db=0, socket_connect_timeout=2)
        r.ping()
        logger.info("✅ Redis is running")
        return True
    except Exception as e:
        logger.error(f"❌ Redis not available: {e}")
        return False

def check_env_files():
    """Check if required environment files exist"""
    required_files = ['.env', 'black_token.json']
    missing = []
    
    for file in required_files:
        if not Path(file).exists():
            missing.append(file)
    
    if missing:
        logger.warning(f"⚠️ Missing files: {', '.join(missing)}")
        logger.info("Copy .env.example to .env and configure your tokens")
        return False
    
    logger.info("✅ Environment files found")
    return True

def start_workers():
    """Start background workers"""
    workers = [
        ('Market Worker', 'python', 'market_worker.py'),
        ('Telegram Worker', 'python', 'telegram_worker.py')
    ]
    
    processes = []
    for name, cmd, script in workers:
        try:
            if Path(script).exists():
                logger.info(f"🚀 Starting {name}...")
                proc = subprocess.Popen([cmd, script], 
                                      stdout=subprocess.PIPE, 
                                      stderr=subprocess.PIPE)
                processes.append((name, proc))
                time.sleep(2)  # Give each worker time to start
            else:
                logger.warning(f"⚠️ {script} not found, skipping {name}")
        except Exception as e:
            logger.error(f"❌ Failed to start {name}: {e}")
    
    return processes

def start_main_server():
    """Start the main FastAPI server"""
    try:
        logger.info("🚀 Starting main server on port 5002...")
        cmd = [
            'python', '-m', 'uvicorn', 
            'server:app',
            '--host', '0.0.0.0',
            '--port', '5002',
            '--workers', '12',
            '--access-log'
        ]
        
        proc = subprocess.Popen(cmd)
        return proc
    except Exception as e:
        logger.error(f"❌ Failed to start main server: {e}")
        return None

def main():
    """Main startup sequence"""
    logger.info("🎯 Starting NFT Gift Calculator - Production Mode")
    logger.info("=" * 60)

    if not check_redis():
        logger.error("Please start Redis server first")
        sys.exit(1)
    
    if not check_env_files():
        logger.warning("Some configuration files are missing")
        logger.info("The system may still work with default settings")
    
    # Start background workers
    worker_processes = start_workers()
    
    # Start main server
    main_process = start_main_server()
    
    if main_process:
        logger.info("✅ All services started successfully!")
        logger.info("🌐 Server running at: http://localhost:5002")
        logger.info("📊 Health check: http://localhost:5002/health")
        logger.info("🎯 Hashtag pricing system is active")
        logger.info("\nPress Ctrl+C to stop all services")
        
        try:
            main_process.wait()
        except KeyboardInterrupt:
            logger.info("\n🛑 Shutting down services...")
            main_process.terminate()
            
            for name, proc in worker_processes:
                logger.info(f"🛑 Stopping {name}...")
                proc.terminate()
            
            logger.info("✅ All services stopped")
    else:
        logger.error("❌ Failed to start main server")
        sys.exit(1)

if __name__ == "__main__":
    main()
