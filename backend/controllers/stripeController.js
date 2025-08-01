const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createPaymentSession = async (req, res) => {
  try {
    const { amount, currency = 'eur', successUrl, cancelUrl, metadata = {} } = req.body;

    if (!amount || !successUrl || !cancelUrl) {
      return res.status(400).json({
        success: false,
        message: 'Amount, successUrl et cancelUrl sont requis'
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'Donation QuizzGame',
              description: 'Merci pour votre soutien !',
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: metadata,
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la session de paiement',
      error: error.message
    });
  }
};

const getPaymentSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_details?.email,
        metadata: session.metadata
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la session',
      error: error.message
    });
  }
};

const getPublicKey = async (req, res) => {
  try {
    res.json({
      success: true,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la clé publique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la clé publique'
    });
  }
};

const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'eur', metadata = {} } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Le montant est requis'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency,
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Erreur lors de la création du PaymentIntent:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du PaymentIntent',
      error: error.message
    });
  }
};

module.exports = {
  createPaymentSession,
  getPaymentSession,
  getPublicKey,
  createPaymentIntent
};
