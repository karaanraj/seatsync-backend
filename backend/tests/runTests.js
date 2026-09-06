const request = require('supertest');
const app = require('../src/app');
const { initDb, getMemoryDb } = require('../src/config/db');
const { initRedis, getRedisClient } = require('../src/config/redis');
const { seedDatabase } = require('../src/db/seed');
const { v4: uuidv4 } = require('uuid');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

async function runAllTests() {
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}🧪 SeatSync Production Backend & Concurrency Suite 🧪${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  process.env.NODE_ENV = 'test';
  await initDb();
  await initRedis();
  await seedDatabase();

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ${colors.green}✔ PASS${colors.reset} ${name}`);
      passed++;
    } catch (err) {
      console.log(`  ${colors.red}✖ FAIL${colors.reset} ${name}`);
      console.error(`    ${colors.red}${err.message}${colors.reset}`);
      failed++;
    }
  }

  // Suite 1: Authentication & RBAC
  console.log(`${colors.bold}Suite 1: Authentication & Role-Based Access Control (RBAC)${colors.reset}`);
  let user1Token, user2Token, adminToken;
  const testEmail = `test_runner_${Date.now()}@example.com`;

  await test('POST /api/auth/register - registers new user and issues JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test Runner', email: testEmail, password: 'Password@123' });
    if (res.statusCode !== 201) throw new Error(`Expected 201, got ${res.statusCode}: ${JSON.stringify(res.body)}`);
    if (!res.body.data.token) throw new Error('Token missing in response');
    if (res.body.data.user.password_hash) throw new Error('Password hash leaked!');
  });

  await test('POST /api/auth/register - rejects duplicate email with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Duplicate User', email: testEmail, password: 'Password@123' });
    if (res.statusCode !== 409) throw new Error(`Expected 409, got ${res.statusCode}`);
  });

  await test('POST /api/auth/login - authenticates user & admin correctly', async () => {
    const u1 = await request(app).post('/api/auth/login').send({ email: 'user@seatsync.com', password: 'Password@123' });
    if (u1.statusCode !== 200) throw new Error('User login failed');
    user1Token = u1.body.data.token;

    const u2 = await request(app).post('/api/auth/login').send({ email: 'alex@seatsync.com', password: 'Password@123' });
    if (u2.statusCode !== 200) throw new Error('User 2 login failed');
    user2Token = u2.body.data.token;

    const adm = await request(app).post('/api/auth/login').send({ email: 'admin@seatsync.com', password: 'Admin@123' });
    if (adm.statusCode !== 200) throw new Error('Admin login failed');
    adminToken = adm.body.data.token;
  });

  await test('GET /api/admin/dashboard - guards admin endpoint with 403 for regular user', async () => {
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${user1Token}`);
    if (res.statusCode !== 403) throw new Error(`Expected 403 Forbidden, got ${res.statusCode}`);
  });

  await test('GET /api/admin/dashboard - grants access to admin (200 OK)', async () => {
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${adminToken}`);
    if (res.statusCode !== 200) throw new Error(`Expected 200 OK, got ${res.statusCode}`);
    if (!res.body.data.metrics) throw new Error('Metrics data missing');
  });

  // Suite 2: Events & Seating Layout
  console.log(`\n${colors.bold}Suite 2: Events & Real-time Seating Layout${colors.reset}`);
  let showId, targetSeat;

  await test('GET /api/events - lists events with starting price & shows', async () => {
    const res = await request(app).get('/api/events');
    if (res.statusCode !== 200) throw new Error('Failed to fetch events');
    if (res.body.data.events.length === 0) throw new Error('No events returned');
  });

  await test('GET /api/shows/:showId/seats - returns seat inventory with live Redis lock states', async () => {
    const eventsRes = await request(app).get('/api/events');
    const firstEvent = eventsRes.body.data.events[0];
    const showsRes = await request(app).get(`/api/shows/event/${firstEvent.id}`);
    showId = showsRes.body.data.shows[0].id;

    const seatsRes = await request(app).get(`/api/shows/${showId}/seats`).set('Authorization', `Bearer ${user1Token}`);
    if (seatsRes.statusCode !== 200) throw new Error('Failed to fetch seats');
    const seats = seatsRes.body.data.seats;
    targetSeat = seats.find((s) => s.lockStatus === 'AVAILABLE' && s.seat_number === 'C5') || seats[15];
  });

  // Suite 3: Concurrency Control & Race Condition Prevention
  console.log(`\n${colors.bold}Suite 3: Concurrency Control & Race Condition Protection${colors.reset}`);

  await test('SIMULTANEOUS LOCK: 2 users request SAME seat simultaneously -> Exactly ONE wins, ONE gets 409', async () => {
    const [req1, req2] = await Promise.all([
      request(app).post(`/api/shows/${showId}/seats/lock`).set('Authorization', `Bearer ${user1Token}`).send({ seatIds: [targetSeat.id] }),
      request(app).post(`/api/shows/${showId}/seats/lock`).set('Authorization', `Bearer ${user2Token}`).send({ seatIds: [targetSeat.id] }),
    ]);

    const statuses = [req1.statusCode, req2.statusCode];
    if (!statuses.includes(200) || !statuses.includes(409)) {
      throw new Error(`Expected exactly one 200 and one 409, got [${statuses.join(', ')}]`);
    }

    const winningReq = req1.statusCode === 200 ? req1 : req2;
    const losingReq = req1.statusCode === 409 ? req1 : req2;

    if (winningReq.body.data.lockTtlSeconds !== 600) throw new Error('Lock TTL should be 600 seconds');
    if (losingReq.body.errorCode !== 'SEAT_HELD_BY_ANOTHER_USER') throw new Error('Incorrect conflict errorCode');
  });

  await test('PREVENT DOUBLE-BOOKING: rejects checkout booking request for seat held by another user', async () => {
    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ showId, seatIds: [targetSeat.id] });

    if (bookRes.statusCode !== 409) {
      throw new Error(`Expected 409 conflict, got ${bookRes.statusCode}`);
    }
  });

  await test('RELEASE LOCK: winner releases lock, seat immediately available again', async () => {
    const rel = await request(app)
      .delete(`/api/shows/${showId}/seats/lock`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ seatIds: [targetSeat.id] });
    if (rel.statusCode !== 200) throw new Error('Failed to release lock');

    const seatsCheck = await request(app).get(`/api/shows/${showId}/seats`);
    const refreshed = seatsCheck.body.data.seats.find((s) => s.id === targetSeat.id);
    if (refreshed.lockStatus !== 'AVAILABLE') throw new Error(`Expected AVAILABLE, got ${refreshed.lockStatus}`);
  });

  // Suite 4: Idempotency & Payments
  console.log(`\n${colors.bold}Suite 4: Idempotency Key & Simulated Payment State Machine${colors.reset}`);
  let createdBookingId;

  await test('IDEMPOTENCY KEY: safe retries prevent duplicate booking creation', async () => {
    const idempKey = `idemp-test-${uuidv4()}`;

    // Lock seat
    await request(app).post(`/api/shows/${showId}/seats/lock`).set('Authorization', `Bearer ${user1Token}`).send({ seatIds: [targetSeat.id] });

    // Call 1
    const res1 = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user1Token}`)
      .set('Idempotency-Key', idempKey)
      .send({ showId, seatIds: [targetSeat.id] });

    if (res1.statusCode !== 201) throw new Error(`Booking call 1 failed with ${res1.statusCode}`);
    createdBookingId = res1.body.data.booking.bookingId || res1.body.data.booking.id;

    // Call 2 with identical key
    const res2 = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user1Token}`)
      .set('Idempotency-Key', idempKey)
      .send({ showId, seatIds: [targetSeat.id] });

    if (res2.statusCode !== 201) throw new Error(`Booking call 2 failed with ${res2.statusCode}`);
    const secondId = res2.body.data.booking.bookingId || res2.body.data.booking.id;

    if (createdBookingId !== secondId) {
      throw new Error(`Idempotency breached! Duplicate booking created (${createdBookingId} vs ${secondId})`);
    }
  });

  await test('PAYMENT FAILURE: marks booking FAILED & frees seat back to AVAILABLE', async () => {
    const payRes = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ bookingId: createdBookingId, paymentMethod: 'DEMO', simulateOutcome: 'FAILED' });

    if (payRes.statusCode !== 200) throw new Error('Payment endpoint failed');
    if (payRes.body.data.status !== 'FAILED') throw new Error(`Expected status FAILED, got ${payRes.body.data.status}`);
  });

  await test('PAYMENT SUCCESS: confirms booking, marks seats BOOKED, and enqueues notification', async () => {
    // Pick another seat
    const seatsRes = await request(app).get(`/api/shows/${showId}/seats`);
    const newSeat = seatsRes.body.data.seats.find((s) => s.lockStatus === 'AVAILABLE' && s.seat_number === 'E1');

    await request(app).post(`/api/shows/${showId}/seats/lock`).set('Authorization', `Bearer ${user1Token}`).send({ seatIds: [newSeat.id] });

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ showId, seatIds: [newSeat.id] });

    const newBookingId = bookRes.body.data.booking.bookingId;

    const payRes = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ bookingId: newBookingId, paymentMethod: 'UPI', simulateOutcome: 'SUCCESS' });

    if (payRes.statusCode !== 200) throw new Error('Payment success failed');
    if (payRes.body.data.status !== 'CONFIRMED') throw new Error(`Expected CONFIRMED, got ${payRes.body.data.status}`);

    const seatCheck = await request(app).get(`/api/shows/${showId}/seats`);
    const confirmedSeat = seatCheck.body.data.seats.find((s) => s.id === newSeat.id);
    if (confirmedSeat.lockStatus !== 'BOOKED') throw new Error('Seat should be permanently BOOKED after payment success');
  });

  // Suite 5: Concurrency Simulation Benchmark
  console.log(`\n${colors.bold}Suite 5: 3-Way Real-time Concurrency Battle Benchmark${colors.reset}`);

  await test('POST /api/concurrency/simulate-race - 3 virtual users compete for Seat A10 in parallel', async () => {
    const res = await request(app).post('/api/concurrency/simulate-race').send({ showId, seatNumber: 'A10' });
    if (res.statusCode !== 200) throw new Error('Concurrency simulation failed');
    const { summary } = res.body.data;
    if (summary.totalCompetitors !== 3) throw new Error('Competitors count mismatch');
    if (summary.successfulBookings !== 1) throw new Error(`Expected 1 winner, got ${summary.successfulBookings}`);
    if (summary.rejectedCollisions !== 2) throw new Error(`Expected 2 collisions, got ${summary.rejectedCollisions}`);
    if (!summary.guaranteeMaintained) throw new Error('Concurrency guarantee violated!');
  });

  console.log(`\n${colors.bold}====================================================${colors.reset}`);
  console.log(`${colors.bold}Test Results:${colors.reset} ${colors.green}${passed} Passed${colors.reset}, ${colors.red}${failed} Failed${colors.reset}`);
  console.log(`${colors.bold}====================================================${colors.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
