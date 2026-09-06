import React, { useState } from 'react';
import { Shield, CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

export const PaymentSimulationModal = ({ isOpen, onClose, booking, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState('SUCCESS');

  if (!isOpen || !booking) return null;

  const handlePay = async () => {
    setLoading(true);
    try {
      await onComplete(selectedOutcome);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0e1422] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Simulated Payment Gateway</h3>
              <span className="text-xs text-slate-400 font-mono">SeatSync Sandbox Sandbox v1.0</span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Order Details */}
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-2 text-sm">
          <div className="flex justify-between text-slate-400 text-xs">
            <span>Booking Reference:</span>
            <span className="font-mono text-cyan-400 font-semibold">{booking.bookingId || booking.id}</span>
          </div>
          <div className="flex justify-between text-slate-400 text-xs">
            <span>Payable Amount:</span>
            <span className="font-mono text-white text-base font-bold">
              ₹{(booking.priceBreakdown?.totalAmount || booking.total_amount || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Simulation Selector */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Select Test Outcome:
          </span>

          <div className="grid grid-cols-1 gap-2.5">
            <label
              onClick={() => setSelectedOutcome('SUCCESS')}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                selectedOutcome === 'SUCCESS'
                  ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-200 ring-1 ring-emerald-500/50'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="font-semibold text-xs">Payment Success (200 OK)</div>
                  <div className="text-[11px] text-slate-400">Atomically confirms booking & marks seats BOOKED</div>
                </div>
              </div>
              <input
                type="radio"
                name="outcome"
                checked={selectedOutcome === 'SUCCESS'}
                onChange={() => setSelectedOutcome('SUCCESS')}
                className="accent-emerald-500"
              />
            </label>

            <label
              onClick={() => setSelectedOutcome('FAILED')}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                selectedOutcome === 'FAILED'
                  ? 'bg-rose-950/40 border-rose-500/70 text-rose-200 ring-1 ring-rose-500/50'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <XCircle className="w-5 h-5 text-rose-400" />
                <div>
                  <div className="font-semibold text-xs">Payment Declined / Failure</div>
                  <div className="text-[11px] text-slate-400">Releases temporary Redis seat locks for others</div>
                </div>
              </div>
              <input
                type="radio"
                name="outcome"
                checked={selectedOutcome === 'FAILED'}
                onChange={() => setSelectedOutcome('FAILED')}
                className="accent-rose-500"
              />
            </label>

            <label
              onClick={() => setSelectedOutcome('TIMEOUT')}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                selectedOutcome === 'TIMEOUT'
                  ? 'bg-amber-950/40 border-amber-500/70 text-amber-200 ring-1 ring-amber-500/50'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="font-semibold text-xs">Gateway Timeout</div>
                  <div className="text-[11px] text-slate-400">Simulates session expiry & rollback</div>
                </div>
              </div>
              <input
                type="radio"
                name="outcome"
                checked={selectedOutcome === 'TIMEOUT'}
                onChange={() => setSelectedOutcome('TIMEOUT')}
                className="accent-amber-500"
              />
            </label>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>Simulating Transaction...</span>
            </>
          ) : (
            <span>Authorize Simulated Payment</span>
          )}
        </button>
      </div>
    </div>
  );
};
