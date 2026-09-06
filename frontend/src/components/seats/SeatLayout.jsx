import React from 'react';
import { SeatItem } from './SeatItem';

export const SeatLayout = ({ seats = [], selectedSeats = [], onToggleSeat, disabled }) => {
  // Group seats by row_label
  const rowsMap = seats.reduce((acc, seat) => {
    if (!acc[seat.row_label]) {
      acc[seat.row_label] = [];
    }
    acc[seat.row_label].push(seat);
    return acc;
  }, {});

  const rowLabels = Object.keys(rowsMap).sort();

  return (
    <div className="w-full flex flex-col items-center select-none py-6">
      {/* Cinema Screen Curved Projection */}
      <div className="w-full max-w-2xl px-6 mb-12 text-center">
        <div className="cinema-screen w-full mb-3"></div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 font-bold">All eyes this way • Screen</p>
      </div>

      {/* Seat Rows */}
      <div className="flex flex-col items-center space-y-2.5 overflow-x-auto max-w-full pb-4 px-2">
        {rowLabels.map((rowLabel) => {
          const rowSeats = rowsMap[rowLabel].sort((a, b) => a.seat_col - b.seat_col);
          const sampleSeat = rowSeats[0];

          return (
            <div key={rowLabel} className="flex items-center space-x-1 sm:space-x-3">
              {/* Left Row Indicator */}
              <span className="w-5 text-center text-xs font-mono font-bold text-slate-500">
                {rowLabel}
              </span>

              {/* Seats in this row */}
              <div className="flex items-center">
                {rowSeats.slice(0, 5).map((seat) => (
                  <SeatItem
                    key={seat.id}
                    seat={seat}
                    isSelected={selectedSeats.some((s) => s.id === seat.id)}
                    onToggle={onToggleSeat}
                    disabled={disabled}
                  />
                ))}

                {/* Cinema Aisle walkway gap */}
                <div className="w-4 sm:w-8" />

                {rowSeats.slice(5).map((seat) => (
                  <SeatItem
                    key={seat.id}
                    seat={seat}
                    isSelected={selectedSeats.some((s) => s.id === seat.id)}
                    onToggle={onToggleSeat}
                    disabled={disabled}
                  />
                ))}
              </div>

              {/* Right Row Indicator */}
              <span className="w-5 text-center text-xs font-mono font-bold text-slate-500">
                {rowLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
