import os
import time
import sys
import json
from typing import List, Dict, Any, Optional, Literal, TypedDict, Annotated
import operator
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt, Command
import razorpay

# 1. Load the environment variables
load_dotenv()

# In-memory store inventory for NexusCart AI
# 2. Catalogs
MOCK_CATALOG = {
    "all purpose flour": {"sku": "SKU_FLOUR_01", "name": "All-Purpose Flour (500g)", "price_inr": 60, "stock": 15, "is_margin_booster": False},
    "cocoa powder": {"sku": "SKU_COCOA_01", "name": "Baking Cocoa Powder (150g)", "price_inr": 180, "stock": 10, "is_margin_booster": False},
    "sugar": {"sku": "SKU_SUGAR_01", "name": "Granulated Sugar (500g)", "price_inr": 45, "stock": 20, "is_margin_booster": False},
    "baking powder": {"sku": "SKU_BAKE_01", "name": "Baking Powder (100g)", "price_inr": 40, "stock": 8, "is_margin_booster": False},
    "unsalted butter": {"sku": "SKU_BUTTER_01", "name": "Unsalted Butter (200g)", "price_inr": 120, "stock": 5, "is_margin_booster": False},
    'vanilla extract': {'sku': 'SKU_VANILLA_01', 'name': 'Pure Vanilla Extract (50ml)', 'price_inr': 220, 'stock': 0, 'is_margin_booster': False}, # Out of stock for testing
    'cake tin': {'sku': 'SKU_TIN_01', 'name': '8-inch Non-Stick Cake Tin', 'price_inr': 250, 'stock': 12, 'is_margin_booster': True}, # Upsell
    'birthday candles': {'sku': 'SKU_CANDLE_01', 'name': 'Metallic Birthday Candles (10pk)', 'price_inr': 80, 'stock': 30, 'is_margin_booster': True} # Upsell
}

# The Mock Quick-Commerce Catalog
QUICK_COMMERCE_CATALOG = {
    "vanilla extract": {
        "blinkit": 210,
        "zepto": 180,
        "instamart": 195
    }
}

# 3. Pydantic Schemas & LLM Chain
class IngredientItem(BaseModel):
    name: str = Field(description="Normalized ingredient name, e.g., 'all purpose flour'")
    quantity: float = Field(description="Numeric quantity required")
    unit: str = Field(description="Unit of measurement: 'g', 'ml', 'unit', 'tbsp'")

class RecipeExtraction(BaseModel):
    dish_name: str
    servings: int
    is_cooking_or_baking: bool = Field(description="True if the intent involves baking or cooking")
    ingredients: List[IngredientItem]
    instructions: List[str] = Field(description="Step-by-step cooking or baking instructions")

# For the test, we mock the invoke of the recipe chain since we do not have a real GROQ API KEY
class MockRecipeChain:
    def invoke(self, inputs):
        class MockExtraction:
            dish_name = 'chocolate cake'
            servings = 4
            is_cooking_or_baking = True
            ingredients = [
                IngredientItem(name='cocoa powder', quantity=1, unit='150g'),
                IngredientItem(name='all purpose flour', quantity=1, unit='500g')
            ]
            instructions = ['Mix', 'Bake']
        return MockExtraction()

# Use real GROQ-backed chain when API key exists, otherwise fall back to the mock for tests
if os.getenv('GROQ_API_KEY'):
    llm = ChatGroq(
        model='openai/gpt-oss-20b',
        temperature=0,
        api_key=os.getenv('GROQ_API_KEY')
    )

    system_prompt = '''You are an expert executive chef and grocery planner.
Your job is to break down the user's dish into standard, essential cooking ingredients.

Rules:
- Output ingredient names in lowercase, generic pantry terms that a local grocer carries (e.g., 'granulated sugar').
- Accurately estimate standard recipe quantities scaled to the number of servings.
- Strictly output ingredients, units, and quantities—never calculate prices.

YOU MUST RESPOND ONLY WITH A VALID JSON OBJECT EXACTLY MATCHING THIS STRUCTURE:
{
  "dish_name": "String (name of the dish)",
  "servings": Integer (number of people),
  "is_cooking_or_baking": Boolean (true or false),
  "ingredients": [
    {
      "name": "String",
      "quantity": Float,
      "unit": "String"
    }
  ],
  "instructions": [
    "String (Step 1...)",
    "String (Step 2...)"
  ]
}'''

    prompt = ChatPromptTemplate.from_messages([
        ('system', system_prompt),
        ('human', '{user_query}')
    ])

    structured_llm = llm.with_structured_output(RecipeExtraction, method='json_mode')
    recipe_chain = prompt | structured_llm
else:
    recipe_chain = MockRecipeChain()

def match_inventory_and_calculate(extracted_indgredients, catalog):
    cart_items = []
    missing_items = []
    subtotal_inr = 0.0

    for item in extracted_indgredients:
        key = item.name.lower()
        matched_sku = catalog.get(key)

        if matched_sku:
            if matched_sku["stock"] > 0:
                cart_items.append({
                    "sku": matched_sku["sku"],
                    "name": matched_sku["name"],
                    "unit_price_inr": matched_sku["price_inr"],
                    "requested_qty": item.quantity,
                    "unit": item.unit
                })
                subtotal_inr += (matched_sku['price_inr'] * item.quantity)
            else:
                missing_items.append({'name': matched_sku['name'], 'reason': 'Out of Stock'})
        else:
            missing_items.append({'name': item.name, 'reason': 'not sold in the store'})
            
    return {'cart': cart_items, 'missing_items': missing_items, 'subtotal_inr': subtotal_inr}

def run_qc_fallback(missing_items, qc_catalog) -> dict:
    recovered_cart = []
    recovered_subtotal_inr = 0.0
    still_missing = []

    for item in missing_items:
        item_name_lower = item["name"].lower()
        matched_qc_key = None
        for key in qc_catalog.keys():
            if key in item_name_lower:
                matched_qc_key = key
                break
        if matched_qc_key:
            provider_prices = qc_catalog[matched_qc_key]
            cheapest_provider = min(provider_prices, key=provider_prices.get)
            cheapest_price = provider_prices[cheapest_provider]
            recovered_cart.append({
                "name": item["name"],
                "provider": cheapest_provider,
                "unit_price_inr": cheapest_price
            })
            recovered_subtotal_inr += cheapest_price
        else:
            still_missing.append(item)

    return {'recovered_cart': recovered_cart, 'recovered_subtotal_inr': recovered_subtotal_inr, 'still_missing': still_missing}

def get_margin_upsell(is_cooking_or_baking: bool, catalog: dict):
    if not is_cooking_or_baking:
        return None
    for key, item in catalog.items():
        if item.get("is_margin_booster") and item.get("stock", 0) > 0:
            return {
                "sku": item["sku"],
                "name": item["name"],
                "price_inr": item["price_inr"],
                "pitch": f"Would you like to add {item['name']} for ₹{item['price_inr']}?"
            }
    return None

# 5. LangGraph State & Razorpay
class AgentState(TypedDict):
    user_query: str
    spend_limit_inr: float
    dish_name: str
    is_cooking_or_baking: bool
    cart: List[Dict[str, Any]]
    missing_items: List[Dict[str, Any]]
    fallback_cart: List[Dict[str, Any]]
    upsell_item: Optional[Dict[str, Any]]
    total_inr: float
    is_approved: bool
    payment_link_url: Optional[str]
    audit_trace: List[str]

razorpay_client = razorpay.Client(
    auth=(os.getenv('RAZORPAY_KEY_ID', 'rzp_test_placeholder'),
          os.getenv("RAZORPAY_KEY_SECRET", "placeholder_secret"))
)

def generate_test_payment_link(amount_inr: float, description: str) -> str:
    amount_paise = int(amount_inr * 100)
    try:
        payload = {
            "amount": amount_paise,
            "currency": "INR",
            "accept_partial": False,
            "description": description,
            "customer": {"name": "NexusCart Buyer", "contact": "9999999999"},
            "notify": {"sms": False, "email": False},
            "reminder_enable": False,
            "expire_by": int(time.time()) + 1800,
            "notes": {"track": "Track 1: Agentic Commerce"}
        }
        link = razorpay_client.payment_link.create(payload)
        return link.get("short_url", f"https://rzp.io/i/mock_test_{amount_paise}")
    except Exception:
        return f"https://rzp.io/i/mock_test_{amount_paise}"

# 6. Graph Nodes
def parser_node(state: AgentState) -> dict:
    parsed = recipe_chain.invoke({"user_query": state["user_query"]})
    return {
        "dish_name": parsed.dish_name,
        "is_cooking_or_baking": parsed.is_cooking_or_baking,
        "audit_trace": state.get("audit_trace", []) + [f"Parsed intent: {parsed.dish_name}"]
    }

def matcher_node(state: AgentState) -> dict:
    parsed = recipe_chain.invoke({"user_query": state["user_query"]})
    result = match_inventory_and_calculate(parsed.ingredients, MOCK_CATALOG)
    return {
        "cart": result["cart"],
        "missing_items": result["missing_items"],
        "total_inr": result["subtotal_inr"],
        "audit_trace": state.get("audit_trace", []) + [f"Primary store matched. Subtotal: ₹{result['subtotal_inr']}"]
    }

def fallback_and_upsell_node(state: AgentState) -> dict:
    fallback = run_qc_fallback(state["missing_items"], QUICK_COMMERCE_CATALOG)
    upsell = get_margin_upsell(state["is_cooking_or_baking"], MOCK_CATALOG)
    new_total = state['total_inr'] + fallback['recovered_subtotal_inr']
    if upsell:
        new_total += upsell['price_inr']
    return {
        "fallback_cart": fallback["recovered_cart"],
        "upsell_item": upsell,
        "total_inr": new_total,
        "audit_trace": state["audit_trace"] + [f"Fallback/Upsell applied. Grand total: ₹{new_total}"]
    }

def hitl_pause_node(state: AgentState) -> dict:
    user_decision = interrupt(f"Cart total ₹{state['total_inr']} exceeds limit ₹{state['spend_limit_inr']}. Type 'CONFIRM'.")
    if str(user_decision).strip().upper() == "CONFIRM":
        return {"is_approved": True, "audit_trace": state["audit_trace"] + ["HITL: Approved"]}
    return {"is_approved": False, "audit_trace": state["audit_trace"] + ["HITL: Cancelled"]}

def checkout_node(state: AgentState) -> dict:
    link = generate_test_payment_link(state["total_inr"], f"Order for {state['dish_name']}")
    return {
        "payment_link_url": link,
        "is_approved": True,
        "audit_trace": state["audit_trace"] + [f"Payment link generated: {link}"]
    }

def check_limit_router(state: AgentState) -> Literal["hitl_pause_node", "checkout_node"]:
    if state["total_inr"] > state["spend_limit_inr"] and not state.get("is_approved", False):
        return "hitl_pause_node"
    return "checkout_node"

workflow = StateGraph(AgentState)
workflow.add_node("parser_node", parser_node)
workflow.add_node("matcher_node", matcher_node)
workflow.add_node("fallback_and_upsell_node", fallback_and_upsell_node)
workflow.add_node("hitl_pause_node", hitl_pause_node)
workflow.add_node("checkout_node", checkout_node)

workflow.add_edge(START, "parser_node")
workflow.add_edge("parser_node", "matcher_node")
workflow.add_edge("matcher_node", "fallback_and_upsell_node")
workflow.add_conditional_edges("fallback_and_upsell_node", check_limit_router)
workflow.add_edge("hitl_pause_node", "checkout_node")
workflow.add_edge("checkout_node", END)

checkpointer = MemorySaver()
app = workflow.compile(checkpointer=checkpointer)
