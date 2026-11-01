import asyncio
from datetime import datetime, timezone
import os
import platform
import sqlite3
import time
import httpx
import psutil

QUEUE_URL = "http://localhost:7000/push"

def read_system_temperatures():
    cpu_temp = None
    gpu_temp = None
    nvme_temp = None
    try:
        temps = psutil.sensors_temperatures() if hasattr(psutil, "sensors_temperatures") else {}
        if temps:
            for k in ["k10temp", "coretemp", "cpu_thermal", "soc_thermal"]:
                if k in temps and temps[k]:
                    cpu_temp = round(temps[k][0].current, 1)
                    break
            for k in ["amdgpu", "nouveau", "nvidia"]:
                if k in temps and temps[k]:
                    gpu_temp = round(temps[k][0].current, 1)
                    break
            if "nvme" in temps and temps["nvme"]:
                nvme_temp = round(temps["nvme"][0].current, 1)
            if cpu_temp is None:
                if "acpitz" in temps and temps["acpitz"]:
                    cpu_temp = round(temps["acpitz"][0].current, 1)
                else:
                    for s_list in temps.values():
                        if s_list:
                            cpu_temp = round(s_list[0].current, 1)
                            break
    except Exception:
        pass
    return {
        "cpu_temp_c": cpu_temp if cpu_temp is not None else 45.0,
        "gpu_temp_c": gpu_temp,
        "nvme_temp_c": nvme_temp,
    }

async def metrics_producer_loop():
    # Resolve db path relative to this script
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.abspath(os.path.join(base_dir, "../metrics-ingestor/metrics.db"))

    # Initial baseline readings
    prev_net = psutil.net_io_counters()
    prev_disk = psutil.disk_io_counters()
    prev_time = time.time()
    psutil.cpu_percent(interval=None)

    async with httpx.AsyncClient(timeout=3.0) as client:
        while True:
            await asyncio.sleep(1)
            curr_time = time.time()
            time_delta = max(curr_time - prev_time, 0.1)

            try:
                mem = psutil.virtual_memory()
                disk = psutil.disk_usage('/')

                # Network I/O Rate (Bytes/sec -> KB/s)
                curr_net = psutil.net_io_counters()
                net_sent_bytes_sec = max(0.0, (curr_net.bytes_sent - prev_net.bytes_sent) / time_delta)
                net_recv_bytes_sec = max(0.0, (curr_net.bytes_recv - prev_net.bytes_recv) / time_delta)
                prev_net = curr_net

                # Disk I/O Rate (Bytes/sec -> KB/s)
                curr_disk = psutil.disk_io_counters()
                disk_read_bytes_sec = max(0.0, (curr_disk.read_bytes - prev_disk.read_bytes) / time_delta)
                disk_write_bytes_sec = max(0.0, (curr_disk.write_bytes - prev_disk.write_bytes) / time_delta)
                prev_disk = curr_disk

                prev_time = curr_time

                # System uptime & load
                uptime_sec = int(curr_time - psutil.boot_time())
                load_avg = os.getloadavg() if hasattr(os, "getloadavg") else [0.0, 0.0, 0.0]
                active_processes = len(psutil.pids())

                # Database records & size
                db_size_bytes = 0
                db_record_count = 0
                if os.path.exists(db_path):
                    try:
                        db_size_bytes = os.path.getsize(db_path)
                        with sqlite3.connect(f"file:{db_path}?mode=ro", uri=True, timeout=0.5) as conn:
                            cursor = conn.cursor()
                            cursor.execute("SELECT COUNT(*) FROM system_metrics")
                            row = cursor.fetchone()
                            if row:
                                db_record_count = row[0]
                    except Exception:
                        pass

                # Hardware thermal sensors
                thermal_data = read_system_temperatures()

                metrics = {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "hostname": platform.node(),
                    "cpu_usage": psutil.cpu_percent(interval=None),
                    "memory_usage": mem.percent,
                    "disk_usage": disk.percent,
                    # Realtime I/O & Enhanced Telemetry
                    "net_sent_kb": round(net_sent_bytes_sec / 1024, 2),
                    "net_recv_kb": round(net_recv_bytes_sec / 1024, 2),
                    "disk_read_kb": round(disk_read_bytes_sec / 1024, 2),
                    "disk_write_kb": round(disk_write_bytes_sec / 1024, 2),
                    "uptime_seconds": uptime_sec,
                    "load_avg_1m": round(load_avg[0], 2),
                    "active_processes": active_processes,
                    "db_size_bytes": db_size_bytes,
                    "db_record_count": db_record_count,
                    "cpu_temp_c": thermal_data.get("cpu_temp_c"),
                    "gpu_temp_c": thermal_data.get("gpu_temp_c"),
                    "nvme_temp_c": thermal_data.get("nvme_temp_c"),
                }

                response = await client.post(QUEUE_URL, json={"data": metrics})
                if response.status_code == 200:
                    pass
            except Exception as e:
                print(f"Error collecting/pushing metrics: {e}")

if __name__ == "__main__":
    asyncio.run(metrics_producer_loop())
