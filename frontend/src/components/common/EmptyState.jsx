import React from 'react';
import { Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmptyState = ({
  icon: Icon = Ticket,
  title = 'No items found',
  description = 'There are currently no items matching your criteria.',
  actionText = null,
  actionLink = null,
  onAction = null,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-slate-900/40 rounded-2xl border border-slate-800/80 my-8">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-4 text-cyan-400">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold transition shadow-lg shadow-cyan-500/20"
        >
          {actionText}
        </Link>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold transition shadow-lg shadow-cyan-500/20"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
