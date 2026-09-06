const request = require('supertest');
const app = require('../src/app');
const { getMemoryDb } = require('../src/config/db');
const { getRedisClient } = require('../src/config/redis');
require('./setup');

describe('SeatSync High-Concurrency Booking & Race Condition Prevention Suite', () => {
  let user1Token;
  let user2Token;
  let showId;
  let targetSeatId;

  beforeAll(async () => {
    // Login User 1
    const res1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@seatsync.com', password: 'Password@123' });
    user1Token = res1.body.data.token;

    // Login User 2
    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alex@seatsync.com', password: 'Password@123' });
    user2Token = res2.body.data.token;

    // Fetch shows
    const eventsRes = await request(app).get('/api/events');
    const firstEvent = eventsRes.body.data.events[0];
    const showsRes = await request(app).get(`/api/shows/event/${firstEvent.id}`);
    showId = showsRes.body.data.shows[0].id;

    // Pick an available seat (e.g. D5)
    const seatsRes = await request(app).get(`/api/shows/${showId}/seats`);
    const availableSeat = seatsRes.body.data.seats.find((s) => s.lockStatus === 'AVAILABLE' && s.seat_number === 'D5');
    targetSeatId = availableSeat ? availableSeat.id : seatsRes.body.data.seats.find((s) => s.lockStatus === 'AVAILABLE').id;
  });

  afterEach(async () => {
    // Clean up locks after each test
    const redis = await getRedisClient();
    await redis.del(`seat-lock:${showId}:${targetSeatId}`);
  });

  it('SIMULTANEOUS SEAT LOCK: guarantees ONE seat -> ONE successful lock under concurrent requests', async () => {
    // User 1 and User 2 send lock requests at the EXACT same time
    const [req1, req2] = await Promise.all([
      request(app)
        .post(`/api/shows/${showId}/seats/lock`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ seatIds: [targetSeatId] }),

      request(app)
        .post(`/api/shows/${showId}/seats/lock`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ seatIds: [targetSeatId] }),
    ]);

    const statuses = [req1.statusCode, req2.statusCode];

    // Assert: Exactly one 200 OK and exactly one 409 Conflict
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);

    const winningReq = req1.statusCode === 200 ? req1 : req2;
    const losingReq = req1.statusCode === 409 ? req1 : req2;

    expect(winningReq.body.success).toBe(true);
    expect(winningReq.body.data.lockedSeatIds).toContain(targetSeatId);

    expect(losingReq.body.success).toBe(false);
    expect(losingReq.body.errorCode).toBe('SEAT_HELD_BY_ANOTHER_USER');
  });

  it('PREVENT DOUBLE-BOOKING: rejects booking a seat that another user locked', async () => {
    // 1. User 1 locks target seat
    const lockRes = await request(app)
      .post(`/api/shows/${showId}/seats/lock`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ seatIds: [targetSeatId] });

    expect(lockRes.statusCode).toBe(200);

    // 2. User 2 attempts to checkout/book this exact seat
    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        showId,
        seatIds: [targetSeatId],
      });

    // 3. User 2 must be strictly rejected
    expect(bookRes.statusCode).toBe(409);
    expect(bookRes.body.errorCode).toBe('SEAT_HELD_BY_ANOTHER_USER');
  });

  it('CONCURRENCY SIMULATION ENDPOINT: handles 3-way race condition cleanly', async () => {
    const res = await request(app)
      .post('/api/concurrency/simulate-race')
      .send({ showId, seatNumber: 'C8' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.summary.totalCompetitors).toBe(3);
    expect(res.body.data.summary.successfulBookings).toBe(1);
    expect(res.body.data.summary.rejectedCollisions).toBe(2);
    expect(res.body.data.summary.guaranteeMaintained).toBe(true);
  });
});
