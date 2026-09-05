from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from agent_core import app as agent_app

app = FastAPI(title="NexusCart AI Agent Service")

class ChatRequest(BaseModel):
    user_query: str
    spend_limit_inr: float
    thread_id: str

class ChatResponse(BaseModel):
    cart: list
    fallback_items: list
    total_inr: float
    audit_trace: list
    payment_link_url: str | None = None

@app.post("/api/agent/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        config = {"configurable": {"thread_id": request.thread_id}}
        initial_state = {
            "user_query": request.user_query,
            "spend_limit_inr": request.spend_limit_inr,
            "is_approved": False,
            "audit_trace": []
        }

        output = agent_app.invoke(initial_state, config=config)

        return ChatResponse(
            cart=output.get("cart", []),
            fallback_items=output.get("fallback_cart", []),
            total_inr=output.get("total_inr", 0.0),
            audit_trace=output.get("audit_trace", []),
            payment_link_url=output.get("payment_link_url")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
