import React from 'react';

export const SeatLegend = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-4 px-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 text-xs font-medium">
      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded-md border border-slate-600 bg-slate-800/80 flex items-center justify-center text-[10px] text-slate-400">
          A
        </span>
        <span className="text-slate-300">Available</span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded-md bg-cyan-500 border border-cyan-400 shadow-md shadow-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-black">
          S
        </span>
        <span className="text-slate-300">Selected</span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded-md bg-amber-500/30 border border-amber-400/70 animate-pulse flex items-center justify-center text-[10px] font-bold text-amber-300">
          ⏳
        </span>
        <span className="text-amber-300">Held by You (Timer)</span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded-md bg-rose-950/40 border border-rose-900/50 flex items-center justify-center text-[10px] text-rose-500/50 cursor-not-allowed">
          ✕
        </span>
        <span className="text-slate-400">Held by Other</span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="w-5 h-5 rounded-md bg-slate-950 border border-slate-800/60 flex items-center justify-center text-[10px] text-slate-600 cursor-not-allowed">
          ✕
        </span>
        <span className="text-slate-500">Booked</span>
      </div>
    </div>
  );
};
