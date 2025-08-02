const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../services/emailService');

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    const domainVerification = await emailService.verifyEmailDomain(email);
    if (!domainVerification.isValid) {
      return res.status(400).json({ 
        message: 'Adresse e-mail invalide', 
        error: domainVerification.error,
        details: domainVerification.details 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Un compte avec cet e-mail existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await User.create({ 
      username, 
      email, 
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires
    });

    const emailResult = await emailService.sendVerificationEmail(email, username, emailVerificationToken);
    
    if (!emailResult.success) {
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ 
        message: 'Erreur lors de l\'envoi de l\'e-mail de vérification', 
        error: emailResult.error 
      });
    }

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
    res.status(400).json({ message: "Erreur lors de l'inscription", error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Token de vérification invalide ou expiré' 
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    await emailService.sendWelcomeEmail(user.email, user.username);

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
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'E-mail déjà vérifié' });
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    const emailResult = await emailService.sendVerificationEmail(email, user.username, emailVerificationToken);
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        message: 'Erreur lors de l\'envoi de l\'e-mail', 
        error: emailResult.error 
      });
    }

    res.json({ message: 'E-mail de vérification renvoyé avec succès' });

  } catch (err) {
    console.error('Erreur renvoi e-mail:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).populate('organization_id', 'name');
    if (!user) return res.status(401).json({ message: 'Email incorrect' });

    if (!user.isEmailVerified) {
      return res.status(401).json({ 
        message: 'Veuillez vérifier votre e-mail avant de vous connecter',
        needsEmailVerification: true
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Mot de passe incorrect' });

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        organization_id: user.organization_id?._id || null,
        organization_name: user.organization_id?.name || null,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('organization_id', 'name');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};