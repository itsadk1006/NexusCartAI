"use client";

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChefHat, User, Store, ArrowRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState('buyer'); // 'buyer' or 'merchant'
  const [username, setUsername] = useState('buyer');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleToggle = (selectedRole) => {
    setRole(selectedRole);
    setUsername(selectedRole);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
    });

    setLoading(false);

    if (res?.error) {
      setError('Invalid credentials');
    } else {
      if (role === 'merchant') {
        router.push('/merchant/dashboard');
      } else {
        router.push('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100">

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col items-center gap-3"
      >
        <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/20">
          <ChefHat className="text-emerald-400 w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">NexusCart AI</h1>
        <p className="text-slate-400 text-sm tracking-wide">Agentic Commerce Gateway</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8"
      >
        <div className="flex bg-slate-950 rounded-lg p-1 mb-8 border border-slate-800">
          <button
            onClick={() => handleRoleToggle('buyer')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-md transition-all ${
              role === 'buyer'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <User className="w-4 h-4" />
            Customer
          </button>
          <button
            onClick={() => handleRoleToggle('merchant')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-md transition-all ${
              role === 'merchant'
                ? 'bg-slate-800 text-indigo-400 shadow-sm border border-slate-700'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Store className="w-4 h-4" />
            Merchant
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-colors"
                placeholder="buyer or merchant"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 text-right">Use &apos;password&apos; for demo</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-900/20 border border-rose-500/30 text-rose-400 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
              role === 'merchant'
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Authenticating...' : `Sign In as ${role === 'buyer' ? 'Customer' : 'Merchant'}`}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </motion.div>

      <div className="mt-8 text-center text-slate-500 text-xs flex gap-4">
        <span>Protected by Nexus Auth</span>
        <span>•</span>
        <span>Secure Gateway</span>
      </div>
    </div>
  );
}
