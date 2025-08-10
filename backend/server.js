const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const compression = require('compression');
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const stripeRoutes = require('./routes/stripeRoutes');

const {
  helmetConfig,
  generalLimiter,
  xssProtection,
  securityLogger,
  httpParameterPollution
} = require('./middleware/securityMiddleware');

const logger = require('./middleware/securityLogger');

dotenv.config();

const app = express();

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL_PRODUCTION] 
    : [process.env.FRONTEND_URL_LOCAL, 'http://127.0.0.1:4200'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
};

app.use(helmetConfig);
app.use(compression());
app.use(cors(corsOptions));
if (process.env.NODE_ENV !== 'test') {
  app.use(generalLimiter);
}
app.use(logger.accessMiddleware());
app.use(logger.suspiciousActivityMiddleware());
app.use(securityLogger);
app.use(httpParameterPollution);
app.use(xssProtection);

app.use(express.json({ 
  limit: process.env.NODE_ENV === 'production' ? '10mb' : '50mb',
  verify: (req, res, buf) => {
    if (buf && buf.length > 0) {
      const payload = buf.toString();
      if (payload.includes('<script>') || payload.includes('javascript:')) {
        logger.alert('Payload JavaScript malveillant détecté', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          payload: payload.substring(0, 200)
        });
        throw new Error('Payload suspect détecté');
      }
    }
  }
}));

app.use(express.urlencoded({ 
  limit: process.env.NODE_ENV === 'production' ? '10mb' : '50mb',
  extended: true,
  parameterLimit: 20
}));

const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxIdleTimeMS: 30000,
  bufferCommands: false,
  autoIndex: process.env.NODE_ENV !== 'production'
};

const mongoURI = process.env.NODE_ENV === 'production' 
  ? process.env.MONGO_URI_ATLAS 
  : process.env.MONGO_URI;

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(mongoURI, mongoOptions)
    .then(() => {
      console.log('✓ MongoDB connecté avec succès');
      logger.log('INFO', 'Base de données connectée', {
        environment: process.env.NODE_ENV || 'development'
      });
      if (process.env.NODE_ENV === 'development') {
        console.log('✓ Mode développement activé');
      }
    })
    .catch(err => {
      console.error('✗ Erreur de connexion MongoDB:', err.message);
      logger.alert('Échec de connexion à la base de données', {
        error: err.message
      });
      process.exit(1);
    });
}

mongoose.connection.on('error', (err) => {
  console.error('Erreur MongoDB:', err);
  logger.alert('Erreur de base de données', {
    error: err.message
  });
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB déconnecté');
  logger.alert('Base de données déconnectée');
});

app.use((err, req, res, next) => {
  const errorInfo = {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || null,
    timestamp: new Date().toISOString()
  };

  console.error('Erreur globale:', errorInfo);
  logger.alert('Erreur serveur', errorInfo);

  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      message: 'Une erreur interne s\'est produite',
      error: 'INTERNAL_SERVER_ERROR'
    });
  } else {
    res.status(500).json({
      message: err.message,
      error: err.stack
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/stripe', stripeRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.use('*', (req, res) => {
  logger.security('Route non trouvée', {
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    message: 'Route non trouvée',
    error: 'NOT_FOUND'
  });
});

const PORT = process.env.PORT || 3000;

let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
    console.log(`🔒 Sécurité activée: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Développement'}`);
    
    logger.log('INFO', 'Serveur démarré', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      securityMode: process.env.NODE_ENV === 'production' ? 'Production' : 'Développement'
    });
  });
}

const gracefulShutdown = (signal) => {
  console.log(`${signal} reçu, arrêt du serveur...`);
  logger.log('INFO', `Arrêt du serveur (${signal})`);
  if (typeof logger.stopCleanup === 'function') {
    logger.stopCleanup();
  }
  try {
    const authController = require('./controllers/authController');
    if (typeof authController.stopLoginAttemptsCleanup === 'function') {
      authController.stopLoginAttemptsCleanup();
    }
  } catch (_) {}
  
  server.close(() => {
    console.log('Serveur arrêté');
    mongoose.connection.close(false, () => {
      console.log('Connexion MongoDB fermée');
      logger.log('INFO', 'Serveur et base de données fermés');
      process.exit(0);
    });
  });
};

if (process.env.NODE_ENV !== 'test') {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    console.error('Exception non capturée:', err);
    logger.alert('Exception non capturée', {
      error: err.message,
      stack: err.stack
    });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesse rejetée non gérée:', reason);
    logger.alert('Promesse rejetée non gérée', {
      reason: reason.toString(),
      promise: promise.toString()
    });
  });
}

module.exports = app;
