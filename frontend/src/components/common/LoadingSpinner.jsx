import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-3">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} text-cyan-400 animate-spin`} />
      <span className="text-sm font-medium text-slate-400">{text}</span>
    </div>
  );
};
