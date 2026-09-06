import React from 'react';

export const SeatItem = ({ seat, isSelected, onToggle, disabled }) => {
  const { seat_number, price, category, lockStatus, isSelectable } = seat;

  const isBooked = lockStatus === 'BOOKED';
  const isHeldByOther = lockStatus === 'LOCKED_BY_OTHER';
  const isHeldByMe = lockStatus === 'LOCKED_BY_CURRENT_USER';

  const handleClick = () => {
    if (disabled || isBooked || isHeldByOther) return;
    onToggle(seat);
  };

  // Compute visual appearance
  let stateClasses = 'bg-slate-800/80 border-slate-600/80 text-slate-300 hover:border-cyan-400 hover:bg-slate-700/80 cursor-pointer';

  if (isSelected) {
    stateClasses = 'bg-cyan-500 border-cyan-300 text-black font-bold shadow-lg shadow-cyan-500/30 scale-105 ring-2 ring-cyan-400/40 cursor-pointer';
  } else if (isHeldByMe) {
    stateClasses = 'bg-amber-500/40 border-amber-400 text-amber-200 font-semibold ring-2 ring-amber-400/50 animate-pulse cursor-pointer';
  } else if (isHeldByOther) {
    stateClasses = 'bg-rose-950/40 border-rose-900/60 text-rose-500/40 cursor-not-allowed opacity-60';
  } else if (isBooked) {
    stateClasses = 'bg-slate-950 border-slate-900 text-slate-700 cursor-not-allowed opacity-40';
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isBooked || isHeldByOther}
      aria-label={`Seat ${seat_number}, ${category}, ₹${price}, Status: ${lockStatus}`}
      title={`${seat_number} - ₹${price} (${category}) [${lockStatus.replace(/_/g, ' ')}]`}
      className={`relative w-8 h-8 sm:w-9 sm:h-9 m-0.5 sm:m-1 rounded-lg border text-[11px] font-mono flex items-center justify-center transition-all duration-150 select-none ${stateClasses}`}
    >
      <span>{seat_number}</span>
      {isHeldByOther && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#090d16]" />
      )}
    </button>
  );
};
