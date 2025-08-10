const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('../test-db');
const app = require('../../server');
const User = require('../../models/User');

jest.mock('../../services/emailService', () => ({
  verifyEmailDomain: jest.fn(async (email) => ({ isValid: email.includes('@'), details: null })),
  sendVerificationEmail: jest.fn(async () => ({ success: true })),
  sendWelcomeEmail: jest.fn(async () => ({ success: true })),
}));

describe('Auth routes', () => {
  beforeAll(async () => {
    await connect();
  });
  afterAll(async () => {
    await closeDatabase();
  });
  afterEach(async () => {
    await clearDatabase();
  });

  test('register -> verify-email -> login -> me -> logout', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ username: 'john_doe', email: 'john@example.com', password: 'Password@123' })
      .expect(201);

    const userInDb = await User.findOne({ email: 'john@example.com' });
    expect(userInDb).toBeTruthy();
    expect(userInDb.isEmailVerified).toBe(false);

    const verifyRes = await request(app)
      .get('/api/auth/verify-email')
      .query({ token: userInDb.emailVerificationToken })
      .expect(200);
    expect(verifyRes.body.user.isEmailVerified).toBe(true);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'Password@123' })
      .expect(200);

    const token = loginRes.body.token;

    await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
