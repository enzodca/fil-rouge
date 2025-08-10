const { helmetConfig, generalLimiter, xssProtection, httpParameterPollution } = require('../../middleware/securityMiddleware');

describe('securityMiddleware', () => {
  test('helmetConfig est une fonction middleware', () => {
    expect(typeof helmetConfig).toBe('function');
  });

  test('xssProtection nettoie les strings', () => {
    const req = { body: { a: '<script>alert(1)</script>' }, query: { b: 'ok<script>' }, params: { id: '1<script>' } };
    const res = {};
    const next = jest.fn();
    xssProtection(req, res, next);
    expect(req.body.a).not.toContain('<script>');
    expect(req.query.b).not.toContain('<script>');
    expect(req.params.id).not.toContain('<script>');
    expect(next).toHaveBeenCalled();
  });

  test('httpParameterPollution whitelist ne jette pas', () => {
    const req = { query: { tags: ['a','b'] } };
    const res = {};
    const next = jest.fn();
    httpParameterPollution(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('rate limiter est une fonction middleware', () => {
    expect(typeof generalLimiter).toBe('function');
  });
});
