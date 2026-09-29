import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, CheckCircle, AlertTriangle, ShoppingCart, Loader2, CreditCard } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPane({ sessionId, spendLimit, onTraceUpdate }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am ChefCart AI. How can I help you with your groceries or recipes today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textOverride) => {
    const text = textOverride || input;
    if (!text.trim()) return;

    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // API call to our local backend
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: text, spendLimit: spendLimit, sessionId: sessionId })
      });

      const data = await res.json();

      const assistantMsg = {
        role: 'assistant',
        text: data.message,
        bundle: data.bundle,
        upsell: data.upsell,
        calculatedTotal: data.calculatedTotal,
        status: data.status,
        instructions: data.instructions,
        paymentLink: data.paymentLink
      };

      setMessages(prev => [...prev, assistantMsg]);
      onTraceUpdate(data);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error connecting to the server.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async (decision) => {
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/chat/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId, decision })
      });

      const data = await res.json();

      if (res.ok) {
        setMessages(prev => {
          const updated = [...prev];
          let hitlIndex = -1;
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].role === 'assistant' && updated[i].status === 'HITL_TRIGGERED') {
              hitlIndex = i;
              break;
            }
          }

          const finalizedMsg = {
            role: 'assistant',
            text: data.message,
            bundle: data.bundle || (hitlIndex >= 0 ? updated[hitlIndex].bundle : []),
            upsell: data.upsell !== undefined ? data.upsell : (hitlIndex >= 0 ? updated[hitlIndex].upsell : null),
            calculatedTotal: data.calculatedTotal !== undefined ? data.calculatedTotal : (hitlIndex >= 0 ? updated[hitlIndex].calculatedTotal : 0),
            status: data.status,
            instructions: data.instructions || (hitlIndex >= 0 ? updated[hitlIndex].instructions : null),
            paymentLink: data.paymentLink
          };

          if (hitlIndex >= 0) {
            updated[hitlIndex] = finalizedMsg;
          } else {
            updated.push(finalizedMsg);
          }
          return updated;
        });

        if (onTraceUpdate) {
          onTraceUpdate(data);
        }
      } else {
        console.error('Resume error:', data.error);
        setMessages(prev => [...prev, { role: 'assistant', text: `Failed to resume order: ${data.error || 'Server error'}` }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error connecting to the server for resume.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-sm'
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>

              {/* Render Structured Cards if available */}
              {msg.role === 'assistant' && (msg.bundle || msg.instructions) && (
                <div className="mt-3 w-full max-w-[85%] flex flex-col gap-3">

                  {/* Instructions */}
                  {msg.instructions && msg.instructions.length > 0 && (
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Instructions</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
                        {msg.instructions.map((step, i) => (
                          <li key={i} className="leading-relaxed">{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Ingredient Bundle */}
                  {msg.bundle && (
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Ingredient Bundle</h4>
                      <div className="space-y-2">
                        {msg.bundle.map((item, i) => (
                          <div key={i} className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                            <div className="flex items-center gap-2">
                              {item.inStock ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                              <span className="text-sm font-medium">{item.name} <span className="text-slate-500 text-xs">x{item.quantity}</span></span>
                            </div>
                            <span className="text-sm font-mono text-slate-300">₹{item.unitPrice}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upsell Card */}
                  {msg.upsell && (
                    <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-indigo-200">Recommended: <strong>{msg.upsell.name}</strong> (+₹{msg.upsell.price})</span>
                      </div>
                      <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md transition-colors">
                        Add to Cart
                      </button>
                    </div>
                  )}

                  {/* Payment / Status Card */}
                  {msg.status === 'APPROVED' ? (
                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 flex justify-between items-center mt-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <p className="text-xs text-emerald-400 uppercase font-semibold tracking-wider">Total Approved</p>
                        </div>
                        <p className="text-lg font-bold text-emerald-400 font-mono">₹{msg.calculatedTotal}</p>
                      </div>
                      {msg.paymentLink ? (
                        <a
                          href={msg.paymentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-emerald-900/30"
                        >
                          <CreditCard className="w-4 h-4" />
                          Pay with Razorpay
                        </a>
                      ) : (
                        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors">
                          <ShoppingCart className="w-4 h-4" />
                          Proceed to Checkout
                        </button>
                      )}
                    </div>
                  ) : msg.status === 'CANCELLED' ? (
                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                        <div>
                          <p className="text-xs text-rose-400 uppercase font-semibold tracking-wider">Order Cancelled</p>
                          <p className="text-sm text-slate-300">Budget override was declined.</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md">
                        CANCELLED
                      </span>
                    </div>
                  ) : msg.status === 'HITL_TRIGGERED' ? (
                    <div className="bg-rose-900/20 border border-rose-500/30 rounded-xl p-4 flex flex-col gap-3 mt-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                        <h4 className="text-sm font-bold text-rose-400">Limit Exceeded (₹{msg.calculatedTotal} &gt; ₹{spendLimit})</h4>
                      </div>
                      <p className="text-xs text-rose-300/80">Human-In-The-Loop required. Do you want to approve this override?</p>
                      <div className="flex gap-2">
                        <button
                          disabled={loading}
                          onClick={() => handleResume("CONFIRM")}
                          className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          CONFIRM & OVERRIDE
                        </button>
                        <button
                          disabled={loading}
                          onClick={() => handleResume("CANCEL")}
                          className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          CANCEL ORDER
                        </button>
                      </div>
                    </div>
                  ) : null}

                </div>
              )}
            </motion.div>
          ))}
          {loading && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start">
               <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                 <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                 <span className="text-sm text-slate-400">Agent is thinking...</span>
               </div>
             </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-700">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your request here..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none h-[52px]"
            rows={1}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 p-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
