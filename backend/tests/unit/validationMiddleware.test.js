const express = require('express');
const request = require('supertest');
const { validateRegister, handleValidationErrors } = require('../../middleware/validationMiddleware');

describe('validationMiddleware', () => {
  test('validateRegister rejette données invalides', async () => {
    const app = express();
    app.use(express.json());
    app.post('/test', [...validateRegister, handleValidationErrors], (req, res) => res.json({ ok: true }));

    const res = await request(app)
      .post('/test')
      .send({ username: 'a', email: 'bad', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('handleValidationErrors passe si pas d\'erreur', async () => {
    const app = express();
    app.use(express.json());
    app.post('/test', handleValidationErrors, (req, res) => res.json({ ok: true }));
    const res = await request(app).post('/test').send({});
    expect(res.status).toBe(200);
  });
});
