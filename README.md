# Full Stack Fitness Tracker

This is a full stack fitness tracker application using Node.js/Express for the backend and React/Next.js for the frontend.

## Features

*   **User Registration:** Sign up with your details (name, email, age, height, weight, target weight).
*   **Meal Logging:** (To come) Log your daily meals.
*   **Progress Tracking:** (To come) Track your weight and nutritional intake.

## Project Structure

*   `server/`: Contains the Node.js/Express backend API.
*   `frontend/`: Contains the React/Next.js frontend application.

## Prerequisites

*   Node.js (v14 or higher)
*   MongoDB (running locally or a connection string)

## Setup Instructions

### Backend (Server)

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
    MONGO_URI=mongodb://localhost:27017/fitness-tracker
    PORT=3001
    ```
4.  (Optional) Seed the database with some initial data:
    ```bash
    npm run seed
    ```
5.  Start the server:
    ```bash
    npm start
    ```
    (Note: You may need to add a `start` script to `server/package.json`, e.g., `"start": "node server.js"`)

### Frontend

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

## API Endpoints (WIP)

*   `POST /api/chat`: Handles chat interactions.
*   `GET /api/catalog`: Retrieves the item catalog.
*   `POST /api/agent/order`: Places an order.
*   `GET /api/audit/:sessionId`: Retrieves audit logs for a session.
*   `POST /api/users/register`: Registers a new user.
