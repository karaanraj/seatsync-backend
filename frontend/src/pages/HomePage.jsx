import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ArrowRight, ShieldCheck, Zap, Database, Cpu, Users, ChevronRight, Star } from 'lucide-react';
import { LiveRaceSimulator } from '../components/concurrency/LiveRaceSimulator';
import { api } from '../services/api';

export const HomePage = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getEvents()
      .then((res) => {
        setFeaturedEvents(res.data.events.slice(0, 3));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Subtle background glow */}
        <div className="absolute inset-0 -top-20 flex items-center justify-center -z-10 pointer-events-none">
          <div className="w-[500px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full" />
          <div className="w-[400px] h-[300px] bg-teal-500/10 blur-[140px] rounded-full translate-x-32" />
        </div>

        {/* Tagline Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-6 backdrop-blur-md">
          <Zap className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
          <span>High-Concurrency Booking Architecture</span>
          <span className="text-slate-500">•</span>
          <span className="font-mono text-[11px]">One seat. One winner.</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
          Book your seat.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
            Before someone else does.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          SeatSync keeps every booking synchronized, even when thousands of users compete for the exact same seat simultaneously. Zero double-bookings. Guaranteed.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/events"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-sm transition-all shadow-xl shadow-cyan-500/25 flex items-center justify-center space-x-2"
          >
            <span>Explore Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/engineering"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-sm border border-slate-700 transition flex items-center justify-center space-x-2"
          >
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>How SeatSync Works</span>
          </Link>
        </div>

        {/* Concurrency Live Simulator Widget */}
        <div className="mt-14 max-w-4xl mx-auto text-left">
          <div className="text-center mb-3">
            <span className="text-xs uppercase font-mono tracking-widest text-slate-400 font-semibold">
              Live Interactive Proof-of-Work
            </span>
          </div>
          <LiveRaceSimulator compact={false} />
        </div>
      </section>

      {/* Engineering Value Proposition */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Engineered for Extreme Booking Concurrency
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
            Traditional booking architectures suffer from race conditions and inconsistent inventory states. SeatSync implements defense-in-depth concurrency controls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-[#0e1422] border border-slate-800/80 space-y-4 hover:border-cyan-500/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">PostgreSQL Row Locks</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Uses <code className="text-cyan-400">SELECT ... FOR UPDATE</code> within atomic transactions to serialize concurrent checkouts and mathematically prevent double-bookings.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-[#0e1422] border border-slate-800/80 space-y-4 hover:border-amber-500/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">Redis TTL Seat Holds</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Atomic <code className="text-amber-400">SET NX EX 600</code> creates a temporary 10-minute hold. Locks automatically expire server-side if user abandons checkout.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-[#0e1422] border border-slate-800/80 space-y-4 hover:border-emerald-500/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">Idempotent Endpoints</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Requests carrying an <code className="text-emerald-400">Idempotency-Key</code> header return identical cached results on retries, preventing duplicate bookings.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-[#0e1422] border border-slate-800/80 space-y-4 hover:border-purple-500/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white">Queued Notifications</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Booking confirmations and ticket generation run asynchronously in a background worker queue, freeing the API from blocking latency.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Trending Events & Movies</h2>
            <p className="text-xs text-slate-400 mt-1">High-demand shows with live seating availability</p>
          </div>
          <Link
            to="/events"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredEvents.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="group rounded-2xl bg-[#0e1422] border border-slate-800 overflow-hidden hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10 transition flex flex-col"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                <img
                  src={event.poster_url}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-semibold text-cyan-300 uppercase tracking-wider">
                  {event.category}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition">
                    {event.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {event.venue_name}, {event.location}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    From <span className="text-white font-mono font-bold text-sm">₹{event.starting_price}</span>
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 font-semibold group-hover:bg-cyan-400 group-hover:text-black transition">
                    Select Seats
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
