const { query, isUsingMemoryStore, getMemoryDb } = require('../config/db');
const { getRedisClient } = require('../config/redis');

class AdminService {
  static async getDashboardStats() {
    const redis = await getRedisClient();
    const lockKeys = await redis.keys('seat-lock:*');
    const activeSeatLocks = lockKeys.length;

    if (isUsingMemoryStore()) {
      const db = getMemoryDb();
      const totalUsers = db.users.filter((u) => u.role === 'user').length;
      const totalEvents = db.events.filter((e) => e.is_active).length;
      const totalShows = db.shows.filter((s) => s.is_active).length;
      const totalBookings = db.bookings.length;

      const confirmedBookings = db.bookings.filter((b) => b.status === 'CONFIRMED');
      const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);

      const today = new Date().toISOString().slice(0, 10);
      const todaysBookings = db.bookings.filter((b) => b.created_at.startsWith(today)).length;
      const failedPayments = db.payments.filter((p) => p.status === 'FAILED' || p.status === 'TIMEOUT').length;

      const totalSeatsCount = db.seats.length;
      const bookedSeatsCount = db.seats.filter((s) => s.status === 'BOOKED').length;
      const occupancyRate = totalSeatsCount > 0 ? Math.round((bookedSeatsCount / totalSeatsCount) * 100) : 0;

      // Recent 10 bookings
      const recentBookings = [...db.bookings]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10)
        .map((b) => {
          const user = db.users.find((u) => u.id === b.user_id);
          const show = db.shows.find((s) => s.id === b.show_id);
          const event = show ? db.events.find((e) => e.id === show.event_id) : null;
          return {
            ...b,
            userName: user ? user.name : 'Unknown',
            userEmail: user ? user.email : 'Unknown',
            eventTitle: event ? event.title : 'Unknown',
          };
        });

      return {
        metrics: {
          totalUsers,
          totalEvents,
          totalShows,
          totalBookings,
          todaysBookings,
          totalRevenue,
          activeSeatLocks,
          failedPayments,
          occupancyRate,
        },
        recentBookings,
      };
    }

    // PostgreSQL Queries
    const userRes = await query("SELECT COUNT(*)::int as count FROM users WHERE role = 'user'");
    const eventRes = await query('SELECT COUNT(*)::int as count FROM events WHERE is_active = true');
    const showRes = await query('SELECT COUNT(*)::int as count FROM shows WHERE is_active = true');
    const bookingRes = await query('SELECT COUNT(*)::int as count FROM bookings');
    const revenueRes = await query("SELECT COALESCE(SUM(total_amount), 0)::numeric as total FROM bookings WHERE status = 'CONFIRMED'");
    const todayRes = await query('SELECT COUNT(*)::int as count FROM bookings WHERE created_at >= CURRENT_DATE');
    const failedRes = await query("SELECT COUNT(*)::int as count FROM payments WHERE status IN ('FAILED', 'TIMEOUT')");
    const seatRes = await query("SELECT COUNT(*)::int as total, COUNT(CASE WHEN status = 'BOOKED' THEN 1 END)::int as booked FROM seats");

    const recentRes = await query(`
      SELECT b.*, u.name as "userName", u.email as "userEmail", e.title as "eventTitle"
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      JOIN shows s ON s.id = b.show_id
      JOIN events e ON e.id = s.event_id
      ORDER BY b.created_at DESC
      LIMIT 10
    `);

    const seatData = seatRes.rows[0];
    const occupancyRate = seatData.total > 0 ? Math.round((seatData.booked / seatData.total) * 100) : 0;

    return {
      metrics: {
        totalUsers: userRes.rows[0].count,
        totalEvents: eventRes.rows[0].count,
        totalShows: showRes.rows[0].count,
        totalBookings: bookingRes.rows[0].count,
        todaysBookings: todayRes.rows[0].count,
        totalRevenue: Number(revenueRes.rows[0].total),
        activeSeatLocks,
        failedPayments: failedRes.rows[0].count,
        occupancyRate,
      },
      recentBookings: recentRes.rows,
    };
  }

  static async getAllBookings({ page = 1, limit = 20, status = null }) {
    const offset = (page - 1) * limit;

    if (isUsingMemoryStore()) {
      const db = getMemoryDb();
      let filtered = [...db.bookings];
      if (status && status !== 'ALL') {
        filtered = filtered.filter((b) => b.status === status);
      }
      const total = filtered.length;
      const paginated = filtered
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(offset, offset + limit)
        .map((b) => {
          const user = db.users.find((u) => u.id === b.user_id);
          const show = db.shows.find((s) => s.id === b.show_id);
          const event = show ? db.events.find((e) => e.id === show.event_id) : null;
          return {
            ...b,
            userName: user ? user.name : 'Unknown',
            userEmail: user ? user.email : 'Unknown',
            eventTitle: event ? event.title : 'Unknown',
          };
        });

      return {
        bookings: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    let sql = `
      SELECT b.*, u.name as "userName", u.email as "userEmail", e.title as "eventTitle"
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      JOIN shows s ON s.id = b.show_id
      JOIN events e ON e.id = s.event_id
    `;
    const params = [];
    if (status && status !== 'ALL') {
      params.push(status);
      sql += ` WHERE b.status = $${params.length}`;
    }
    sql += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    const countSql = `SELECT COUNT(*)::int as total FROM bookings ${status && status !== 'ALL' ? `WHERE status = '${status}'` : ''}`;
    const countRes = await query(countSql);
    const total = countRes.rows[0].total;

    return {
      bookings: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = AdminService;
