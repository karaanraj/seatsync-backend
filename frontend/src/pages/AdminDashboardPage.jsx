import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Film,
  Ticket,
  DollarSign,
  Lock,
  AlertCircle,
  TrendingUp,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [bookingsData, setBookingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: 'Movies',
    location: 'Mumbai',
    venue_name: '',
    duration_mins: 120,
    poster_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
  });

  const toast = useToast();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminBookings(page, 10, statusFilter),
      ]);
      setStats(statsRes.data);
      setBookingsData(bookingsRes.data);
    } catch (err) {
      toast.error('Failed to load admin metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [page, statusFilter]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.createEvent(eventForm);
      toast.success('Event published successfully!');
      setIsEventModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message || 'Failed to create event');
    }
  };

  if (loading && !stats) {
    return <LoadingSpinner text="Loading Executive Admin Dashboard..." />;
  }

  const metrics = stats?.metrics || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold uppercase">
              Superadmin Control Plane
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">Platform Analytics</h1>
          <p className="text-xs text-slate-400">Real-time concurrency monitoring and booking operations telemetry</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsEventModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>

          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl bg-[#0e1422] border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Users</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">{metrics.totalUsers || 0}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Events</span>
            <Film className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">{metrics.totalEvents || 0}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Shows</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">{metrics.totalShows || 0}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Bookings</span>
            <Ticket className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">{metrics.totalBookings || 0}</div>
        </div>
      </div>

      {/* Metrics Row 2: Concurrency & Financial Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            ₹{(metrics.totalRevenue || 0).toLocaleString()}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Today's Bookings</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">{metrics.todaysBookings || 0}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Redis Seat Holds</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">{metrics.activeSeatLocks || 0}</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Overall Occupancy</span>
            <span className="text-xs font-mono font-bold text-white">{metrics.occupancyRate || 0}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden mt-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-teal-400 h-2.5 rounded-full"
              style={{ width: `${metrics.occupancyRate || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Bookings Telemetry Table */}
      <div className="rounded-3xl bg-[#0e1422] border border-slate-800 p-6 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Recent Bookings Stream</h2>
            <p className="text-xs text-slate-400">Audited transaction ledger</p>
          </div>

          <div className="flex items-center space-x-2">
            {['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED', 'FAILED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  statusFilter === s
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-3">Booking ID</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Event</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bookingsData?.bookings?.map((b) => (
                <tr key={b.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-3 font-mono font-bold text-cyan-400">{b.id}</td>
                  <td className="py-3 text-slate-200">
                    <div>{b.userName || b.user?.name || 'User'}</div>
                    <div className="text-[10px] text-slate-500">{b.userEmail || b.user?.email}</div>
                  </td>
                  <td className="py-3 text-slate-300 font-medium">{b.eventTitle || b.show?.event?.title || 'Event'}</td>
                  <td className="py-3 font-mono font-bold text-white">₹{b.total_amount}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : b.status === 'CANCELLED' || b.status === 'FAILED'
                          ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 font-mono text-[11px]">
                    {new Date(b.created_at).toLocaleDateString()} {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Event Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0e1422] border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create New Event</h3>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g. Dune: Part Three"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Category</label>
                <select
                  value={eventForm.category}
                  onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                >
                  {['Movies', 'Concerts', 'Stand-up', 'Sports', 'Theatre'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Venue Name</label>
                  <input
                    type="text"
                    required
                    value={eventForm.venue_name}
                    onChange={(e) => setEventForm({ ...eventForm, venue_name: e.target.value })}
                    placeholder="PVR IMAX"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition"
              >
                Publish Event
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
