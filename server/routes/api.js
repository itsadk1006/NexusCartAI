const express = require('express');
const axios = require('axios');
const InventoryItem = require('../models/InventoryItem');
const AuditLog = require('../models/AuditLog');
const Order = require('../models/Order');

const router = express.Router();

// Chat Endpoint with FastAPI Proxy
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId, spendLimit } = req.body;

    // Proxy the request to the FastAPI service
    const agentResponse = await axios.post('http://127.0.0.1:8000/api/agent/chat', {
      user_query: message,
      spend_limit_inr: spendLimit,
      thread_id: sessionId
    });

    const agentData = agentResponse.data;

    const responsePayload = {
        message: "Here are the ingredients for your recipe based on our catalog.",
        bundle: agentData.cart.map(item => ({
            name: item.name,
            quantity: item.requested_qty,
            unitPrice: item.unit_price_inr,
            inStock: true
        })),
        fallback: agentData.fallback_items || agentData.fallback_cart,
        upsell: null, // Modify if the API returns upsell
        calculatedTotal: agentData.total_inr,
        trace: agentData.audit_trace,
        status: agentData.total_inr <= spendLimit || agentData.is_approved ? "APPROVED" : "HITL_TRIGGERED",
        paymentLink: agentData.payment_link_url
    };

    // Log the interaction
    await AuditLog.create({
        sessionId,
        userQuery: message,
        spendLimit,
        calculatedTotal: responsePayload.calculatedTotal,
        status: responsePayload.status,
        trace: responsePayload.trace
    });

    res.json(responsePayload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get Catalog
let catalogCache = {
  data: null,
  timestamp: null
};
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

router.get('/catalog', async (req, res) => {
  try {
    const now = Date.now();
    if (catalogCache.data && catalogCache.timestamp && (now - catalogCache.timestamp < CACHE_TTL_MS)) {
      return res.json(catalogCache.data);
    }

    const items = await InventoryItem.find({ stock: { $gt: 0 } }).lean();
    catalogCache = {
      data: items,
      timestamp: now
    };
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Place Order
router.post('/agent/order', async (req, res) => {
  try {
    const { items, total, source } = req.body;

    const newOrder = await Order.create({
      items,
      total,
      source: source || 'AI_BUYER',
      status: 'PENDING'
    });

    res.json({ success: true, message: 'Order placed successfully', orderId: newOrder._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all orders (Merchant Dashboard)
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ timestamp: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update order status (Merchant HITL)
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updatedOrder) {
        return res.status(404).json({ error: 'Order not found' });
    }
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get Audit Logs
router.get('/audit/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const logs = await AuditLog.find({ sessionId }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
