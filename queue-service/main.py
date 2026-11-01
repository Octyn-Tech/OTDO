import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Custom Queue Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Our in-memory queue (the core of our Mini-Redis)
QUEUE = asyncio.Queue(maxsize=1000)

class Message(BaseModel):
    data: dict

@app.post("/push")
async def push_to_queue(msg: Message):
    # Equivalent to Redis LPUSH
    if QUEUE.full():
        raise HTTPException(status_code=503, detail="Queue is full")
    await QUEUE.put(msg.data)
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
    if QUEUE.empty():
        return {"data": None}
    # Inspect the internal queue items without dequeuing
    items = list(QUEUE._queue)
    return {"data": items[-1], "queue_size": QUEUE.qsize()}

@app.get("/status")
def queue_status():
    return {"queue_size": QUEUE.qsize(), "max_size": QUEUE.maxsize}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=7000, reload=True)