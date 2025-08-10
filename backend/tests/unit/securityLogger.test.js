const fs = require('fs');
const path = require('path');
const logger = require('../../middleware/securityLogger');

describe('securityLogger', () => {
  const logsDir = path.join(__dirname, '../../logs');

  test('écrit dans les fichiers de logs', () => {
    logger.security('test security', { k: 1 });
    logger.auth('test auth');
    logger.access('test access');

    const securityExists = fs.existsSync(path.join(logsDir, 'security.log'));
    const authExists = fs.existsSync(path.join(logsDir, 'auth.log'));
    const accessExists = fs.existsSync(path.join(logsDir, 'access.log'));
    expect(securityExists && authExists && accessExists).toBe(true);
  });

  test('middlewares existent', () => {
    expect(typeof logger.accessMiddleware).toBe('function');
    expect(typeof logger.suspiciousActivityMiddleware).toBe('function');
  });
});
