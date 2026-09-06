import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';
import { SeatLayout } from '../components/seats/SeatLayout';
import { SeatLegend } from '../components/seats/SeatLegend';
import { BookingSummarySidebar } from '../components/seats/BookingSummarySidebar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const SeatSelectionPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuth();

  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [lockExpirySeconds, setLockExpirySeconds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lockingInProgress, setLockingInProgress] = useState(false);

  const fetchSeats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.getShowSeats(showId);
      setShow(res.data.show);
      setSeats(res.data.seats);

      // Restore existing locks held by current user if returning to page
      const myLockedSeats = res.data.seats.filter((s) => s.lockStatus === 'LOCKED_BY_CURRENT_USER');
      if (myLockedSeats.length > 0) {
        setSelectedSeats(myLockedSeats);
        setLockExpirySeconds(myLockedSeats[0].lockTtlSeconds || 600);
      }
    } catch (err) {
      toast.error('Failed to load seating inventory.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showId, toast]);

  useEffect(() => {
    fetchSeats();
    // Poll seat states periodically (every 10 seconds) to keep concurrency state synchronized
    const interval = setInterval(() => fetchSeats(true), 10000);
    return () => clearInterval(interval);
  }, [fetchSeats]);

  // Toggle seat selection
  const handleToggleSeat = async (seat) => {
    if (!isAuthenticated) {
      toast.info('Please sign in to select and lock seats.');
      navigate('/login', { state: { from: `/shows/${showId}/seats` } });
      return;
    }

    const isAlreadySelected = selectedSeats.some((s) => s.id === seat.id);

    if (isAlreadySelected) {
      // User deselects seat
      const updated = selectedSeats.filter((s) => s.id !== seat.id);
      setSelectedSeats(updated);

      try {
        await api.releaseSeats(showId, [seat.id]);
        if (updated.length === 0) setLockExpirySeconds(null);
        fetchSeats(true);
      } catch (err) {
        console.error('Failed to release seat lock', err);
      }
    } else {
      // User selects seat
      if (selectedSeats.length >= 6) {
        toast.warning('Maximum 6 seats can be booked at once.');
        return;
      }

      const nextSeats = [...selectedSeats, seat];
      setSelectedSeats(nextSeats);
      setLockingInProgress(true);

      try {
        // Call backend Redis temporary lock API
        const lockRes = await api.lockSeats(showId, [seat.id]);
        setLockExpirySeconds(lockRes.data.lockTtlSeconds || 600);
        toast.success(`Seat ${seat.seat_number} reserved for 10 minutes!`, 2500);
        fetchSeats(true);
      } catch (err) {
        // Concurrency conflict handled cleanly!
        setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id));
        toast.error(err.message || `Seat ${seat.seat_number} was just held by another user.`, 5000);
        fetchSeats(true); // refresh map to reflect other user's hold
      } finally {
        setLockingInProgress(false);
      }
    }
  };

  // Lock expired handler
  const handleLockExpired = () => {
    toast.warning('Your temporary seat lock has expired. Please re-select your seats.');
    setSelectedSeats([]);
    setLockExpirySeconds(null);
    fetchSeats(true);
  };

  // Proceed to checkout
  const handleProceedToCheckout = () => {
    if (selectedSeats.length === 0) return;

    // Pass show and selected seats to checkout page
    navigate('/checkout', {
      state: {
        show,
        selectedSeats,
        lockExpirySeconds,
      },
    });
  };

  if (loading) {
    return <LoadingSpinner text="Checking live seat availability..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <Link
            to={show?.event ? `/events/${show.event.id}` : '/events'}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {show?.event?.title || 'Select Your Seats'}
            </h1>
            <p className="text-xs text-slate-400">
              {show?.event?.venue_name} • {show?.format} • {new Date(show?.show_time).toLocaleDateString()} at{' '}
              {new Date(show?.show_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchSeats(false)}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Availability</span>
        </button>
      </div>

      {/* Main Seating Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Cinema Seating Layout & Legend */}
        <div className="lg:col-span-2 space-y-6">
          <SeatLegend />

          <div className="p-6 rounded-3xl bg-[#0e1422] border border-slate-800/80 shadow-2xl flex flex-col items-center">
            <SeatLayout
              seats={seats}
              selectedSeats={selectedSeats}
              onToggleSeat={handleToggleSeat}
              disabled={lockingInProgress}
            />
          </div>
        </div>

        {/* Right Column: Booking Summary & Checkout Action */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <BookingSummarySidebar
              selectedSeats={selectedSeats}
              lockExpirySeconds={lockExpirySeconds}
              onProceed={handleProceedToCheckout}
              onExpireLock={handleLockExpired}
              loading={lockingInProgress}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
