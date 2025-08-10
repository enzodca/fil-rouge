jest.mock('nodemailer', () => ({
  createTransport: () => ({ sendMail: jest.fn().mockResolvedValue({}) })
}));

const emailService = require('../../services/emailService');

describe('emailService', () => {
  test('verifyEmailDomain invalide format', async () => {
    const res = await emailService.verifyEmailDomain('bademail');
    expect(res.isValid).toBe(false);
  });

  test('sendVerificationEmail retourne success true (mock)', async () => {
    const res = await emailService.sendVerificationEmail('a@b.c', 'User', 'tok');
    expect(res.success).toBe(true);
  });

  test('sendWelcomeEmail retourne success true (mock)', async () => {
    const res = await emailService.sendWelcomeEmail('a@b.c', 'User');
    expect(res.success).toBe(true);
  });
});
