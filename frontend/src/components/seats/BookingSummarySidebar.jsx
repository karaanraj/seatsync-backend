import React from 'react';
import { Ticket, ShieldCheck, AlertCircle, ArrowRight, Lock } from 'lucide-react';
import { LockTimer } from './LockTimer';

export const BookingSummarySidebar = ({
  selectedSeats = [],
  lockExpirySeconds = null,
  onProceed,
  onExpireLock,
  loading = false,
}) => {
  const count = selectedSeats.length;
  const subtotal = selectedSeats.reduce((sum, s) => sum + Number(s.price), 0);
  const convenienceFee = count > 0 ? Math.round(subtotal * 0.05) : 0;
  const taxes = count > 0 ? Math.round((subtotal + convenienceFee) * 0.18) : 0;
  const total = subtotal + convenienceFee + taxes;

  return (
    <div className="bg-[#0e1422] rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Ticket className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Booking Summary</h3>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 bg-slate-800 text-cyan-400 rounded-lg font-semibold">
            {count} / 6 Seats
          </span>
        </div>

        {/* Lock Timer Banner */}
        {lockExpirySeconds && lockExpirySeconds > 0 && count > 0 && (
          <div className="mb-4 flex justify-center">
            <LockTimer initialSeconds={lockExpirySeconds} onExpire={onExpireLock} />
          </div>
        )}

        {/* Selected Seats Badges */}
        {count === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <p>Click on available seats on the map to select up to 6 seats.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-400 block mb-2 font-medium">Selected Seats:</span>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((seat) => (
                  <span
                    key={seat.id}
                    className="px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold"
                  >
                    {seat.seat_number} ({seat.category[0]})
                  </span>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 pt-4 border-t border-slate-800/80 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Tickets Subtotal</span>
                <span className="font-mono text-slate-200">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Convenience Fee (5%)</span>
                <span className="font-mono text-slate-200">₹{convenienceFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Integrated Taxes (18% GST)</span>
                <span className="font-mono text-slate-200">₹{taxes.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Total & Checkout */}
      <div className="pt-6 mt-6 border-t border-slate-800">
        <div className="flex justify-between items-baseline mb-4">
          <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Total Payable</span>
          <span className="text-2xl font-extrabold text-white font-mono">₹{total.toLocaleString()}</span>
        </div>

        <button
          onClick={onProceed}
          disabled={count === 0 || loading}
          className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-black font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <span>Securing Seat Lock...</span>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="mt-3 flex items-center justify-center space-x-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>PostgreSQL Row-Lock & Redis TTL Protected</span>
        </div>
      </div>
    </div>
  );
};
