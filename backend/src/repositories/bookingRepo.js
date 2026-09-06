const { query, isUsingMemoryStore, getMemoryDb } = require('../config/db');

const findById = async (id) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    const booking = memoryDb.bookings.find((b) => b.id === id);
    if (!booking) return null;

    const user = memoryDb.users.find((u) => u.id === booking.user_id);
    const show = memoryDb.shows.find((s) => s.id === booking.show_id);
    const event = show ? memoryDb.events.find((e) => e.id === show.event_id) : null;
    const items = memoryDb.booking_items.filter((item) => item.booking_id === id);
    const seats = items.map((item) => {
      const seat = memoryDb.seats.find((s) => s.id === item.seat_id);
      return {
        ...item,
        seat_number: seat ? seat.seat_number : 'Unknown',
        row_label: seat ? seat.row_label : '',
        seat_col: seat ? seat.seat_col : '',
        category: seat ? seat.category : '',
      };
    });
    const payments = memoryDb.payments.filter((p) => p.booking_id === id);

    return {
      ...booking,
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
      show: show ? { ...show, event } : null,
      items: seats,
      payments,
    };
  }

  const result = await query(
    `SELECT b.*,
            json_build_object('id', u.id, 'name', u.name, 'email', u.email) as user,
            json_build_object('id', s.id, 'show_time', s.show_time, 'format', s.format, 'language', s.language,
                              'event', json_build_object('id', e.id, 'title', e.title, 'venue_name', e.venue_name, 'location', e.location, 'poster_url', e.poster_url)) as show
     FROM bookings b
     JOIN users u ON u.id = b.user_id
     JOIN shows s ON s.id = b.show_id
     JOIN events e ON e.id = s.event_id
     WHERE b.id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  const booking = result.rows[0];

  const itemsResult = await query(
    `SELECT bi.*, s.seat_number, s.row_label, s.seat_col, s.category
     FROM booking_items bi
     JOIN seats s ON s.id = bi.seat_id
     WHERE bi.booking_id = $1`,
    [id]
  );
  booking.items = itemsResult.rows;

  const paymentsResult = await query('SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC', [id]);
  booking.payments = paymentsResult.rows;

  return booking;
};

const findByUserId = async (userId) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    const userBookings = memoryDb.bookings.filter((b) => b.user_id === userId);
    return userBookings.map((b) => {
      const show = memoryDb.shows.find((s) => s.id === b.show_id);
      const event = show ? memoryDb.events.find((e) => e.id === show.event_id) : null;
      const items = memoryDb.booking_items.filter((item) => item.booking_id === b.id);
      const seats = items.map((item) => {
        const seat = memoryDb.seats.find((s) => s.id === item.seat_id);
        return seat ? seat.seat_number : '';
      });
      return {
        ...b,
        event_title: event ? event.title : '',
        venue_name: event ? event.venue_name : '',
        poster_url: event ? event.poster_url : '',
        show_time: show ? show.show_time : '',
        seats,
      };
    });
  }

  const result = await query(
    `SELECT b.*, e.title as event_title, e.venue_name, e.poster_url, s.show_time,
            COALESCE(array_agg(st.seat_number), '{}') as seats
     FROM bookings b
     JOIN shows s ON s.id = b.show_id
     JOIN events e ON e.id = s.event_id
     LEFT JOIN booking_items bi ON bi.booking_id = b.id
     LEFT JOIN seats st ON st.id = bi.seat_id
     WHERE b.user_id = $1
     GROUP BY b.id, e.title, e.venue_name, e.poster_url, s.show_time
     ORDER BY b.created_at DESC`,
    [userId]
  );
  return result.rows;
};

const findByIdempotencyKey = async (key) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    return memoryDb.bookings.find((b) => b.idempotency_key === key) || null;
  }
  const result = await query('SELECT * FROM bookings WHERE idempotency_key = $1', [key]);
  return result.rows[0] || null;
};

const updateStatus = async (id, status, client = null) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    const b = memoryDb.bookings.find((item) => item.id === id);
    if (b) {
      b.status = status;
      b.updated_at = new Date().toISOString();
    }
    return b;
  }
  const runner = client ? client.query.bind(client) : query;
  const result = await runner(
    'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
};

module.exports = {
  findById,
  findByUserId,
  findByIdempotencyKey,
  updateStatus,
};
