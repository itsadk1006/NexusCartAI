import time
import os
from server.agent_core import workflow, MemorySaver

def main():
    checkpointer = MemorySaver()
    app = workflow.compile(checkpointer=checkpointer)

    config = {"configurable": {"thread_id": "test_perf_1"}}
    state = {
        "user_query": "I want to bake a chocolate cake for 4",
        "spend_limit_inr": 1000.0,
        "dish_name": "",
        "is_cooking_or_baking": False,
        "cart": [],
        "missing_items": [],
        "fallback_cart": [],
        "upsell_item": None,
        "total_inr": 0.0,
        "is_approved": False,
        "payment_link_url": None,
        "audit_trace": []
    }

    # Run once to warm up any caches/compilation
    for s in app.stream(state, config=config):
        pass

    start = time.time()
    for _ in range(100):
        config = {"configurable": {"thread_id": f"test_perf_run_{_}"}}
        for s in app.stream(state, config=config):
            pass
    end = time.time()
    print(f"Elapsed time (100 runs): {end - start:.4f}s")

if __name__ == "__main__":
    main()
