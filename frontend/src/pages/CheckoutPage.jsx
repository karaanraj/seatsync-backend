import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Shield, ChevronLeft, CreditCard, Smartphone, Building, Lock, AlertTriangle } from 'lucide-react';
import { PaymentSimulationModal } from '../components/payment/PaymentSimulationModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const { show, selectedSeats, lockExpirySeconds } = location.state || {};

  // Idempotency Key generated once on page mount to prevent double charging on retry
  const [idempotencyKey] = useState(() => 'idemp-' + Math.random().toString(36).substring(2, 15) + Date.now());

  const [customer, setCustomer] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '9876543210',
  });

  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);

  useEffect(() => {
    if (!show || !selectedSeats || selectedSeats.length === 0) {
      navigate('/events');
    }
  }, [show, selectedSeats, navigate]);

  if (!show || !selectedSeats) return null;

  const count = selectedSeats.length;
  const subtotal = selectedSeats.reduce((sum, s) => sum + Number(s.price), 0);
  const convenienceFee = Math.round(subtotal * 0.05);
  const taxes = Math.round((subtotal + convenienceFee) * 0.18);
  const total = subtotal + convenienceFee + taxes;

  const handleInitiateBooking = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // 1. Create atomic booking in backend with Idempotency Key
      const bookingRes = await api.createBooking({
        showId: show.id,
        seatIds: selectedSeats.map((s) => s.id),
        idempotencyKey,
        customerDetails: customer,
      });

      const bookingData = bookingRes.data.booking;
      setActiveBooking(bookingData);

      // 2. Open payment modal for simulation
      setIsPaymentModalOpen(true);
    } catch (err) {
      toast.error(err.message || 'Booking initiation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompletePayment = async (simulateOutcome) => {
    try {
      const payRes = await api.processPayment({
        bookingId: activeBooking.bookingId || activeBooking.id,
        paymentMethod,
        simulateOutcome,
      });

      if (payRes.data.status === 'CONFIRMED') {
        toast.success('Payment confirmed! Your seats are secured.', 3000);
        navigate(`/booking-success/${activeBooking.bookingId || activeBooking.id}`, {
          state: { booking: activeBooking, payment: payRes.data },
        });
      } else {
        toast.error(`Payment ${payRes.data.status.toLowerCase()}. Seat locks have been released.`, 5000);
        setIsPaymentModalOpen(false);
        navigate(`/shows/${show.id}/seats`);
      }
    } catch (err) {
      toast.error(err.message || 'Payment processing error.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <Link
        to={`/shows/${show.id}/seats`}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Return to Seating Map</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info Form */}
          <div className="p-6 rounded-2xl bg-[#0e1422] border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight">Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Email Address (for e-tickets)</label>
                <input
                  type="email"
                  required
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1 font-medium">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="p-6 rounded-2xl bg-[#0e1422] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-tight">Payment Method</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/30">
                Sandbox Mode
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                { id: 'CARD', label: 'Credit / Debit Card', icon: CreditCard },
                { id: 'NET_BANKING', label: 'Net Banking', icon: Building },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 transition ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/50'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{m.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start space-x-2">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Simulated Sandbox Payment: You can test successful payment confirmation, payment failures, and gateway timeouts on the next screen.
              </span>
            </div>
          </div>
        </div>

        {/* Right Summary Column */}
        <div className="lg:col-span-1">
          <div className="p-6 rounded-2xl bg-[#0e1422] border border-slate-800 space-y-6 shadow-xl sticky top-24">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
                Order Review
              </span>
              <h3 className="text-base font-bold text-white mt-1">{show.event?.title || 'Selected Event'}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{show.event?.venue_name}</p>
              <p className="text-xs text-slate-400">
                {new Date(show.show_time).toLocaleDateString()} at{' '}
                {new Date(show.show_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Seats Badges */}
            <div className="pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400 block mb-2 font-medium">Seats:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedSeats.map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold"
                  >
                    {s.seat_number}
                  </span>
                ))}
              </div>
            </div>

            {/* Price Table */}
            <div className="space-y-2 pt-4 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Tickets ({count})</span>
                <span className="font-mono text-white">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Convenience Fee</span>
                <span className="font-mono text-white">₹{convenienceFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Taxes & GST (18%)</span>
                <span className="font-mono text-white">₹{taxes.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-slate-800 text-sm font-bold text-white">
                <span>Total Amount</span>
                <span className="text-xl font-extrabold font-mono text-cyan-400">₹{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleInitiateBooking}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>{isProcessing ? 'Locking Transaction...' : `Pay ₹${total.toLocaleString()}`}</span>
            </button>

            <div className="text-center font-mono text-[10px] text-slate-500">
              Idempotency Key: {idempotencyKey.slice(0, 14)}...
            </div>
          </div>
        </div>
      </div>

      {/* Payment Simulation Gateway Modal */}
      <PaymentSimulationModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        booking={activeBooking}
        onComplete={handleCompletePayment}
      />
    </div>
  );
};
