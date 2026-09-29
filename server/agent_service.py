import sys
import os
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import uvicorn
from dotenv import load_dotenv

# Ensure both server/ directory and root are on sys.path
server_dir = Path(__file__).resolve().parent
root_dir = server_dir.parent

if str(server_dir) not in sys.path:
    sys.path.insert(0, str(server_dir))
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Pre-load environment files
load_dotenv(server_dir / ".env")
load_dotenv(root_dir / ".env")

try:
    from agent_core import app as agent_app
    from langgraph.types import Command
except ImportError:
    from server.agent_core import app as agent_app
    from langgraph.types import Command

app = FastAPI(title="NexusCart AI Agent Service")

class ChatRequest(BaseModel):
    user_query: str
    spend_limit_inr: float = 2000.0
    thread_id: Optional[str] = "default_session"

class ChatResponse(BaseModel):
    cart: list = []
    fallback_items: list = []
    missing_items: list = []
    total_inr: float = 0.0
    audit_trace: list = []
    payment_link_url: Optional[str] = None
    is_approved: bool = False
    dish_name: Optional[str] = None
    upsell_item: Optional[dict] = None

@app.post("/api/agent/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        thread_id = request.thread_id or "default_session"
        config = {"configurable": {"thread_id": thread_id}}
        
        # Check if the thread has an existing paused execution waiting for HITL approval
        snapshot = agent_app.get_state(config)
        if snapshot.next and "hitl_pause_node" in snapshot.next:
            # Resuming human-in-the-loop decision
            output = agent_app.invoke(Command(resume=request.user_query), config=config)
        else:
            initial_state = {
                "user_query": request.user_query,
                "spend_limit_inr": float(request.spend_limit_inr),
                "is_approved": False,
                "audit_trace": []
            }
            output = agent_app.invoke(initial_state, config=config)

        return ChatResponse(
            cart=output.get("cart", []),
            fallback_items=output.get("fallback_cart", []),
            missing_items=output.get("missing_items", []),
            total_inr=float(output.get("total_inr", 0.0)),
            audit_trace=output.get("audit_trace", []),
            payment_link_url=output.get("payment_link_url"),
            is_approved=bool(output.get("is_approved", False)),
            dish_name=output.get("dish_name"),
            upsell_item=output.get("upsell_item")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
