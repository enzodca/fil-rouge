const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../services/emailService');

const loginAttempts = new Map();
let _loginCleanupIntervalId = null;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000;

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    console.log(`[AUTH] Tentative d'inscription pour ${email} depuis ${req.ip}`);

    const domainVerification = await emailService.verifyEmailDomain(email);
    if (!domainVerification.isValid) {
      console.warn(`[SECURITY] Tentative d'inscription avec email invalide: ${email}`);
      return res.status(400).json({ 
        message: 'Adresse e-mail invalide', 
        error: 'INVALID_EMAIL_DOMAIN',
        details: domainVerification.details 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn(`[SECURITY] Tentative d'inscription avec email existant: ${email}`);
      return res.status(400).json({ 
        message: 'Un compte avec cet e-mail existe déjà',
        error: 'EMAIL_ALREADY_EXISTS' 
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ 
        message: 'Ce nom d\'utilisateur est déjà pris',
        error: 'USERNAME_ALREADY_EXISTS' 
      });
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({ 
      username, 
      email, 
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
      registrationIP: req.ip,
      registrationUserAgent: req.get('User-Agent')
    });

    const emailResult = await emailService.sendVerificationEmail(email, username, emailVerificationToken);
    
    if (!emailResult.success) {
      await User.findByIdAndDelete(user._id);
      console.error(`[EMAIL] Échec d'envoi d'email de vérification pour ${email}:`, emailResult.error);
      return res.status(500).json({ 
        message: 'Erreur lors de l\'envoi de l\'e-mail de vérification', 
        error: 'EMAIL_SEND_FAILED'
      });
    }

    console.log(`[AUTH] Inscription réussie pour ${email} (ID: ${user._id})`);

    res.status(201).json({ 
      message: 'Inscription réussie ! Vérifiez votre e-mail pour activer votre compte.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (err) {
    console.error('Erreur inscription:', err);
    res.status(400).json({ 
      message: "Erreur lors de l'inscription", 
      error: 'REGISTRATION_FAILED' 
    });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    console.log(`[AUTH] Tentative de vérification d'email avec token depuis ${req.ip}`);

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.warn(`[SECURITY] Token de vérification invalide ou expiré utilisé depuis ${req.ip}`);
      return res.status(400).json({ 
        message: 'Token de vérification invalide ou expiré',
        error: 'INVALID_VERIFICATION_TOKEN'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.emailVerifiedAt = new Date();
    await user.save();

    await emailService.sendWelcomeEmail(user.email, user.username);

    console.log(`[AUTH] Email vérifié avec succès pour ${user.email} (ID: ${user._id})`);

    res.json({ 
      message: 'E-mail vérifié avec succès ! Votre compte est maintenant actif.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (err) {
    console.error('Erreur vérification e-mail:', err);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: 'EMAIL_VERIFICATION_FAILED' 
    });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    console.log(`[AUTH] Demande de renvoi d'email de vérification pour ${email} depuis ${req.ip}`);

    const user = await User.findOne({ email });
    
    if (!user) {
      console.warn(`[SECURITY] Tentative de renvoi d'email pour utilisateur inexistant: ${email}`);
      return res.status(404).json({ 
        message: 'Utilisateur non trouvé',
        error: 'USER_NOT_FOUND' 
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ 
        message: 'E-mail déjà vérifié',
        error: 'EMAIL_ALREADY_VERIFIED' 
      });
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    const emailResult = await emailService.sendVerificationEmail(email, user.username, emailVerificationToken);
    
    if (!emailResult.success) {
      console.error(`[EMAIL] Échec de renvoi d'email de vérification pour ${email}:`, emailResult.error);
      return res.status(500).json({ 
        message: 'Erreur lors de l\'envoi de l\'e-mail', 
        error: 'EMAIL_SEND_FAILED'
      });
    }

    console.log(`[AUTH] Email de vérification renvoyé avec succès pour ${email}`);

    res.json({ 
      message: 'E-mail de vérification renvoyé avec succès',
      success: true 
    });

  } catch (err) {
    console.error('Erreur renvoi e-mail:', err);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: 'RESEND_EMAIL_FAILED' 
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const clientIP = req.ip;
  
  try {
    console.log(`[AUTH] Tentative de connexion pour ${email} depuis ${clientIP}`);

    const attemptKey = `${clientIP}:${email}`;
    const attempts = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: Date.now() };

    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      if (timeSinceLastAttempt < LOCKOUT_TIME) {
        const remainingTime = Math.ceil((LOCKOUT_TIME - timeSinceLastAttempt) / 60000);
        console.warn(`[SECURITY] Compte temporairement verrouillé pour ${email} depuis ${clientIP}`);
        return res.status(429).json({ 
          message: `Trop de tentatives de connexion. Réessayez dans ${remainingTime} minutes.`,
          error: 'ACCOUNT_TEMPORARILY_LOCKED',
          retryAfter: remainingTime
        });
      } else {
        loginAttempts.delete(attemptKey);
      }
    }

    const user = await User.findOne({ email }).populate('organization_id', 'name');
    if (!user) {
      attempts.count++;
      attempts.lastAttempt = Date.now();
      loginAttempts.set(attemptKey, attempts);
      
      console.warn(`[SECURITY] Tentative de connexion avec email inexistant: ${email} depuis ${clientIP}`);
      return res.status(401).json({ 
        message: 'Identifiants incorrects',
        error: 'INVALID_CREDENTIALS' 
      });
    }

    if (!user.isEmailVerified) {
      console.warn(`[SECURITY] Tentative de connexion avec email non vérifié: ${email}`);
      return res.status(401).json({ 
        message: 'Veuillez vérifier votre e-mail avant de vous connecter',
        error: 'EMAIL_NOT_VERIFIED',
        needsEmailVerification: true
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      attempts.count++;
      attempts.lastAttempt = Date.now();
      loginAttempts.set(attemptKey, attempts);
      
      console.warn(`[SECURITY] Mot de passe incorrect pour ${email} depuis ${clientIP}`);
      return res.status(401).json({ 
        message: 'Identifiants incorrects',
        error: 'INVALID_CREDENTIALS' 
      });
    }

    loginAttempts.delete(attemptKey);

    user.lastLoginAt = new Date();
    user.lastLoginIP = clientIP;
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        organization_id: user.organization_id?._id || null,
        organization_name: user.organization_id?.name || null,
        email: user.email,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: '1d',
        issuer: 'quizzgame-api',
        audience: 'quizzgame-client'
      }
    );

    console.log(`[AUTH] Connexion réussie pour ${email} (ID: ${user._id}) depuis ${clientIP}`);

    res.json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id?._id || null,
        organization_name: user.organization_id?.name || null
      }
    });

  } catch (err) {
    console.error('Erreur connexion:', err);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: 'LOGIN_FAILED' 
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -emailVerificationToken -__v')
      .populate('organization_id', 'name');
    
    if (!user) {
      return res.status(404).json({ 
        message: 'Utilisateur non trouvé',
        error: 'USER_NOT_FOUND' 
      });
    }

    res.json({
      success: true,
      user: user
    });
  } catch (err) {
    console.error('Erreur getMe:', err);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: 'GET_USER_FAILED' 
    });
  }
};

function startLoginAttemptsCleanup() {
  if (_loginCleanupIntervalId) return;
  _loginCleanupIntervalId = setInterval(() => {
    const now = Date.now();
    for (const [key, attempts] of loginAttempts.entries()) {
      if (now - attempts.lastAttempt > LOCKOUT_TIME) {
        loginAttempts.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

function stopLoginAttemptsCleanup() {
  if (_loginCleanupIntervalId) {
    clearInterval(_loginCleanupIntervalId);
    _loginCleanupIntervalId = null;
  }
}

if (process.env.NODE_ENV !== 'test') {
  startLoginAttemptsCleanup();
}

exports.startLoginAttemptsCleanup = startLoginAttemptsCleanup;
exports.stopLoginAttemptsCleanup = stopLoginAttemptsCleanup;

exports.logout = async (req, res) => {
  try {
    const token = req.token;
    const userId = req.user.id;

    const { revokeToken } = require('../middleware/authMiddleware');
    revokeToken(token);

    await User.findByIdAndUpdate(userId, {
      lastLogoutAt: new Date()
    });

    console.log(`[AUTH] Déconnexion réussie pour l'utilisateur ${userId} depuis ${req.ip}`);

    res.json({
      message: 'Déconnexion réussie',
      success: true
    });

  } catch (err) {
    console.error('Erreur déconnexion:', err);
    res.status(500).json({
      message: 'Erreur lors de la déconnexion',
      error: 'LOGOUT_FAILED'
    });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    console.log(`[AUTH] Demande de réinitialisation de mot de passe pour ${email} depuis ${req.ip}`);
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: 'Si un compte existe, un e-mail a été envoyé pour réinitialiser le mot de passe.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    user.passwordResetRequestedAt = new Date();
    await user.save();

    const emailResult = await emailService.sendPasswordResetEmail(user.email, user.username || user.email, token);
    if (!emailResult.success) {
      console.error(`[EMAIL] Échec d'envoi d'email de réinitialisation pour ${email}:`, emailResult.error);
      return res.status(500).json({ message: "Erreur lors de l'envoi de l'e-mail", error: 'EMAIL_SEND_FAILED' });
    }

    res.json({ message: 'E-mail de réinitialisation envoyé si le compte existe.' });

  } catch (err) {
    console.error('Erreur forgotPassword:', err);
    res.status(500).json({ message: 'Erreur serveur', error: 'FORGOT_PASSWORD_FAILED' });
  }
};

exports.validateResetToken = async (req, res) => {
  const { token } = req.query;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ message: 'Token invalide ou expiré', error: 'INVALID_RESET_TOKEN' });
    }
    return res.json({ message: 'Token valide', success: true });
  } catch (err) {
    console.error('Erreur validateResetToken:', err);
    res.status(500).json({ message: 'Erreur serveur', error: 'VALIDATE_RESET_TOKEN_FAILED' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
  return res.status(400).json({ message: 'Le lien de réinitialisation est invalide ou expiré', error: 'INVALID_RESET_TOKEN' });
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    user.password = await bcrypt.hash(password, saltRounds);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

  res.json({ message: 'Mot de passe réinitialisé avec succès', success: true });
  } catch (err) {
    console.error('Erreur resetPassword:', err);
  res.status(500).json({ message: 'Erreur serveur lors de la réinitialisation', error: 'RESET_PASSWORD_FAILED' });
  }
};