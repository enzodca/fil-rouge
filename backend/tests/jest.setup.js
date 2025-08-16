jest.setTimeout(30000);

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecretjwt';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX_REQUESTS = '1000';
process.env.FRONTEND_ORIGIN = 'http://localhost:4200';
process.env.STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';

const consoleWarn = console.warn;
const consoleError = console.error;

beforeAll(() => {
  console.warn = (...args) => {
    if (String(args[0]).includes('[SECURITY')) return;
    consoleWarn(...args);
  };
  console.error = (...args) => {
    if (String(args[0]).includes('MongoDB') || String(args[0]).includes('Erreur')) return;
    consoleError(...args);
  };
});

afterAll(() => {
  console.warn = consoleWarn;
  console.error = consoleError;
});

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
