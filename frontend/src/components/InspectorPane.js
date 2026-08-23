import React from 'react';
import { Activity, ShieldCheck, Database, Zap, CreditCard, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InspectorPane({ traceState, spendLimit }) {
  const steps = [
    { id: 1, label: 'Intent Extraction', icon: Activity },
    { id: 2, label: 'Inventory Verification', icon: Database },
    { id: 3, label: 'Margin Optimization', icon: Zap },
    { id: 4, label: 'Guardrail & Limit Check', icon: ShieldCheck },
    { id: 5, label: 'Payment Gateway Payload', icon: CreditCard },
  ];

  const currentStep = traceState?.trace?.step || 0;
  const isBlocked = traceState?.status === 'HITL_TRIGGERED';

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          Live Agent Inspector
        </h2>
        <span className="flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
        </span>
      </div>

      {/* Live State Machine Stepper */}
      <div className="mb-8">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Execution Pipeline</h3>
        <div className="space-y-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isPast = currentStep > step.id;
            const isError = isBlocked && currentStep === step.id;

            let bgColor = 'bg-slate-900';
            let borderColor = 'border-slate-800';
            let iconColor = 'text-slate-600';
            let textColor = 'text-slate-500';

            if (isActive) {
              bgColor = isError ? 'bg-rose-900/20' : 'bg-indigo-900/20';
              borderColor = isError ? 'border-rose-500/50' : 'border-indigo-500/50';
              iconColor = isError ? 'text-rose-400' : 'text-indigo-400';
              textColor = isError ? 'text-rose-200' : 'text-indigo-200';
            } else if (isPast || (currentStep === 0 && traceState)) { // If trace is fully complete (hacky assumption based on mock)
               bgColor = 'bg-emerald-900/10';
               borderColor = 'border-emerald-500/30';
               iconColor = 'text-emerald-500';
               textColor = 'text-slate-300';
            }

            return (
              <div key={step.id} className="relative flex items-center gap-4">
                {/* Connecting Line */}
                {i < steps.length - 1 && (
                  <div className={`absolute left-[19px] top-10 bottom-[-16px] w-[2px] ${isPast ? 'bg-emerald-500/30' : 'bg-slate-800'}`} />
                )}

                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${borderColor} ${bgColor} z-10 bg-slate-950`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <div className={`flex-1 p-3 rounded-lg border ${borderColor} ${bgColor} transition-colors`}>
                  <p className={`text-sm font-medium ${textColor}`}>{step.label}</p>
                  {isActive && traceState?.trace?.agentStep && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" /> {traceState.trace.agentStep}
                    </motion.p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Circuit Breaker Status Box */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Circuit Breaker</h3>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">Calculated Total</span>
            <span className="text-sm font-mono text-slate-200">₹{traceState?.calculatedTotal || 0}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-slate-400">Dynamic Limit</span>
            <span className="text-sm font-mono text-slate-200">₹{spendLimit}</span>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
             {traceState && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((traceState.calculatedTotal / spendLimit) * 100, 100)}%` }}
                  className={`h-full ${isBlocked ? 'bg-rose-500' : 'bg-emerald-500'}`}
                />
             )}
          </div>
          <div className="mt-2 text-right">
             <span className={`text-xs font-bold ${isBlocked ? 'text-rose-500' : 'text-emerald-500'}`}>
               {traceState ? (isBlocked ? 'LIMIT EXCEEDED — PAUSED' : 'WITHIN LIMIT — SECURE') : 'WAITING FOR METRICS'}
             </span>
          </div>
        </div>
      </div>

      {/* JSON Trace Viewer */}
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Live Trace Payload</h3>
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-auto font-mono text-xs text-slate-300">
          {traceState ? (
            <pre className="whitespace-pre-wrap">{JSON.stringify(traceState, null, 2)}</pre>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-600 italic">
              Awaiting agent execution...
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
