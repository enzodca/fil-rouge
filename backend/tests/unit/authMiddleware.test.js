const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middleware/authMiddleware');

describe('authMiddleware', () => {
  const next = jest.fn();
  const res = () => {
    const r = {};
    r.status = jest.fn().mockReturnValue(r);
    r.json = jest.fn().mockReturnValue(r);
    return r;
  };

  test('401 si pas d\'Authorization', () => {
    const req = { headers: {} };
    const response = res();
    authMiddleware(req, response, next);
    expect(response.status).toHaveBeenCalledWith(401);
  });

  test('401 si format invalide', () => {
    const req = { headers: { authorization: 'Token abc' } };
    const response = res();
    authMiddleware(req, response, next);
    expect(response.status).toHaveBeenCalledWith(401);
  });

  test('401 si token révoqué', () => {
    const req = { headers: { authorization: 'Bearer revoked' } };
    const response = res();
    const { revokeToken } = require('../../middleware/authMiddleware');
    revokeToken('revoked');
    authMiddleware(req, response, next);
    expect(response.status).toHaveBeenCalledWith(401);
  });

  test('OK si token valide', () => {
    const token = jwt.sign({ id: 'u1', email: 'a@b.c' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` }, get: () => undefined, ip: '::1' };
    const response = res();
    authMiddleware(req, response, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe('u1');
    expect(req.token).toBe(token);
  });

  test('401 si token expiré', async () => {
    const token = jwt.sign({ id: 'u1', email: 'a@b.c' }, process.env.JWT_SECRET, { expiresIn: -1 });
    const req = { headers: { authorization: `Bearer ${token}` }, get: () => undefined, ip: '::1' };
    const response = res();
    authMiddleware(req, response, next);
    expect(response.status).toHaveBeenCalledWith(401);
  });
});
