"use client";

import React, { useState, useEffect } from 'react';
import { Store, Check, X, LogOut, Clock, IndianRupee, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';
import axios from 'axios';

export default function MerchantDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders`);
      setOrders(res.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // In a real app, this would use WebSockets for live updates
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`${API_URL}/api/orders/${id}/status`, { status });
      // Optimistic UI update
      setOrders(orders.map(order =>
        order._id === id ? { ...order, status } : order
      ));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-900/30 rounded-lg flex items-center justify-center border border-indigo-500/30">
            <Store className="text-indigo-400 w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Merchant Control Panel</h1>
            <p className="text-xs text-slate-400">Live Order Queue & Seller HITL</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-200">Incoming Orders</h2>
          <div className="flex gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-slate-400">Live Sync Active</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            Loading queue...
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {orders.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center h-64 bg-slate-900/50 border border-slate-800 border-dashed rounded-xl text-slate-500">
                  <Clock className="w-8 h-8 mb-2 opacity-50" />
                  <p>No orders in the queue.</p>
                </div>
              ) : (
                orders.map((order) => (
                  <motion.div
                    key={order._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-slate-900 border rounded-xl overflow-hidden shadow-lg transition-colors ${
                      order.status === 'PENDING' ? 'border-slate-700' :
                      order.status === 'ACCEPTED' ? 'border-emerald-500/30 bg-emerald-900/10' :
                      'border-rose-500/30 bg-rose-900/10'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-4 border-b border-slate-800/50 flex justify-between items-start bg-slate-950/50">
                      <div>
                        <p className="text-xs text-slate-500 font-mono mb-1">ID: {order._id.slice(-6).toUpperCase()}</p>
                        {order.source === 'AI_BUYER' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            <ShieldCheck className="w-3 h-3" />
                            [AI Buyer - UAP Protocol]
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <Store className="w-3 h-3" />
                            [Human Customer - Web Chat]
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Total</span>
                        <p className="text-lg font-bold text-slate-200 flex items-center justify-end">
                          <IndianRupee className="w-4 h-4 mr-0.5" />
                          {order.total}
                        </p>
                      </div>
                    </div>

                    {/* Card Body - Items */}
                    <div className="p-4 bg-slate-900/50">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Order Items</h4>
                      <ul className="space-y-2">
                        {order.items?.map((item, idx) => (
                          <li key={idx} className="flex justify-between items-center text-sm text-slate-300">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="text-slate-500">₹{item.unitPrice}</span>
                          </li>
                        ))}
                        {(!order.items || order.items.length === 0) && (
                          <li className="text-sm text-slate-500 italic">No items listed</li>
                        )}
                      </ul>
                    </div>

                    {/* Card Footer - Actions */}
                    <div className="p-4 border-t border-slate-800/50 bg-slate-950/50">
                      {order.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusUpdate(order._id, 'ACCEPTED')}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
                          >
                            <Check className="w-4 h-4" /> Accept
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(order._id, 'REJECTED')}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 text-sm font-bold rounded-lg transition-colors border border-slate-700"
                          >
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      ) : (
                        <div className={`text-center py-2 text-sm font-bold rounded-lg ${
                          order.status === 'ACCEPTED' ? 'text-emerald-400 bg-emerald-900/20' : 'text-rose-400 bg-rose-900/20'
                        }`}>
                          {order.status}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
