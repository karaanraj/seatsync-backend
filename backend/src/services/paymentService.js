const { getClient, query, isUsingMemoryStore, getMemoryDb } = require('../config/db');
const { getRedisClient } = require('../config/redis');
const bookingRepo = require('../repositories/bookingRepo');
const seatRepo = require('../repositories/seatRepo');
const notificationQueue = require('../jobs/notificationQueue');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class PaymentService {
  /**
   * Process simulated payment
   */
  static async processPayment({ bookingId, paymentMethod = 'DEMO', simulateOutcome = 'SUCCESS' }) {
    const booking = await bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found.');
    }

    if (booking.status === 'CONFIRMED') {
      throw new BadRequestError('This booking has already been paid and confirmed.');
    }

    if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
      throw new BadRequestError(`Cannot pay for a booking with status ${booking.status}.`);
    }

    // Check payment expiry timeout
    if (new Date(booking.expires_at) < new Date()) {
      await bookingRepo.updateStatus(bookingId, 'EXPIRED');
      throw new BadRequestError('Payment session timed out. Seat lock expired. Please select seats again.');
    }

    const transactionRef = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const client = await getClient();
    const redis = await getRedisClient();

    try {
      await client.query('BEGIN');

      const isSuccess = simulateOutcome === 'SUCCESS';
      const paymentStatus = isSuccess ? 'SUCCESS' : simulateOutcome === 'TIMEOUT' ? 'TIMEOUT' : 'FAILED';

      // 1. Record payment attempt
      await client.query(
        `INSERT INTO payments (booking_id, amount, payment_method, status, transaction_ref)
         VALUES ($1, $2, $3, $4, $5)`,
        [bookingId, booking.total_amount, paymentMethod, paymentStatus, transactionRef]
      );

      const seatIds = booking.items.map((i) => i.seat_id);

      if (isSuccess) {
        // Confirm booking
        await bookingRepo.updateStatus(bookingId, 'CONFIRMED', client);

        // Permanently set seat status to BOOKED
        if (isUsingMemoryStore()) {
          const memoryDb = getMemoryDb();
          memoryDb.seats.forEach((s) => {
            if (seatIds.includes(s.id)) s.status = 'BOOKED';
          });
        } else {
          const placeholders = seatIds.map((_, i) => `$${i + 2}`).join(',');
          await client.query(
            `UPDATE seats SET status = 'BOOKED', updated_at = NOW()
             WHERE show_id = $1 AND id IN (${placeholders})`,
            [booking.show_id, ...seatIds]
          );
        }

        await client.query('COMMIT');

        // Clean up temporary Redis locks since they are permanently booked now
        for (const seatId of seatIds) {
          await redis.del(`seat-lock:${booking.show_id}:${seatId}`);
        }

        // Enqueue confirmation notification
        const seatNumbers = booking.items.map((i) => i.seat_number).join(', ');
        notificationQueue.add('BOOKING_CONFIRMED', {
          userId: booking.user_id,
          bookingId: booking.id,
          recipientEmail: booking.user?.email || 'customer@seatsync.com',
          message: `Your SeatSync booking ${booking.id} is confirmed! Seats: ${seatNumbers}. Amount: ₹${booking.total_amount}.`,
        });

        logger.info(`[Payment Success] Booking ${bookingId} confirmed with transaction ${transactionRef}`);

        return {
          success: true,
          bookingId,
          status: 'CONFIRMED',
          paymentStatus: 'SUCCESS',
          transactionRef,
          amountPaid: Number(booking.total_amount),
        };
      } else {
        // Payment failed or timed out
        await bookingRepo.updateStatus(bookingId, 'FAILED', client);
        await client.query('COMMIT');

        // Release temporary Redis locks so others can book
        for (const seatId of seatIds) {
          await redis.del(`seat-lock:${booking.show_id}:${seatId}`);
        }

        logger.warn(`[Payment Failed] Booking ${bookingId} marked as FAILED (${simulateOutcome})`);

        return {
          success: false,
          bookingId,
          status: 'FAILED',
          paymentStatus,
          message: 'Payment simulation failed or timed out. Seats have been released.',
        };
      }
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = PaymentService;
