const { query, isUsingMemoryStore, getMemoryDb } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const findByEventId = async (eventId) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    return memoryDb.shows.filter((s) => s.event_id === eventId && s.is_active);
  }
  const result = await query(
    'SELECT * FROM shows WHERE event_id = $1 AND is_active = true ORDER BY show_time ASC',
    [eventId]
  );
  return result.rows;
};

const findById = async (id) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    const show = memoryDb.shows.find((s) => s.id === id);
    if (!show) return null;
    const event = memoryDb.events.find((e) => e.id === show.event_id);
    return {
      ...show,
      event,
    };
  }
  const result = await query(
    `SELECT s.*, 
            json_build_object('id', e.id, 'title', e.title, 'venue_name', e.venue_name, 'location', e.location, 'poster_url', e.poster_url) as event
     FROM shows s
     JOIN events e ON e.id = s.event_id
     WHERE s.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const create = async (data) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    const newShow = {
      id: uuidv4(),
      ...data,
      total_seats: data.total_seats || 50,
      available_seats: data.total_seats || 50,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryDb.shows.push(newShow);

    // Auto generate 50 seats for this new show
    const rows = ['A', 'B', 'C', 'D', 'E'];
    rows.forEach((row) => {
      for (let col = 1; col <= 10; col++) {
        const seatNum = `${row}${col}`;
        let category = 'STANDARD';
        let price = data.base_price;
        if (row === 'C' || row === 'D') {
          category = 'PREMIUM';
          price = Number(data.base_price) + 80;
        } else if (row === 'E') {
          category = 'VIP';
          price = Number(data.base_price) + 160;
        }
        memoryDb.seats.push({
          id: `seat-${newShow.id}-${seatNum}`,
          show_id: newShow.id,
          seat_number: seatNum,
          row_label: row,
          seat_col: col,
          category,
          price,
          status: 'AVAILABLE',
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    });

    return newShow;
  }

  const result = await query(
    `INSERT INTO shows (event_id, show_time, format, language, base_price, total_seats, available_seats)
     VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *`,
    [data.event_id, data.show_time, data.format, data.language, data.base_price, data.total_seats || 50]
  );
  const show = result.rows[0];

  // Populate seats in PostgreSQL
  const rows = ['A', 'B', 'C', 'D', 'E'];
  for (const row of rows) {
    for (let col = 1; col <= 10; col++) {
      const seatNum = `${row}${col}`;
      let category = 'STANDARD';
      let price = show.base_price;
      if (row === 'C' || row === 'D') {
        category = 'PREMIUM';
        price = Number(show.base_price) + 80;
      } else if (row === 'E') {
        category = 'VIP';
        price = Number(show.base_price) + 160;
      }
      await query(
        `INSERT INTO seats (show_id, seat_number, row_label, seat_col, category, price, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'AVAILABLE')`,
        [show.id, seatNum, row, col, category, price]
      );
    }
  }

  return show;
};

module.exports = {
  findByEventId,
  findById,
  create,
};
