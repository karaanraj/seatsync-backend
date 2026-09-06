const { query, isUsingMemoryStore, getMemoryDb } = require('../config/db');

const findByShowId = async (showId) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    return memoryDb.seats
      .filter((s) => s.show_id === showId)
      .sort((a, b) => {
        if (a.row_label === b.row_label) {
          return a.seat_col - b.seat_col;
        }
        return a.row_label.localeCompare(b.row_label);
      });
  }

  const result = await query(
    'SELECT * FROM seats WHERE show_id = $1 ORDER BY row_label ASC, seat_col ASC',
    [showId]
  );
  return result.rows;
};

const findByIds = async (showId, seatIds) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    return memoryDb.seats.filter((s) => s.show_id === showId && seatIds.includes(s.id));
  }

  const placeholders = seatIds.map((_, i) => `$${i + 2}`).join(',');
  const result = await query(
    `SELECT * FROM seats WHERE show_id = $1 AND id IN (${placeholders})`,
    [showId, ...seatIds]
  );
  return result.rows;
};

const updateStatus = async (showId, seatIds, status, client = null) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    let updatedCount = 0;
    for (const seat of memoryDb.seats) {
      if (seat.show_id === showId && seatIds.includes(seat.id)) {
        seat.status = status;
        seat.updated_at = new Date().toISOString();
        updatedCount++;
      }
    }
    return updatedCount;
  }

  const runner = client ? client.query.bind(client) : query;
  const placeholders = seatIds.map((_, i) => `$${i + 3}`).join(',');
  const result = await runner(
    `UPDATE seats SET status = $1, updated_at = NOW() WHERE show_id = $2 AND id IN (${placeholders})`,
    [status, showId, ...seatIds]
  );
  return result.rowCount;
};

module.exports = {
  findByShowId,
  findByIds,
  updateStatus,
};
