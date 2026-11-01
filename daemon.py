import asyncio
import os
import signal
import sys

# Define the services to run: (Name, Working Directory, Command)
SERVICES = [
    (
        "QUEUE-SRV", 
        "./queue-service", 
        ["uv", "run", "python", "main.py"]
    ),
    (
        "COLLECTOR", 
        "./metrics-collector", 
        ["uv", "run", "python", "main.py"]
    ),
    (
        "INGESTOR", 
        "./metrics-ingestor", 
        ["uv", "run", "python", "main.py"]
    ),
    (
        "DASHBOARD",
        "./web-console",
        ["npm", "run", "dev", "--", "--port", "5173"]
    )
]

async def stream_subprocess_output(name, reader):
    """Reads stdout/stderr from a service subprocess and prints it with a colored tag."""
    # ANSI color codes for pretty terminal logging
    colors = {
        "QUEUE-SRV": "\033[96m",  # Cyan
        "COLLECTOR": "\033[92m",  # Green
        "INGESTOR": "\033[93m",   # Yellow
        "DASHBOARD": "\033[95m",  # Magenta
    }
    reset = "\033[0m"
    color = colors.get(name, "\033[97m")

    while True:
        line = await reader.readline()
        if not line:
            break
        decoded = line.decode().strip()
        print(f"{color}[{name}] {decoded}{reset}")

async def run_service(name, cwd, cmd):
    """Starts a service subprocess and monitors it."""
    if not os.path.exists(cwd):
        print(f"❌ Error: Directory '{cwd}' for service '{name}' not found.")
        return

    print(f"🚀 Starting {name}...")
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=cwd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    try:
        await asyncio.gather(
            stream_subprocess_output(name, process.stdout),
            stream_subprocess_output(name, process.stderr)
        )
    except asyncio.CancelledError:
        # Gracefully terminate subprocess on cancel
        try:
            process.terminate()
            await process.wait()
        except ProcessLookupError:
            pass
        raise

    await process.wait()
    print(f"⚠️ Service {name} stopped.")

async def main():
    print("==================================================")
    print(" 🛡️  Starting System Metrics Daemon Manager")
    print("==================================================")

    tasks = [
        asyncio.create_task(run_service(name, cwd, cmd)) 
        for name, cwd, cmd in SERVICES
    ]

    stop_event = asyncio.Event()

    def signal_handler():
        print("\n🛑 Shutting down all microservices gracefully...")
        stop_event.set()
        for task in tasks:
            task.cancel()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, signal_handler)

    try:
        await stop_event.wait()
    except asyncio.CancelledError:
        pass
    
    # Cancel all tasks and wait for them to finish cleanup
    for task in tasks:
        task.cancel()
        
    await asyncio.gather(*tasks, return_exceptions=True)
    
    # Tiny pause to let transport garbage collection finish before loop closes
    await asyncio.sleep(0.1)
    print("👋 All services shut down successfully.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(0)