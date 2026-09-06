const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('SeatSync Authentication & RBAC Suite', () => {
  const testEmail = `testuser_${Date.now()}@example.com`;

  it('should successfully register a new user and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Runner',
        email: testEmail,
        password: 'Password@123',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
    expect(res.body.data.user.password_hash).toBeUndefined(); // Never expose password hash
  });

  it('should reject registration with duplicate email with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate User',
        email: testEmail,
        password: 'Password@123',
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should successfully log in registered user with correct password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@seatsync.com',
        password: 'Password@123',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('user');
  });

  it('should reject login with wrong password (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@seatsync.com',
        password: 'WrongPassword!123',
      });

    expect(res.statusCode).toBe(401);
  });

  it('should reject a normal user from accessing admin dashboard with 403 Forbidden', async () => {
    // Login as normal user
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@seatsync.com',
        password: 'Password@123',
      });

    const userToken = loginRes.body.data.token;

    // Attempt admin endpoint
    const adminRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);

    expect(adminRes.statusCode).toBe(403);
    expect(adminRes.body.errorCode).toBe('FORBIDDEN');
  });

  it('should allow an admin to access the admin dashboard (200 OK)', async () => {
    // Login as admin
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@seatsync.com',
        password: 'Admin@123',
      });

    const adminToken = loginRes.body.data.token;

    const adminRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminRes.statusCode).toBe(200);
    expect(adminRes.body.data.metrics).toBeDefined();
    expect(adminRes.body.data.metrics.totalUsers).toBeGreaterThanOrEqual(1);
  });
});
