import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, MapPin, QrCode, XCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

export const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const toast = useToast();

  const fetchBookings = () => {
    setLoading(true);
    api
      .getMyBookings()
      .then((res) => setBookings(res.data.bookings))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm(`Are you sure you want to cancel booking ${bookingId}? Seats will be released back to the inventory.`)) {
      return;
    }

    try {
      await api.cancelBooking(bookingId);
      toast.success(`Booking ${bookingId} cancelled successfully.`);
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking.');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UPCOMING') return b.status === 'CONFIRMED' && new Date(b.show_time) >= new Date();
    if (activeTab === 'COMPLETED') return b.status === 'CONFIRMED' && new Date(b.show_time) < new Date();
    if (activeTab === 'CANCELLED') return b.status === 'CANCELLED' || b.status === 'FAILED';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Bookings</h1>
          <p className="text-xs text-slate-400 mt-1">Review your ticket history, download passes, and manage reservations</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 bg-[#0e1422] p-1.5 rounded-2xl border border-slate-800">
          {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === tab
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <LoadingSpinner text="Retrieving bookings..." />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No bookings found"
          description="You haven't made any bookings in this category yet."
          actionText="Browse Events"
          actionLink="/events"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((b) => {
            const isConfirmed = b.status === 'CONFIRMED';
            const isCancelled = b.status === 'CANCELLED' || b.status === 'FAILED';

            return (
              <div
                key={b.id}
                className="p-6 rounded-2xl bg-[#0e1422] border border-slate-800 hover:border-slate-700 transition space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider uppercase block mb-1">
                        {b.id}
                      </span>
                      <h3 className="text-lg font-bold text-white">{b.event_title || 'Live Show'}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{b.venue_name || 'Venue'}</span>
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                        isConfirmed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : isCancelled
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Showtime</span>
                      <span className="text-slate-200 font-semibold">
                        {b.show_time ? new Date(b.show_time).toLocaleDateString() : 'Scheduled'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px]">Seats</span>
                      <span className="text-cyan-300 font-mono font-bold">
                        {b.seats && b.seats.length > 0 ? b.seats.join(', ') : 'Assigned'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total Paid</span>
                    <span className="text-base font-extrabold font-mono text-white">₹{b.total_amount}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isConfirmed && (
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-950/40 text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                    )}

                    <Link
                      to={`/booking-success/${b.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition flex items-center space-x-1"
                    >
                      <span>Pass</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
