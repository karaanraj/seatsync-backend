const { getClient, query, isUsingMemoryStore, getMemoryDb } = require('../config/db');
const { getRedisClient } = require('../config/redis');
const bookingRepo = require('../repositories/bookingRepo');
const showRepo = require('../repositories/showRepo');
const notificationQueue = require('../jobs/notificationQueue');
const env = require('../config/env');
const { ConflictError, NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

class BookingService {
  /**
   * Create Booking with PostgreSQL Transaction and Row-Level Locking (SELECT ... FOR UPDATE)
   */
  static async createBooking({ userId, showId, seatIds, idempotencyKey = null, customerDetails = null }) {
    if (!seatIds || seatIds.length === 0) {
      throw new BadRequestError('At least one seat must be selected.');
    }
    if (seatIds.length > env.MAX_SEATS_PER_BOOKING) {
      throw new BadRequestError(`Maximum ${env.MAX_SEATS_PER_BOOKING} seats can be booked at once.`);
    }

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existingBooking = await bookingRepo.findByIdempotencyKey(idempotencyKey);
      if (existingBooking) {
        logger.info(`[Booking Idempotency] Re-returning existing booking ${existingBooking.id} for key ${idempotencyKey}`);
        return bookingRepo.findById(existingBooking.id);
      }
    }

    const show = await showRepo.findById(showId);
    if (!show) {
      throw new NotFoundError('Show not found.');
    }

    // Check if show has already started
    if (new Date(show.show_time) <= new Date()) {
      throw new BadRequestError('Cannot book tickets for a show that has already started.');
    }

    // 2. Check Redis lock ownership
    const redis = await getRedisClient();
    for (const seatId of seatIds) {
      const lockKey = `seat-lock:${showId}:${seatId}`;
      const lockHolder = await redis.get(lockKey);
      if (lockHolder && lockHolder !== userId) {
        throw new ConflictError(
          'One or more selected seats are held by another customer. Please choose alternative seats.',
          'SEAT_HELD_BY_ANOTHER_USER'
        );
      }
    }

    // 3. PostgreSQL Transaction with Row-Level Locking
    const client = await getClient();
    let transactionActive = false;

    try {
      await client.query('BEGIN');
      transactionActive = true;

      // Row-Level Lock: SELECT ... FOR UPDATE
      let seats;
      if (isUsingMemoryStore()) {
        const result = await client.query('SELECT * FROM SEATS FOR UPDATE', [showId, ...seatIds]);
        seats = result.rows;
      } else {
        const placeholders = seatIds.map((_, idx) => `$${idx + 2}`).join(',');
        const result = await client.query(
          `SELECT id, seat_number, category, price, status, version 
           FROM seats 
           WHERE show_id = $1 AND id IN (${placeholders}) 
           FOR UPDATE`,
          [showId, ...seatIds]
        );
        seats = result.rows;
      }

      if (seats.length !== seatIds.length) {
        throw new NotFoundError('One or more selected seats do not exist in this show.');
      }

      // Check if any seat was booked concurrently
      const bookedSeats = seats.filter((s) => s.status === 'BOOKED');
      if (bookedSeats.length > 0) {
        const numbers = bookedSeats.map((s) => s.seat_number).join(', ');
        throw new ConflictError(
          `Seat(s) ${numbers} have just been booked by another user.`,
          'SEAT_ALREADY_BOOKED',
          { conflictSeats: numbers }
        );
      }

      // 4. Calculate Server-Side Authoritative Price (Never Trust Client)
      const ticketSubtotal = seats.reduce((sum, s) => sum + Number(s.price), 0);
      const convenienceFee = Math.round(ticketSubtotal * 0.05); // 5% convenience fee
      const taxes = Math.round((ticketSubtotal + convenienceFee) * 0.18); // 18% GST/Tax
      const totalAmount = ticketSubtotal + convenienceFee + taxes;

      // 5. Generate Booking ID (e.g. SS-2026-839201)
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const bookingId = `SS-2026-${randomSuffix}`;
      const expiresAt = new Date(Date.now() + env.PAYMENT_TIMEOUT_SECONDS * 1000).toISOString();

      // Insert booking record
      await client.query(
        `INSERT INTO bookings (id, user_id, show_id, total_amount, status, idempotency_key, expires_at)
         VALUES ($1, $2, $3, $4, 'PENDING', $5, $6)`,
        [bookingId, userId, showId, totalAmount, idempotencyKey, expiresAt]
      );

      // Insert booking items
      for (const seat of seats) {
        await client.query(
          `INSERT INTO booking_items (booking_id, seat_id, price)
           VALUES ($1, $2, $3)`,
          [bookingId, seat.id, seat.price]
        );
      }

      await client.query('COMMIT');
      transactionActive = false;

      logger.info(`[Booking Created] Pending booking ${bookingId} created for user ${userId}. Amount: ₹${totalAmount}`);

      return {
        bookingId,
        userId,
        showId,
        seats: seats.map((s) => ({
          id: s.id,
          seatNumber: s.seat_number,
          category: s.category,
          price: Number(s.price),
        })),
        priceBreakdown: {
          tickets: ticketSubtotal,
          convenienceFee,
          taxes,
          totalAmount,
        },
        status: 'PENDING',
        expiresAt,
      };
    } catch (err) {
      if (transactionActive) {
        try {
          await client.query('ROLLBACK');
        } catch (rbErr) {
          logger.error(`[Booking Rollback Error] ${rbErr.message}`);
        }
      }
      logger.warn(`[Booking Failed] ${err.message}`);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel an eligible booking
   */
  static async cancelBooking(bookingId, userId, isAdmin = false) {
    const booking = await bookingRepo.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found.');
    }

    if (!isAdmin && booking.user_id !== userId) {
      throw new ForbiddenError('You are not authorized to cancel this booking.');
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestError('This booking is already cancelled.');
    }

    if (booking.status === 'FAILED' || booking.status === 'EXPIRED') {
      throw new BadRequestError(`Cannot cancel a booking with status ${booking.status}.`);
    }

    // Start transaction to cancel booking and release seats
    const client = await getClient();
    try {
      await client.query('BEGIN');

      await bookingRepo.updateStatus(bookingId, 'CANCELLED', client);

      // Revert seats to AVAILABLE
      const seatIds = booking.items.map((item) => item.seat_id);
      if (seatIds.length > 0) {
        if (isUsingMemoryStore()) {
          const memoryDb = getMemoryDb();
          memoryDb.seats.forEach((s) => {
            if (seatIds.includes(s.id)) s.status = 'AVAILABLE';
          });
        } else {
          const placeholders = seatIds.map((_, i) => `$${i + 2}`).join(',');
          await client.query(
            `UPDATE seats SET status = 'AVAILABLE', updated_at = NOW() 
             WHERE show_id = $1 AND id IN (${placeholders})`,
            [booking.show_id, ...seatIds]
          );
        }
      }

      await client.query('COMMIT');

      // Enqueue cancellation notification
      if (booking.user) {
        notificationQueue.add('BOOKING_CANCELLED', {
          userId: booking.user_id,
          bookingId: booking.id,
          recipientEmail: booking.user.email,
          message: `Your booking ${booking.id} has been cancelled successfully. Refund of ₹${booking.total_amount} initiated.`,
        });
      }

      logger.info(`[Booking Cancelled] Booking ${bookingId} cancelled.`);
      return { success: true, bookingId, status: 'CANCELLED' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = BookingService;
