import React from 'react';
import { Ticket, Database, Cpu, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="w-full bg-[#05080f] border-t border-slate-800/80 text-slate-400 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center">
                <Ticket className="w-4 h-4 text-black font-bold rotate-[-15deg]" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">SeatSync</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-concurrency ticket booking engine designed to eliminate double bookings and race conditions via PostgreSQL row locking (<code className="text-cyan-400">SELECT FOR UPDATE</code>) and Redis TTL seat reservations.
            </p>
            <div className="flex items-center space-x-2 text-xs text-cyan-400/90 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Backend Concurrency Guard: ACTIVE</span>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/events" className="hover:text-cyan-400 transition">Movies & Concerts</Link></li>
              <li><Link to="/my-bookings" className="hover:text-cyan-400 transition">Booking History</Link></li>
              <li><Link to="/engineering" className="text-amber-400 hover:text-amber-300 transition flex items-center gap-1">Concurrency Race Lab</Link></li>
              <li><a href="http://localhost:5000/api/docs" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition">Swagger API Docs</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Architecture</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-cyan-400" /> PostgreSQL Transactions</li>
              <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-amber-400" /> Redis TTL Seat Locking</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Idempotent API Keys</li>
              <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-purple-400" /> BullMQ Asynchronous Queues</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Demonstration</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Recruiter & engineering portfolio showcase for distributed systems and concurrent database design.
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className="text-slate-500">TAGLINE:</span><br />
              &ldquo;One seat. One winner.&rdquo;
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} SeatSync Engine. All rights reserved.</p>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <span className="text-slate-400">Production-Style Engineering Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
