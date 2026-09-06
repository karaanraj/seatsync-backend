const request = require('supertest');
const app = require('../src/app');
const { v4: uuidv4 } = require('uuid');
require('./setup');

describe('SeatSync Idempotency API Suite', () => {
  let userToken;
  let showId;
  let seatId;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@seatsync.com', password: 'Password@123' });
    userToken = loginRes.body.data.token;

    const eventsRes = await request(app).get('/api/events');
    const eventId = eventsRes.body.data.events[0].id;
    const showsRes = await request(app).get(`/api/shows/event/${eventId}`);
    showId = showsRes.body.data.shows[0].id;

    const seatsRes = await request(app).get(`/api/shows/${showId}/seats`);
    const available = seatsRes.body.data.seats.find((s) => s.lockStatus === 'AVAILABLE' && s.seat_number === 'E8');
    seatId = available ? available.id : seatsRes.body.data.seats.find((s) => s.lockStatus === 'AVAILABLE').id;
  });

  it('IDEMPOTENCY: prevents duplicate booking creation when resending same Idempotency-Key', async () => {
    const idempotencyKey = `idemp-key-test-${uuidv4()}`;

    // 1. Lock seat first
    await request(app)
      .post(`/api/shows/${showId}/seats/lock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ seatIds: [seatId] });

    // 2. First booking call with Idempotency-Key
    const firstCall = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        showId,
        seatIds: [seatId],
      });

    expect(firstCall.statusCode).toBe(201);
    const bookingId1 = firstCall.body.data.booking.bookingId || firstCall.body.data.booking.id;

    // 3. Second booking call with EXACT SAME Idempotency-Key (simulating user double-click or network retry)
    const secondCall = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        showId,
        seatIds: [seatId],
      });

    expect(secondCall.statusCode).toBe(201);
    const bookingId2 = secondCall.body.data.booking.bookingId || secondCall.body.data.booking.id;

    // Assert: Must return the EXACT SAME booking, not create a duplicate!
    expect(bookingId1).toBe(bookingId2);
  });
});
