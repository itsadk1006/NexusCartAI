import time
from server.agent_core import workflow, MemorySaver
import server.agent_core

# Add a fake sleep to the mock to simulate a slow network call
original_invoke = server.agent_core.MockRecipeChain.invoke
def slow_invoke(self, inputs):
    time.sleep(0.1)  # Simulate 100ms LLM call
    return original_invoke(self, inputs)

server.agent_core.MockRecipeChain.invoke = slow_invoke

def main():
    checkpointer = MemorySaver()
    app = workflow.compile(checkpointer=checkpointer)

    state = {
        "user_query": "I want to bake a chocolate cake for 4",
        "spend_limit_inr": 1000.0,
        "dish_name": "",
        "is_cooking_or_baking": False,
        "ingredients": [],
        "cart": [],
        "missing_items": [],
        "fallback_cart": [],
        "upsell_item": None,
        "total_inr": 0.0,
        "is_approved": False,
        "payment_link_url": None,
        "audit_trace": []
    }

    start = time.time()
    for _ in range(10):
        config = {"configurable": {"thread_id": f"test_perf_run_{_}"}}
        for s in app.stream(state, config=config):
            pass
    end = time.time()
    print(f"Elapsed time (10 runs with 0.1s simulated delay): {end - start:.4f}s")

if __name__ == "__main__":
    main()
