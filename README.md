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

[Placeholder for Post-Mortem Essay: A brief overview of challenges faced during development, unexpected edge cases in agent behavior, and how we solved them.]

---

## Technical Details

This is a full stack application using Node.js/Express for the backend and React/Next.js for the frontend.

### Features

*   **Dual-Role Authentication:** Secure access for both Buyers and Merchants.
*   **Conversational Commerce UI:** An intuitive chat interface for buyers with live tracing.
*   **Merchant Control Panel:** A real-time dashboard for sellers to manage incoming UAP (Universal Agent Protocol) and Human orders.
*   **Live Order Queue:** Responsive data tables with Framer Motion animations and distinct source tagging.

### Project Structure

*   `server/`: Contains the Node.js/Express backend API.
*   `frontend/`: Contains the React/Next.js frontend application.

### Setup Instructions

#### Backend (Server)

1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up your environment variables. Create a `.env` file in the `server` directory and add your MongoDB URI and a port:
    ```
    MONGO_URI=mongodb://localhost:27017/nexuscart
    PORT=3001
    ```
4.  Start the server:
    ```bash
    npm start
    ```

#### Frontend

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open your browser and navigate to `http://localhost:3000`.
