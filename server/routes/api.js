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
    const limit = Number(spendLimit) || 2000;
    const threadId = sessionId || `session_${Date.now()}`;

    // Proxy the request to the FastAPI service
    const agentResponse = await axios.post('http://127.0.0.1:8000/api/agent/chat', {
      user_query: message,
      spend_limit_inr: limit,
      thread_id: threadId
    });

    const agentData = agentResponse.data;

    const responsePayload = {
        message: agentData.dish_name
            ? `Here are the ingredients for "${agentData.dish_name}" based on our catalog.`
            : "Here are the ingredients for your recipe based on our catalog.",
        bundle: [
            ...(agentData.cart || []).map(item => ({
                name: item.name,
                quantity: item.requested_qty,
                unitPrice: item.unit_price_inr,
                inStock: true
            })),
            ...(agentData.fallback_items || []).map(item => ({
                name: `${item.name} (${item.provider})`,
                quantity: 1,
                unitPrice: item.unit_price_inr,
                inStock: true
            }))
        ],
        fallback: agentData.fallback_items || [],
        upsell: agentData.upsell_item ? {
            sku: agentData.upsell_item.sku,
            name: agentData.upsell_item.name,
            price: agentData.upsell_item.price_inr,
            pitch: agentData.upsell_item.pitch
        } : null,
        calculatedTotal: agentData.total_inr,
        trace: agentData.audit_trace,
        status: (agentData.total_inr <= limit || agentData.is_approved) ? "APPROVED" : "HITL_TRIGGERED",
        paymentLink: agentData.payment_link_url
    };

    // Log the interaction
    try {
        await AuditLog.create({
            sessionId: threadId,
            userQuery: message,
            spendLimit: limit,
            calculatedTotal: responsePayload.calculatedTotal,
            status: responsePayload.status,
            trace: responsePayload.trace
        });
    } catch (auditErr) {
        console.warn('AuditLog logging skipped (MongoDB may be offline):', auditErr.message);
    }

    res.json(responsePayload);
  } catch (error) {
    console.error('FastAPI Agent Proxy Error:', error?.response?.data || error.message);
    res.status(500).json({ error: error?.response?.data?.detail || 'Internal Server Error' });
  }
});

// Get Catalog
router.get('/catalog', async (req, res) => {
  try {
    const items = await InventoryItem.find({ stock: { $gt: 0 } });
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
