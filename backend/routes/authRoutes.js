const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyEmail, resendVerificationEmail } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

module.exports = router;
