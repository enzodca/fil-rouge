const { connect, closeDatabase, clearDatabase } = require('../test-db');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Organization = require('../../models/Organization');
const Quiz = require('../../models/Quiz');
const Question = require('../../models/Question');
const Answer = require('../../models/Answer');
const QuizResult = require('../../models/QuizResult');

describe('Models', () => {
  beforeAll(async () => {
    await connect();
  });
  afterAll(async () => {
    await closeDatabase();
  });
  afterEach(async () => {
    await clearDatabase();
  });

  test('User CRUD + toJSON cache mot de passe', async () => {
    const u = await User.create({ username: 'john_doe', email: 'john@example.com', password: 'hashed123' });
    const json = u.toJSON();
    expect(json.password).toBeUndefined();
  });

  test('Organization unique name', async () => {
    await Organization.init();
    await Organization.create({ name: 'Org 1' });
    await expect(Organization.create({ name: 'Org 1' })).rejects.toThrow();
  });

  test('Quiz -> Question -> Answer relation', async () => {
    const u = await User.create({ username: 'user1', email: 'u1@e.com', password: 'hashed1234' });
    const qz = await Quiz.create({ title: 'T', creator_id: u._id, visibility: 'public' });
    const q = await Question.create({ content: 'C?', type: 'mcq', quiz_id: qz._id });
    const a = await Answer.create({ content: 'A', is_correct: true, question_id: q._id });
    expect(a.question_id.toString()).toBe(q._id.toString());
  });

  test('QuizResult index composite', async () => {
    const u = await User.create({ username: 'user2', email: 'u2@e.com', password: 'hashed1234' });
    const qz = await Quiz.create({ title: 'T2', creator_id: u._id, visibility: 'public' });
    await QuizResult.create({ quiz_id: qz._id, user_id: u._id, score: 1, total_questions: 1 });
    const results = await QuizResult.find({ quiz_id: qz._id, user_id: u._id });
    expect(results.length).toBe(1);
  });
});
