const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('SeatSync Redis Seat Locking & Release Suite', () => {
  let userToken;
  let showId;
  let seatId;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@seatsync.com', password: 'Password@123' });
    userToken = loginRes.body.data.token;

    const eventsRes = await request(app).get('/api/events');
    const showsRes = await request(app).get(`/api/shows/event/${eventsRes.body.data.events[0].id}`);
    showId = showsRes.body.data.shows[0].id;

    const seatsRes = await request(app).get(`/api/shows/${showId}/seats`);
    const available = seatsRes.body.data.seats.find((s) => s.lockStatus === 'AVAILABLE' && s.seat_number === 'B3');
    seatId = available.id;
  });

  it('LOCK & RELEASE: successfully locks seat and releases it on deselect', async () => {
    // 1. Lock seat
    const lockRes = await request(app)
      .post(`/api/shows/${showId}/seats/lock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ seatIds: [seatId] });

    expect(lockRes.statusCode).toBe(200);
    expect(lockRes.body.data.lockTtlSeconds).toBe(600);

    // 2. Verify state shows LOCKED_BY_CURRENT_USER for this user
    const seatsRes1 = await request(app)
      .get(`/api/shows/${showId}/seats`)
      .set('Authorization', `Bearer ${userToken}`);
    const seatAfterLock = seatsRes1.body.data.seats.find((s) => s.id === seatId);
    expect(seatAfterLock.lockStatus).toBe('LOCKED_BY_CURRENT_USER');
    expect(seatAfterLock.isSelectable).toBe(true);

    // 3. Release seat
    const releaseRes = await request(app)
      .delete(`/api/shows/${showId}/seats/lock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ seatIds: [seatId] });

    expect(releaseRes.statusCode).toBe(200);

    // 4. Verify seat is back to AVAILABLE
    const seatsRes2 = await request(app).get(`/api/shows/${showId}/seats`);
    const seatAfterRelease = seatsRes2.body.data.seats.find((s) => s.id === seatId);
    expect(seatAfterRelease.lockStatus).toBe('AVAILABLE');
  });
});
