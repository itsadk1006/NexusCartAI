# NexusCart AI: An Agentic Commerce Gateway Bridging Autonomous Buyers and Retail Merchants

**Razorpay AI Buildathon Submission - Track 1: AI Growth & Agentic Commerce**

NexusCart AI is a next-generation commerce gateway that acts as a secure, intelligent bridge between intent-driven shoppers (both human and AI agents) and retail merchants.

## Architecture Flow

The platform operates as a two-sided marketplace with the following core flow:

```text
Buyer Intent Parser -> Inventory Matcher -> Seller Stock Gate -> Razorpay Payment Link
```

1.  **Buyer Intent Parser:** Understands complex natural language queries and extracts purchasing intent (e.g., "Bake a chocolate cake for 4").
2.  **Inventory Matcher:** Automatically bundles required ingredients based on real-time catalog data and suggests upsells.
3.  **Seller Stock Gate (HITL):** Orders are routed to a secure Merchant Dashboard where shopkeepers can review, accept, or reject incoming requests (Human-In-The-Loop).
4.  **Razorpay Payment Link:** Once an order is accepted by the merchant, a secure Razorpay checkout link is generated for final capture.

## Pitch Video & Demo

[Placeholder for 5-Minute Pitch Video Link]

## Post-Mortem: "What broke at 2 AM"

At 2 AM, right as I was wiring my LangGraph orchestration to the deterministic inventory matcher, the entire pipeline crashed with a tool_use_failed 400 Bad Request. I was using Groq (Llama 3.3) to extract natural language buyer intents into a strict RecipeExtraction Pydantic schema. However, the model kept hallucinating conversational markdown (e.g., "Sure, here are your ingredients!"), which completely broke the deterministic Python logic required for the Razorpay checkout.

I tried forcing .with_structured_output(method="json_mode"), but that immediately triggered a massive Pydantic ValidationError. The LLM got lazy, dropped required fields like dish_name and is_cooking_or_baking, and only returned the raw array.

How I got out:
I realized I needed to guide the JSON mode explicitly. I engineered a bulletproof system prompt, injecting an exact JSON blueprint using double curly braces {{ }} so LangChain wouldn't confuse the formatting variables. By forcing the LLM to follow this rigid template and coupling it with strict Pydantic validation, I completely decoupled the AI's language reasoning from the financial math. The parser ran flawlessly, allowing my Python backend to safely calculate the cart total and trigger the HITL circuit breaker

---

## Technical Details

This is a full stack application using Node.js/Express for the backend and React/Next.js for the frontend.

### Features

*   **Dual-Role Authentication:** Secure access for both Buyers and Merchants.
*   **Conversational Commerce UI:** An intuitive chat interface for buyers with live tracing.
*   **Merchant Control Panel:** A real-time dashboard for sellers to manage incoming UAP (Universal Agent Protocol) and Human orders.
*   **Live Order Queue:** Responsive data tables with Framer Motion animations and distinct source tagging.

### Project Structure

*   `server/`: Contains the1. Seed the Database
Run this once to populate your MongoDB with the mock inventory data:

cd server
npm run seed
2. Start the FastAPI Agent Service
Run this in a dedicated terminal window from the root of the repository:

cd server
uvicorn agent_service:app --host 0.0.0.0 --port 8000
(This will start the Python microservice handling the LangGraph AI logic on port 8000).

3. Start the Express Backend Proxy
Run this in a second dedicated terminal window from the root of the repository:

cd server
npm start
(This will start the Node.js API that serves the catalog, manages orders, and proxies chat requests to your FastAPI service on port 3001).

4. Start the Next.js Frontend
Run this in a third dedicated terminal window from the root of the repository:

cd frontend
npm run dev
(This will start the React UI on http://localhost:3000).

Once all three services are running, you can navigate to http://localhost:3000 in your browser and interact with the AI agent!he React/Next.js frontend application.

### Setup Instructions

