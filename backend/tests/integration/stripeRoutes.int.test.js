const request = require('supertest');
const app = require('../../server');

jest.mock('stripe', () => () => ({
  checkout: {
    sessions: {
      create: jest.fn(async () => ({ id: 'cs_test', url: 'https://stripe.test' })),
      retrieve: jest.fn(async (id) => ({ id, payment_status: 'paid', amount_total: 100, currency: 'eur', customer_details: { email: 'a@b.c' }, metadata: {} })),
    },
  },
  paymentIntents: {
    create: jest.fn(async () => ({ client_secret: 'pi_secret', id: 'pi_test' })),
  },
}));

describe('Stripe routes', () => {
  test('public key', async () => {
    const res = await request(app).get('/api/stripe/public-key').expect(200);
    expect(res.body.success).toBe(true);
  });

  test('create checkout session', async () => {
    const res = await request(app)
      .post('/api/stripe/create-checkout-session')
      .send({ amount: 10, successUrl: 'http://localhost/s', cancelUrl: 'http://localhost/c' })
      .expect(200);
    expect(res.body.sessionId).toBe('cs_test');
  });

  test('retrieve session', async () => {
    const res = await request(app).get('/api/stripe/session/cs_test').expect(200);
    expect(res.body.session.id).toBe('cs_test');
  });

  test('create payment intent', async () => {
    const res = await request(app)
      .post('/api/stripe/create-payment-intent')
      .send({ amount: 5 })
      .expect(200);
    expect(res.body.clientSecret).toBeDefined();
  });
});
