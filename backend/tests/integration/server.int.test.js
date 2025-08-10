const request = require('supertest');
const app = require('../../server');

describe('server basics', () => {
  test('health route', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body.status).toBe('OK');
  });

  test('404 route', async () => {
    const res = await request(app).get('/unknown-route').expect(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });
});
