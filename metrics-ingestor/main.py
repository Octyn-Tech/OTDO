import asyncio
from datetime import datetime
import aiosqlite
import httpx

QUEUE_POP_URL = "http://localhost:7000/pop"
DB_FILE = "metrics.db"

async def init_db():
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS system_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                hostname TEXT,
                cpu_usage REAL,
                memory_usage REAL,
                disk_usage REAL
            )
        """)
        await db.commit()

async def sqlite_ingestor_worker():
    await init_db()
    BATCH_SIZE = 5
    batch = []

    print("📥 [Ingestor] Polling Custom Queue Service...")

    async with httpx.AsyncClient() as client:
        while True:
            try:
                response = await client.get(QUEUE_POP_URL)
                if response.status_code == 200:
                    result = response.json()
                    metric = result.get("data")
                    
                    if metric:
                        batch.append(metric)
                    else:
                        # Queue is empty, wait a bit before checking again
                        await asyncio.sleep(1)
                
                # Flush batch if it reaches the size limit
                if batch and len(batch) >= BATCH_SIZE:
                    async with aiosqlite.connect(DB_FILE) as db:
                        rows = [
                            (m["timestamp"], m["hostname"], m["cpu_usage"], m["memory_usage"], m["disk_usage"])
                            for m in batch
                        ]
                        await db.executemany("""
                            INSERT INTO system_metrics (timestamp, hostname, cpu_usage, memory_usage, disk_usage)
                            VALUES (?, ?, ?, ?, ?)
                        """, rows)
                        await db.commit()
                    
                    print(f"💾 [SQLite Ingestor] Committed batch of {len(batch)} records to SQLite.")
                    batch.clear()

            except Exception as e:
                print(f"Ingestor error: {e}")
                await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(sqlite_ingestor_worker())