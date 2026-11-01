async def metrics_producer_loop():
    import asyncio
    from datetime import datetime, timezone
    import platform
    import httpx
    import psutil

    QUEUE_URL = "http://localhost:7000/push"

    while True:
        try:
            mem = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            metrics = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "hostname": platform.node(),
                "cpu_usage": psutil.cpu_percent(interval=None),
                "memory_usage": mem.percent,
                "disk_usage": disk.percent
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(QUEUE_URL, json={"data": metrics})
                if response.status_code == 200:
                    print("📤 [Collector] Pushed metric to Custom Queue Service.")
        except Exception as e:
            print(f"Error pushing to queue service: {e}")
        
        await asyncio.sleep(2)

if __name__ == "__main__":
    import asyncio
    asyncio.run(metrics_producer_loop())