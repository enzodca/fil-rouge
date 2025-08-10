const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('../test-db');
const app = require('../../server');
const User = require('../../models/User');

jest.mock('../../services/emailService', () => ({
  verifyEmailDomain: jest.fn(async () => ({ isValid: true })),
  sendVerificationEmail: jest.fn(async () => ({ success: true })),
  sendWelcomeEmail: jest.fn(async () => ({ success: true })),
}));

describe('Organization routes', () => {
  let token;
  let userId;

  beforeAll(async () => {
    await connect();
  });
  afterAll(async () => {
    await closeDatabase();
  });
  afterEach(async () => {
    await clearDatabase();
  });

  const registerLogin = async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'owner', email: 'owner@example.com', password: 'Password@123' })
      .expect(201);
    let user = await User.findOne({ email: 'owner@example.com' });
    user.isEmailVerified = true;
    await user.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@example.com', password: 'Password@123' })
      .expect(200);
    token = loginRes.body.token;
    userId = loginRes.body.user.id;
  };

  test('create/get/update/delete organization', async () => {
    await registerLogin();

    const createRes = await request(app)
      .post('/api/organization')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Org' })
      .expect(201);

    const orgId = createRes.body.organization._id;

    const getRes = await request(app)
      .get(`/api/organization/${orgId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(getRes.body.name).toBe('My Org');

    await request(app)
      .put(`/api/organization/${orgId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' })
      .expect(200);

    await request(app)
      .delete(`/api/organization/${orgId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
