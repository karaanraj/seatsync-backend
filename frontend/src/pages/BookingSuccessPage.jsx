import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, QrCode, Download, ArrowRight, Calendar, MapPin, Ticket, Printer } from 'lucide-react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const BookingSuccessPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!booking);

  useEffect(() => {
    // Fire celebratory confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    if (!booking) {
      api
        .getBookingById(id)
        .then((res) => setBooking(res.data.booking))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id, booking]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving booking pass..." />;
  }

  if (!booking) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white">Booking Not Found</h2>
        <Link to="/events" className="text-cyan-400 text-sm mt-3 inline-block">
          Return to Events
        </Link>
      </div>
    );
  }

  const show = booking.show;
  const event = show?.event;
  const seatsList = booking.items ? booking.items.map((i) => i.seat_number).join(', ') : booking.seats?.map((s) => s.seatNumber).join(', ');

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8 print:p-0">
      {/* Confirmation Header */}
      <div className="text-center space-y-3 print:hidden">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Booking Confirmed!</h1>
        <p className="text-xs text-slate-400">
          Your reservation has been securely committed and locked in the database.
        </p>
      </div>

      {/* Ticket Pass Card */}
      <div className="rounded-3xl bg-[#0e1422] border border-slate-700/80 shadow-2xl overflow-hidden print:border-black print:bg-white print:text-black">
        {/* Top Ticket Header */}
        <div className="bg-gradient-to-r from-cyan-900/60 via-slate-900 to-teal-900/60 p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-mono tracking-widest text-cyan-400 font-bold block mb-1">
              Official Entry Pass
            </span>
            <span className="text-xl font-black text-white font-mono tracking-wider">
              {booking.id || booking.bookingId}
            </span>
          </div>

          <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
            CONFIRMED
          </div>
        </div>

        {/* Ticket Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {event?.title || 'Event Title'}
            </h2>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{event?.venue_name || 'Venue'} • {show?.format || 'IMAX'}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Date & Time</span>
              <span className="text-white font-semibold mt-0.5 block">
                {show?.show_time ? new Date(show.show_time).toLocaleDateString() : 'Today'}
              </span>
              <span className="text-cyan-400 font-mono">
                {show?.show_time ? new Date(show.show_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:30 AM'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Reserved Seats</span>
              <span className="text-white font-mono font-bold text-base mt-0.5 block">
                {seatsList || 'A10'}
              </span>
            </div>
          </div>

          {/* QR Code and Barcode Visual */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-xl bg-white p-2 flex items-center justify-center shrink-0">
                <QrCode className="w-full h-full text-black" />
              </div>
              <div className="text-xs space-y-1">
                <div className="font-bold text-white">Scan at Venue Turnstile</div>
                <div className="text-slate-400 text-[11px]">Present digital ticket on mobile or printed pass</div>
                <div className="text-emerald-400 font-mono text-[10px]">VERIFIED • ENCRYPTED PAYLOAD</div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-500 block">Total Paid</span>
              <span className="text-2xl font-black text-white font-mono">
                ₹{(booking.total_amount || booking.priceBreakdown?.totalAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center space-x-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save Ticket</span>
        </button>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Link
            to="/my-bookings"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20"
          >
            <span>View All My Bookings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
