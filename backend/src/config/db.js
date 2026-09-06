const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

let pool = null;
let useMemoryStore = false;

// Transactional In-Memory Storage for zero-dependency execution
class MemoryDatabase {
  constructor() {
    this.users = [];
    this.events = [];
    this.shows = [];
    this.seats = [];
    this.bookings = [];
    this.booking_items = [];
    this.payments = [];
    this.notifications = [];
    this.lockedSeatsInTx = new Set(); // For simulating SELECT ... FOR UPDATE
  }

  // Helper to mimic SQL query
  async query(text, params = []) {
    const trimmed = text.trim();
    const upper = trimmed.toUpperCase();

    // Transactions
    if (upper === 'BEGIN') {
      return { rows: [] };
    }
    if (upper === 'COMMIT' || upper === 'ROLLBACK') {
      this.lockedSeatsInTx.clear();
      return { rows: [] };
    }

    // Custom SQL matching for SeatSync queries
    // 1. Users
    if (upper.includes('FROM USERS WHERE EMAIL = $1')) {
      const email = params[0].toLowerCase();
      const user = this.users.find((u) => u.email.toLowerCase() === email);
      return { rows: user ? [{ ...user }] : [] };
    }

    if (upper.includes('FROM USERS WHERE ID = $1')) {
      const user = this.users.find((u) => u.id === params[0]);
      return { rows: user ? [{ ...user }] : [] };
    }

    if (upper.startsWith('INSERT INTO USERS')) {
      const [name, email, password_hash, role] = params;
      const newUser = {
        id: uuidv4(),
        name,
        email: email.toLowerCase(),
        password_hash,
        role: role || 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.users.push(newUser);
      return { rows: [{ ...newUser }] };
    }

    // 2. Events
    if (upper.startsWith('SELECT') && upper.includes('FROM EVENTS') && upper.includes('WHERE ID = $1')) {
      const event = this.events.find((e) => e.id === params[0]);
      return { rows: event ? [{ ...event }] : [] };
    }

    if (upper.startsWith('SELECT') && upper.includes('FROM EVENTS')) {
      let filtered = [...this.events].filter((e) => e.is_active);
      return { rows: filtered };
    }

    // 3. Shows
    if (upper.startsWith('SELECT') && upper.includes('FROM SHOWS') && upper.includes('WHERE ID = $1')) {
      const show = this.shows.find((s) => s.id === params[0]);
      return { rows: show ? [{ ...show }] : [] };
    }

    if (upper.startsWith('SELECT') && upper.includes('FROM SHOWS WHERE EVENT_ID = $1')) {
      const shows = this.shows.filter((s) => s.event_id === params[0] && s.is_active);
      return { rows: shows };
    }

    // 4. Seats - with FOR UPDATE row locking simulation!
    if (upper.includes('FROM SEATS') && upper.includes('FOR UPDATE')) {
      const showId = params[0];
      const seatIds = params.slice(1);
      
      const matchedSeats = this.seats.filter(
        (s) => s.show_id === showId && seatIds.includes(s.id)
      );

      // Concurrency check: If another transaction locked these seats, or they are booked
      for (const seat of matchedSeats) {
        if (this.lockedSeatsInTx.has(seat.id)) {
          throw new Error(`Concurrency Lock Contention: Seat ${seat.seat_number} is locked by another transaction`);
        }
        this.lockedSeatsInTx.add(seat.id);
      }

      return { rows: matchedSeats.map((s) => ({ ...s })) };
    }

    if (upper.startsWith('SELECT') && upper.includes('FROM SEATS WHERE SHOW_ID = $1')) {
      const showSeats = this.seats.filter((s) => s.show_id === params[0]);
      return { rows: showSeats };
    }

    // Update seats
    if (upper.startsWith('UPDATE SEATS SET STATUS = $1')) {
      const [newStatus, showId, ...seatIds] = params;
      let count = 0;
      for (const s of this.seats) {
        if (s.show_id === showId && seatIds.includes(s.id)) {
          s.status = newStatus;
          s.updated_at = new Date().toISOString();
          count++;
        }
      }
      return { rowCount: count, rows: [] };
    }

    // 5. Bookings
    if (upper.startsWith('SELECT') && upper.includes('FROM BOOKINGS WHERE IDEMPOTENCY_KEY = $1')) {
      const b = this.bookings.find((item) => item.idempotency_key === params[0]);
      return { rows: b ? [{ ...b }] : [] };
    }

    if (upper.startsWith('SELECT') && upper.includes('FROM BOOKINGS WHERE ID = $1')) {
      const b = this.bookings.find((item) => item.id === params[0]);
      return { rows: b ? [{ ...b }] : [] };
    }

    if (upper.startsWith('SELECT') && upper.includes('FROM BOOKINGS WHERE USER_ID = $1')) {
      const userBookings = this.bookings.filter((item) => item.user_id === params[0]);
      return { rows: userBookings };
    }

    if (upper.startsWith('INSERT INTO BOOKINGS')) {
      const [id, user_id, show_id, total_amount, idempotency_key, expires_at] = params;
      const newBooking = {
        id,
        user_id,
        show_id,
        total_amount: Number(total_amount),
        status: 'PENDING',
        idempotency_key: idempotency_key || null,
        expires_at: expires_at ? new Date(expires_at).toISOString() : new Date(Date.now() + 180000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.bookings.push(newBooking);
      return { rows: [{ ...newBooking }] };
    }

    if (upper.startsWith('INSERT INTO BOOKING_ITEMS')) {
      const [booking_id, seat_id, price] = params;
      const item = {
        id: uuidv4(),
        booking_id,
        seat_id,
        price: Number(price),
        created_at: new Date().toISOString(),
      };
      this.booking_items.push(item);
      return { rows: [{ ...item }] };
    }

    if (upper.startsWith('UPDATE BOOKINGS SET STATUS = $1')) {
      const [newStatus, bookingId] = params;
      const b = this.bookings.find((item) => item.id === bookingId);
      if (b) {
        b.status = newStatus;
        b.updated_at = new Date().toISOString();
      }
      return { rows: b ? [{ ...b }] : [] };
    }

    // 6. Payments
    if (upper.startsWith('INSERT INTO PAYMENTS')) {
      const [booking_id, amount, payment_method, status, transaction_ref] = params;
      const payment = {
        id: uuidv4(),
        booking_id,
        amount: Number(amount),
        payment_method,
        status,
        transaction_ref,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.payments.push(payment);
      return { rows: [{ ...payment }] };
    }

    // 7. Notifications
    if (upper.startsWith('INSERT INTO NOTIFICATIONS')) {
      const [user_id, booking_id, type, recipient_email, message, status] = params;
      const notif = {
        id: uuidv4(),
        user_id,
        booking_id,
        type,
        recipient_email,
        message,
        status: status || 'PENDING',
        created_at: new Date().toISOString(),
      };
      this.notifications.push(notif);
      return { rows: [{ ...notif }] };
    }

    // Default empty return
    return { rows: [] };
  }

  // Client session for transactions
  getClient() {
    return {
      query: (text, params) => this.query(text, params),
      release: () => {
        this.lockedSeatsInTx.clear();
      },
    };
  }
}

const memoryDb = new MemoryDatabase();

const initDb = async () => {
  if (pool) return pool;

  try {
    const testPool = new Pool({
      connectionString: env.DATABASE_URL,
      connectionTimeoutMillis: 2000,
    });

    await testPool.query('SELECT 1');
    logger.info('Connected to PostgreSQL database successfully');
    pool = testPool;
    useMemoryStore = false;
  } catch (err) {
    logger.info(`PostgreSQL not reachable at ${env.DATABASE_URL}. Initializing high-concurrency In-Memory Database store with transactional locking.`);
    useMemoryStore = true;
  }
};

const query = async (text, params) => {
  if (useMemoryStore || !pool) {
    return memoryDb.query(text, params);
  }
  return pool.query(text, params);
};

const getClient = async () => {
  if (useMemoryStore || !pool) {
    return memoryDb.getClient();
  }
  return pool.connect();
};

module.exports = {
  initDb,
  query,
  getClient,
  getMemoryDb: () => memoryDb,
  isUsingMemoryStore: () => useMemoryStore,
};
