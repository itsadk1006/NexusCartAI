"use client";

import React, { useState } from 'react';
import { ChefHat, Settings } from 'lucide-react';
import ChatPane from '../components/ChatPane';
import InspectorPane from '../components/InspectorPane';

export default function Home() {
  const [spendLimit, setSpendLimit] = useState(2000);
  const [mode, setMode] = useState('Human Chat Mode'); // 'Human Chat Mode' or 'AI Buyer Protocol Tester'
  const [traceState, setTraceState] = useState(null);
  const [sessionId] = useState(`session-${Math.random().toString(36).substring(7)}`);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <ChefHat className="text-emerald-400 w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tight text-white">ChefCart AI <span className="text-sm font-normal text-slate-400 ml-2">— Context-Aware Agentic Commerce</span></h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-300">Spend Limit: ₹{spendLimit}</label>
            <input
              type="range"
              min="500"
              max="10000"
              step="100"
              value={spendLimit}
              onChange={(e) => setSpendLimit(Number(e.target.value))}
              className="accent-emerald-500 w-32"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">Status: Ready</span>
            <span className="px-2 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">Agent Protocol: UAP v1.0</span>

            <button
              onClick={() => setMode(mode === 'Human Chat Mode' ? 'AI Buyer Protocol Tester' : 'Human Chat Mode')}
              className="ml-2 flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
            >
              <Settings className="w-4 h-4" />
              {mode}
            </button>
          </div>
        </div>
      </header>

      {/* Main Dual-Pane Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Pane: Chat (55%) */}
        <section className="w-[55%] border-r border-slate-700 flex flex-col bg-slate-900">
          <ChatPane sessionId={sessionId} spendLimit={spendLimit} onTraceUpdate={setTraceState} />
        </section>

        {/* Right Pane: Inspector (45%) */}
        <section className="w-[45%] flex flex-col bg-slate-950">
          <InspectorPane traceState={traceState} spendLimit={spendLimit} />
        </section>
      </main>
    </div>
  );
}
