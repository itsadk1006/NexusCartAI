import time
from server.agent_core import workflow, MemorySaver
import server.agent_core

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

    config = {"configurable": {"thread_id": "test_functional"}}

    final_state = None
    for s in app.stream(state, config=config):
        final_state = s
        print(s)

    print("Testing functionality passed.")

if __name__ == "__main__":
    main()
