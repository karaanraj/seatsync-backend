import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Ticket, Zap, Shield, User, LogOut, Calendar, LayoutDashboard } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#090d16]/85 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Ticket className="w-5 h-5 text-black font-bold rotate-[-15deg]" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Seat<span className="text-cyan-400">Sync</span>
              </span>
              <span className="text-[10px] block text-slate-400 uppercase tracking-widest font-semibold -mt-1">
                Zero-Conflict Booking
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive('/') ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Home
            </Link>
            <Link
              to="/events"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive('/events') ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Explore Events
            </Link>
            <Link
              to="/my-bookings"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive('/my-bookings') ? 'text-cyan-400 bg-cyan-950/40' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              My Bookings
            </Link>

            {/* Differentiator Badge: Engineering Concurrency Lab */}
            <Link
              to="/engineering"
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                isActive('/engineering')
                  ? 'text-amber-400 bg-amber-950/40 border border-amber-500/30'
                  : 'text-amber-300/90 hover:text-amber-300 hover:bg-amber-950/30 border border-amber-500/20'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <span>Concurrency Lab</span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                Demo
              </span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                  isActive('/admin')
                    ? 'text-purple-400 bg-purple-950/40 border border-purple-500/30'
                    : 'text-purple-300/90 hover:text-purple-300 hover:bg-purple-950/30 border border-purple-500/20'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-purple-400" />
                <span>Admin</span>
              </Link>
            )}
          </div>

          {/* Right Action: Profile / Auth */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-white">{user?.name}</span>
                  <span className="text-[11px] text-cyan-400 font-mono capitalize">{user?.role}</span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/50 hover:text-rose-400 text-slate-300 border border-slate-700 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-black bg-cyan-400 hover:bg-cyan-300 transition shadow-lg shadow-cyan-500/20"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
