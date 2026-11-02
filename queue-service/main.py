import asyncio
import base64
import os
from pathlib import Path
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

app = FastAPI(title="OTDO Queue & Task Runner Microservice", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Our in-memory queue (the core of our Mini-Redis)
QUEUE = asyncio.Queue(maxsize=1000)
LATEST_METRIC = None

class Message(BaseModel):
    data: dict

class TaskExecutionRequest(BaseModel):
    command: str
    cwd: str | None = None
    project_id: str | None = None
    project_name: str | None = None
    branch: str | None = None
    env: dict[str, str] = Field(default_factory=dict)
    git_username: str | None = None
    git_pat: str | None = None
    timeout_seconds: int = 180

def resolve_working_directory(path_str: str | None, project_name: str | None = None) -> Path:
    """Intelligently resolves project working directory from path, git URL, or common user paths."""
    if not path_str:
        return Path.home()
        
    path_clean = path_str.strip()
    
    # 1. Expand ~ if present
    if path_clean.startswith("~"):
        expanded = Path(os.path.expanduser(path_clean))
        if expanded.exists() and expanded.is_dir():
            return expanded
        path_clean = str(expanded)

    # 2. Check direct path on disk
    p = Path(path_clean)
    if p.exists() and p.is_dir():
        return p

    # 3. If it looks like a Git URL or repo name, extract name
    repo_name = None
    if "github.com" in path_clean:
        parts = path_clean.rstrip("/").split("/")
        repo_name = parts[-1].removesuffix(".git")
    elif project_name:
        repo_name = project_name.strip()
    elif not Path(path_clean).is_absolute():
        repo_name = path_clean

    if repo_name:
        candidates = [
            Path.home() / repo_name,
            Path.home() / "personal" / repo_name,
            Path.home() / "nido" / repo_name,
            Path.home() / "projects" / repo_name,
            Path.home() / ".otdo" / "workspaces" / repo_name,
        ]
        for candidate in candidates:
            if candidate.exists() and candidate.is_dir():
                return candidate
        
        # Fallback to creating managed workspace folder
        managed_dir = Path.home() / ".otdo" / "workspaces" / repo_name
        managed_dir.mkdir(parents=True, exist_ok=True)
        return managed_dir

    return Path.cwd()

@app.post("/push")
async def push_to_queue(msg: Message):
    global LATEST_METRIC
    # Equivalent to Redis LPUSH
    if QUEUE.full():
        raise HTTPException(status_code=503, detail="Queue is full")
    await QUEUE.put(msg.data)
    LATEST_METRIC = msg.data  # Preserve latest telemetry packet for instant dashboard peek
    return {"status": "success", "queue_size": QUEUE.qsize()}

@app.get("/pop")
async def pop_from_queue():
    # Equivalent to Redis RPOP (non-blocking)
    if QUEUE.empty():
        return {"data": None}
    
    item = QUEUE.get_nowait()
    return {"data": item, "queue_size": QUEUE.qsize()}

@app.get("/peek")
async def peek_from_queue():
    """View the latest item without popping/removing it"""
    # Return from queue if available, otherwise return cached LATEST_METRIC
    item = list(QUEUE._queue)[-1] if not QUEUE.empty() else LATEST_METRIC
    return {"data": item, "queue_size": QUEUE.qsize()}

@app.get("/latest")
async def get_latest_metric():
    """Directly fetch the most recently pushed telemetry packet"""
    return {"data": LATEST_METRIC, "queue_size": QUEUE.qsize()}

@app.get("/status")
def queue_status():
    return {"queue_size": QUEUE.qsize(), "max_size": QUEUE.maxsize}

@app.post("/tasks/execute")
async def execute_task(req: TaskExecutionRequest):
    """Executes a real shell / pipeline task for a project with secrets and Git authentication."""
    resolved_dir = resolve_working_directory(req.cwd, req.project_name)
    
    # Environment preparation
    exec_env = os.environ.copy()
    exec_env.update(req.env)
    
    # Git Authentication injection if provided
    if req.git_pat:
        user = req.git_username or "git"
        b64_auth = base64.b64encode(f"{user}:{req.git_pat}".encode("utf-8")).decode("utf-8")
        exec_env["GIT_CONFIG_COUNT"] = "1"
        exec_env["GIT_CONFIG_KEY_0"] = "http.extraheader"
        exec_env["GIT_CONFIG_VALUE_0"] = f"AUTHORIZATION: basic {b64_auth}"
        exec_env["GIT_TERMINAL_PROMPT"] = "0"

    command_to_run = req.command.strip()

    # Intelligent Auto-Clone if git pull requested but directory is not yet a git repo
    if command_to_run.startswith("git pull") and not (resolved_dir / ".git").exists():
        git_target = req.cwd if (req.cwd and ("github.com" in req.cwd or req.cwd.startswith("http"))) else None
        if git_target:
            command_to_run = f"git clone {git_target} . && {command_to_run}"

    start_time = time.time()
    try:
        proc = await asyncio.create_subprocess_shell(
            command_to_run,
            cwd=str(resolved_dir),
            env=exec_env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout_bytes, stderr_bytes = await asyncio.wait_for(
            proc.communicate(),
            timeout=float(req.timeout_seconds)
        )
        
        duration_ms = int((time.time() - start_time) * 1000)
        stdout_str = stdout_bytes.decode("utf-8", errors="replace")
        stderr_str = stderr_bytes.decode("utf-8", errors="replace")

        return {
            "status": "success" if proc.returncode == 0 else "failed",
            "exit_code": proc.returncode,
            "stdout": stdout_str,
            "stderr": stderr_str,
            "duration_ms": duration_ms,
            "cwd_used": str(resolved_dir),
            "command_executed": command_to_run
        }
    except asyncio.TimeoutError:
        try:
            proc.kill()
        except Exception:
            pass
        return {
            "status": "failed",
            "exit_code": 124,
            "stdout": "",
            "stderr": f"Error: Command timed out after {req.timeout_seconds} seconds.",
            "duration_ms": int((time.time() - start_time) * 1000),
            "cwd_used": str(resolved_dir),
            "command_executed": command_to_run
        }
    except Exception as e:
        return {
            "status": "failed",
            "exit_code": 1,
            "stdout": "",
            "stderr": f"Execution error: {str(e)}",
            "duration_ms": int((time.time() - start_time) * 1000),
            "cwd_used": str(resolved_dir),
            "command_executed": command_to_run
        }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=7000, reload=True)
