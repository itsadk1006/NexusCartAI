const express = require('express');
const InventoryItem = require('../models/InventoryItem');
const AuditLog = require('../models/AuditLog');
const Order = require('../models/Order');

const router = express.Router();

// Mock Chat Endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId, spendLimit } = req.body;

    // This is a placeholder mock response.
    // In reality, this would connect to the custom LangGraph agent engine.
    const mockTrace = {
        step: 1,
        agentStep: "Intent Extraction",
        parsedEntities: ["chocolate cake", "4 people"],
        nodesEvaluated: 4
    };

    const mockResponse = {
        message: "I can help with that! Here are the ingredients for a chocolate cake for 4 people.",
        bundle: [
            { name: "Cocoa Powder", quantity: 1, unitPrice: 150, inStock: true },
            { name: "All-Purpose Flour", quantity: 1, unitPrice: 60, inStock: true }
        ],
        upsell: {
            name: "Non-stick Cake Pan",
            price: 250
        },
        calculatedTotal: 210,
        trace: mockTrace,
        status: spendLimit >= 210 ? "APPROVED" : "HITL_TRIGGERED"
    };

    // Log the interaction
    await AuditLog.create({
        sessionId,
        userQuery: message,
        spendLimit,
        calculatedTotal: mockResponse.calculatedTotal,
        status: mockResponse.status,
        trace: mockTrace
    });

    res.json(mockResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
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
