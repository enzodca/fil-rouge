const request = require('supertest');
const { connect, closeDatabase, clearDatabase } = require('../test-db');
const app = require('../../server');
const User = require('../../models/User');

jest.mock('../../services/emailService', () => ({
  verifyEmailDomain: jest.fn(async () => ({ isValid: true })),
  sendVerificationEmail: jest.fn(async () => ({ success: true })),
  sendWelcomeEmail: jest.fn(async () => ({ success: true })),
}));

describe('Quiz routes', () => {
  let token; let userId;

  beforeAll(async () => { await connect(); });
  afterAll(async () => { await closeDatabase(); });
  afterEach(async () => { await clearDatabase(); });

  const registerLogin = async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'creator', email: 'creator@example.com', password: 'Password@123' })
      .expect(201);
    let user = await User.findOne({ email: 'creator@example.com' });
    user.isEmailVerified = true;
    await user.save();
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'creator@example.com', password: 'Password@123' })
      .expect(200);
    token = loginRes.body.token;
    userId = loginRes.body.user.id;
  };

  test('create -> get/all -> update -> leaderboard -> delete', async () => {
    await registerLogin();

    const payload = {
      title: 'Quiz 1',
      description: 'Desc',
      visibility: 'public',
      has_timer: true,
      questions: [
        { content: 'Q1', type: 'mcq', time_limit: 30, answers: [ { content: 'A', is_correct: true }, { content: 'B', is_correct: false } ] }
      ]
    };

    const createRes = await request(app)
      .post('/api/quiz/create')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    const quizId = createRes.body.quizId;

    await request(app)
      .get('/api/quiz/all')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app)
      .put(`/api/quiz/${quizId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...payload, title: 'Quiz 1 updated' })
      .expect(200);

    await request(app)
      .post('/api/quiz/result')
      .set('Authorization', `Bearer ${token}`)
      .send({ quizId, score: 1, totalQuestions: 1, timeTaken: 10 })
      .expect(201);

    await request(app)
      .get(`/api/quiz/${quizId}/leaderboard`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app)
      .delete(`/api/quiz/${quizId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
