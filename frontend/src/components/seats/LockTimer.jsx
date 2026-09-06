import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export const LockTimer = ({ initialSeconds = 600, onExpire }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);

  useEffect(() => {
    setSecondsRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, onExpire]);

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isUrgent = secondsRemaining < 120; // less than 2 minutes

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-mono font-semibold transition-all shadow-md ${
        isUrgent
          ? 'bg-rose-950/70 border-rose-500/60 text-rose-300 animate-pulse'
          : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
      }`}
    >
      {isUrgent ? <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> : <Clock className="w-3.5 h-3.5 text-amber-400" />}
      <span>Seats Held:</span>
      <span className="font-bold tracking-wider">{formatTime(secondsRemaining)}</span>
    </div>
  );
};
