import React, { useState } from 'react';
import { Play, RotateCcw, CheckCircle2, XCircle, ShieldCheck, Cpu, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export const LiveRaceSimulator = ({ compact = false }) => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  const runSimulation = async () => {
    setRunning(true);
    setResult(null);
    setActiveStep(1); // Firing requests

    try {
      // Small artificial delay so the UI animation is visually perceptible
      await new Promise((r) => setTimeout(r, 400));
      setActiveStep(2); // In-flight race in DB

      const res = await api.simulateRaceCondition(null, 'A10');
      await new Promise((r) => setTimeout(r, 400));
      setActiveStep(3); // Result processed
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={`w-full rounded-2xl bg-[#0b101d] border border-slate-800/90 shadow-2xl p-6 ${compact ? 'max-w-2xl mx-auto' : ''}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5 fill-amber-400/20" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">SeatSync Concurrency Arena</h3>
            <p className="text-xs text-slate-400">Target: <span className="font-mono text-cyan-400 font-bold">Seat A10</span> • 3 Simultaneous Booking Requests</p>
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={running}
          className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-black font-bold text-xs transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
        >
          {running ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Competing in Parallel...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Trigger Race Condition</span>
            </>
          )}
        </button>
      </div>

      {/* Visual Simulation Track */}
      <div className="space-y-4">
        {/* The 3 Virtual Users */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { id: 1, name: 'Alice (Client 1)', color: 'emerald' },
            { id: 2, name: 'Bob (Client 2)', color: 'amber' },
            { id: 3, name: 'Charlie (Client 3)', color: 'rose' },
          ].map((client, idx) => {
            const competitorResult = result?.competitors?.[idx];
            const isWinner = competitorResult?.result === 'SUCCESS';
            const isRejected = competitorResult?.result === 'REJECTED';

            return (
              <div
                key={client.id}
                className={`p-4 rounded-xl border transition-all duration-300 ${
                  isWinner
                    ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500'
                    : isRejected
                    ? 'bg-slate-900/80 border-slate-800 text-slate-400'
                    : running
                    ? 'bg-slate-900/80 border-amber-500/40 animate-pulse'
                    : 'bg-slate-900/50 border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isWinner ? 'bg-emerald-400 animate-ping' : isRejected ? 'bg-rose-500' : 'bg-cyan-400'
                      }`}
                    />
                    <span className="font-semibold text-xs text-white">{client.name}</span>
                  </div>
                  {competitorResult && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        isWinner
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      HTTP {competitorResult.status}
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Action:</span>
                  <span className="text-slate-200">POST /lock (Seat A10)</span>
                </div>

                {competitorResult ? (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-xs">
                    {isWinner ? (
                      <div className="flex items-center text-emerald-400 font-semibold space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Winner! Lock Acquired (10m TTL)</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-rose-400/90 font-medium space-x-1.5 text-[11px]">
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>409 Conflict: Seat Held</span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      Latency: {competitorResult.latencyMs}ms
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 pt-2 text-[11px] text-slate-500 italic">
                    {running ? 'Submitting concurrent transaction...' : 'Ready to fire request'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Distributed Backend Pipeline Visual */}
        {result && (
          <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800/80 pb-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Backend Execution Verification</span>
              </div>
              <span className="font-mono text-emerald-400">
                Guaranteed: {result.summary.successfulBookings} Winner, {result.summary.rejectedCollisions} Safely Rejected
              </span>
            </div>

            <div className="font-mono text-[11px] text-slate-400 space-y-1">
              {result.engineeringLog?.map((log, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <span className="text-cyan-500 shrink-0">▸</span>
                  <span className={i === result.engineeringLog.length - 1 ? 'text-emerald-400 font-bold' : ''}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
