const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyEmail, resendVerificationEmail, logout } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter, registerLimiter } = require('../middleware/securityMiddleware');
const { 
  validateRegister, 
  validateLogin, 
  validateEmail,
  validateToken 
} = require('../middleware/validationMiddleware');

router.post('/register', registerLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.get('/verify-email', validateToken, verifyEmail);
router.post('/resend-verification', authLimiter, validateEmail, resendVerificationEmail);

router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);

module.exports = router;
