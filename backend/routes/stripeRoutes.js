const express = require('express');
const router = express.Router();
const {
  createPaymentSession,
  getPaymentSession,
  getPublicKey,
  createPaymentIntent
} = require('../controllers/stripeController');

router.get('/public-key', getPublicKey);

router.post('/create-checkout-session', createPaymentSession);

router.get('/session/:sessionId', getPaymentSession);

router.post('/create-payment-intent', createPaymentIntent);

module.exports = router;
