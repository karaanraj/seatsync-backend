const { query, isUsingMemoryStore, getMemoryDb } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const findAll = async ({ search, category, location, sortBy = 'popular' }) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    let events = memoryDb.events.filter((e) => e.is_active);

    if (category && category !== 'All') {
      events = events.filter((e) => e.category.toLowerCase() === category.toLowerCase());
    }
    if (location && location !== 'All') {
      events = events.filter((e) => e.location.toLowerCase().includes(location.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.venue_name.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }

    // Attach shows summary
    return events.map((event) => {
      const eventShows = memoryDb.shows.filter((s) => s.event_id === event.id && s.is_active);
      const startingPrice = eventShows.length > 0 ? Math.min(...eventShows.map((s) => Number(s.base_price))) : 250;
      return {
        ...event,
        show_count: eventShows.length,
        starting_price: startingPrice,
      };
    });
  }

  // PostgreSQL query
  let sql = `
    SELECT e.*, 
           COUNT(s.id)::int as show_count, 
           COALESCE(MIN(s.base_price), 250)::numeric as starting_price
    FROM events e
    LEFT JOIN shows s ON s.event_id = e.id AND s.is_active = true
    WHERE e.is_active = true
  `;
  const params = [];

  if (category && category !== 'All') {
    params.push(category);
    sql += ` AND e.category = $${params.length}`;
  }
  if (location && location !== 'All') {
    params.push(`%${location}%`);
    sql += ` AND e.location ILIKE $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (e.title ILIKE $${params.length} OR e.venue_name ILIKE $${params.length})`;
  }

  sql += ` GROUP BY e.id`;

  if (sortBy === 'price_low') {
    sql += ` ORDER BY starting_price ASC`;
  } else if (sortBy === 'price_high') {
    sql += ` ORDER BY starting_price DESC`;
  } else {
    sql += ` ORDER BY e.created_at DESC`;
  }

  const result = await query(sql, params);
  return result.rows;
};

const findById = async (id) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    const event = memoryDb.events.find((e) => e.id === id);
    if (!event) return null;
    const shows = memoryDb.shows.filter((s) => s.event_id === id && s.is_active);
    return {
      ...event,
      shows,
    };
  }

  const eventResult = await query('SELECT * FROM events WHERE id = $1', [id]);
  if (eventResult.rows.length === 0) return null;

  const showsResult = await query('SELECT * FROM shows WHERE event_id = $1 AND is_active = true ORDER BY show_time ASC', [id]);
  return {
    ...eventResult.rows[0],
    shows: showsResult.rows,
  };
};

const create = async (data) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    const newEvent = {
      id: uuidv4(),
      ...data,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryDb.events.push(newEvent);
    return newEvent;
  }

  const result = await query(
    `INSERT INTO events (title, description, category, location, venue_name, duration_mins, poster_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.title, data.description, data.category, data.location, data.venue_name, data.duration_mins, data.poster_url]
  );
  return result.rows[0];
};

const update = async (id, data) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    const event = memoryDb.events.find((e) => e.id === id);
    if (!event) return null;
    Object.assign(event, data, { updated_at: new Date().toISOString() });
    return event;
  }

  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClauses = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
  const result = await query(
    `UPDATE events SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] || null;
};

const remove = async (id) => {
  if (isUsingMemoryStore()) {
    const memoryDb = getMemoryDb();
    const event = memoryDb.events.find((e) => e.id === id);
    if (!event) return false;
    event.is_active = false;
    return true;
  }
  const result = await query('UPDATE events SET is_active = false WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
