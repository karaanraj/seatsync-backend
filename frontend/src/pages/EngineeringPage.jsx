import React, { useState } from 'react';
import { Database, Cpu, ShieldCheck, Zap, Server, CheckCircle2, XCircle, Code2, Layers, GitFork } from 'lucide-react';
import { LiveRaceSimulator } from '../components/concurrency/LiveRaceSimulator';

export const EngineeringPage = () => {
  const [activeTab, setActiveTab] = useState('ROW_LOCKING');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold">
          <Zap className="w-3.5 h-3.5 fill-amber-400/20" />
          <span>Distributed Systems & High Concurrency</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          How SeatSync Prevents Race Conditions
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          When thousands of users click &ldquo;Book Seat A10&rdquo; at the exact same millisecond, standard database patterns fail. SeatSync guarantees <span className="text-cyan-400 font-semibold">one seat, one winner</span> using two-phase distributed concurrency controls.
        </p>
      </div>

      {/* Interactive Arena */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <span>Interactive Live Simulation</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">Hits live Express & Redis endpoints</span>
        </div>
        <LiveRaceSimulator />
      </section>

      {/* Architectural Diagram */}
      <section className="p-8 rounded-3xl bg-[#0e1422] border border-slate-800 space-y-8 shadow-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Two-Phase Concurrency Architecture</h2>
          <p className="text-xs text-slate-400 mt-1">Multi-layered defense against database lock contention and race conditions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Phase 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-amber-500/30 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold font-mono text-xs">
                01
              </div>
              <h3 className="font-bold text-white text-sm">Phase 1: Redis Distributed Temporary Locks</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              When a user clicks a seat on the map, the backend executes an atomic Redis command:
            </p>
            <pre className="p-3 rounded-xl bg-black/60 border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto">
              SET seat-lock:show123:A10 user_abc NX EX 600
            </pre>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-amber-400">▸</span>
                <span><strong>NX (Not eXists)</strong>: Operation only succeeds if no one else holds the key.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">▸</span>
                <span><strong>EX 600 (TTL)</strong>: Seat automatically expires after 10 minutes if user abandons the tab.</span>
              </li>
            </ul>
          </div>

          {/* Phase 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-xs">
                02
              </div>
              <h3 className="font-bold text-white text-sm">Phase 2: PostgreSQL Row-Level Serialized Checkout</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              During final checkout, PostgreSQL starts an ACID transaction with pessimistic row-locking:
            </p>
            <pre className="p-3 rounded-xl bg-black/60 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
              BEGIN;<br />
              SELECT * FROM seats WHERE id = $1 FOR UPDATE;<br />
              -- Verify status == AVAILABLE<br />
              INSERT INTO bookings (...);<br />
              COMMIT;
            </pre>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">▸</span>
                <span><strong>FOR UPDATE</strong>: Locks the specific database row against concurrent writes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">▸</span>
                <span><strong>Transactional Isolation</strong>: Competing checkouts wait or fail safely.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Deep-Dive Tabs */}
      <section className="space-y-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
          {[
            { id: 'ROW_LOCKING', label: 'PostgreSQL Row Locking', icon: Database },
            { id: 'REDIS_TTL', label: 'Redis Distributed Locks', icon: Cpu },
            { id: 'IDEMPOTENCY', label: 'API Idempotency Keys', icon: ShieldCheck },
            { id: 'STATE_MACHINE', label: 'Booking State Machine', icon: GitFork },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === t.id
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                    : 'bg-[#0e1422] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-8 rounded-3xl bg-[#0e1422] border border-slate-800 text-xs leading-relaxed space-y-4">
          {activeTab === 'ROW_LOCKING' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Why Pessimistic Locking with SELECT FOR UPDATE?</h3>
              <p className="text-slate-300">
                In high-traffic flash-sales (e.g. Coldplay tickets or movie premieres), hundreds of booking requests hit the exact same seat concurrently. Optimistic locking (<code className="text-cyan-400">WHERE version = x</code>) causes massive transaction abort and retry storms, overwhelming database connections.
              </p>
              <p className="text-slate-300">
                Pessimistic row-locking (<code className="text-cyan-400">SELECT ... FOR UPDATE</code>) locks only the seat rows involved in the transaction without locking the entire table, ensuring instant serialized evaluation with zero possibility of double booking.
              </p>
            </div>
          )}

          {activeTab === 'REDIS_TTL' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Temporary Reservation with Automatic Expiry</h3>
              <p className="text-slate-300">
                A common booking bug is holding seats indefinitely in frontend browser state. If a user closes the browser or loses connectivity, seats stay locked.
              </p>
              <p className="text-slate-300">
                SeatSync uses Redis TTL keys (<code className="text-amber-400">seat-lock:showId:seatId</code>) with an exact 600-second expiration. When the timer elapses, the key vanishes automatically from memory, releasing the seat back to the global pool without requiring manual database cleanup cron jobs.
              </p>
            </div>
          )}

          {activeTab === 'IDEMPOTENCY' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Preventing Double-Billing and Duplicate Bookings</h3>
              <p className="text-slate-300">
                When a user double-clicks the &ldquo;Pay&rdquo; button or experiences mobile network drops during checkout, HTTP retries can trigger duplicate booking records and double charges.
              </p>
              <p className="text-slate-300">
                SeatSync supports the <code className="text-emerald-400">Idempotency-Key</code> header. Every checkout generates a cryptographic UUID. Subsequent requests bearing the same key are caught by the middleware and return the original confirmed response directly from cache without hitting the booking transaction again.
              </p>
            </div>
          )}

          {activeTab === 'STATE_MACHINE' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Strict Booking Lifecycle Transitions</h3>
              <p className="text-slate-300">
                The booking lifecycle enforces deterministic state transitions:
              </p>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-slate-300 flex flex-wrap items-center gap-3">
                <span className="text-amber-400 font-bold">SEAT_LOCKED</span>
                <span>→</span>
                <span className="text-cyan-400 font-bold">BOOKING_PENDING</span>
                <span>→</span>
                <span className="text-emerald-400 font-bold">PAYMENT_SUCCESS / CONFIRMED</span>
              </div>
              <p className="text-slate-300">
                Illegal transitions (e.g. attempting to pay for an <code className="text-rose-400">EXPIRED</code> or <code className="text-rose-400">CANCELLED</code> booking) are rejected by centralized domain validators.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
