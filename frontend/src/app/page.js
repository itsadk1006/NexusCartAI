"use client";

import React, { useState } from 'react';
import { ChefHat, Settings, LogIn, Store, LogOut } from 'lucide-react';
import ChatPane from '../components/ChatPane';
import InspectorPane from '../components/InspectorPane';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  const { data: session } = useSession();
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

            <div className="ml-2 flex items-center gap-2 border-l border-slate-700 pl-4">
              {session ? (
                <>
                  <div className="text-xs text-slate-300 mr-2 flex flex-col items-end">
                    <span>{session.user.name}</span>
                    <span className="text-[10px] text-emerald-400 capitalize">{session.user.role}</span>
                  </div>
                  {session.user.role === 'merchant' && (
                    <Link href="/merchant/dashboard" className="p-1.5 text-slate-300 hover:text-indigo-400 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors">
                      <Store className="w-4 h-4" />
                    </Link>
                  )}
                  <button onClick={() => signOut()} className="p-1.5 text-slate-300 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <Link href="/login" className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              )}
            </div>

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
