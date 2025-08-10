const jwt = require('jsonwebtoken');

const tokenBlacklist = new Set();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      message: 'Token d\'authentification requis',
      error: 'MISSING_TOKEN' 
    });
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ 
      message: 'Format du token invalide. Utilisez: Bearer <token>',
      error: 'INVALID_TOKEN_FORMAT' 
    });
  }

  const token = parts[1];

  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ 
      message: 'Token révoqué',
      error: 'REVOKED_TOKEN' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return res.status(401).json({ 
        message: 'Token expiré',
        error: 'EXPIRED_TOKEN' 
      });
    }

    if (!decoded.id || !decoded.email) {
      return res.status(401).json({ 
        message: 'Token invalide - structure incorrecte',
        error: 'INVALID_TOKEN_STRUCTURE' 
      });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      organization_id: decoded.organization_id,
      username: decoded.username,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp
    };

    req.token = token;
    
    next();
  } catch (error) {
    console.warn(`[AUTH SECURITY] Token invalide détecté:`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.message,
      timestamp: new Date().toISOString()
    });

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expiré',
        error: 'EXPIRED_TOKEN' 
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token invalide',
        error: 'INVALID_TOKEN' 
      });
    } else {
      return res.status(401).json({ 
        message: 'Erreur d\'authentification',
        error: 'AUTH_ERROR' 
      });
    }
  }
};

const revokeToken = (token) => {
  tokenBlacklist.add(token);
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentification requise',
        error: 'AUTH_REQUIRED' 
      });
    }

    const userRole = req.user.role || 'user';
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      console.warn(`[AUTH SECURITY] Tentative d'accès non autorisée:`, {
        userId: req.user.id,
        userRole: userRole,
        requiredRoles: allowedRoles,
        ip: req.ip,
        url: req.originalUrl,
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({ 
        message: 'Accès refusé - permissions insuffisantes',
        error: 'INSUFFICIENT_PERMISSIONS' 
      });
    }

    next();
  };
};

const requireOrganization = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentification requise',
      error: 'AUTH_REQUIRED' 
    });
  }

  if (!req.user.organization_id) {
    return res.status(403).json({ 
      message: 'Accès refusé - organisation requise',
      error: 'ORGANIZATION_REQUIRED' 
    });
  }

  next();
};

module.exports = authMiddleware;
module.exports.revokeToken = revokeToken;
module.exports.requireRole = requireRole;
module.exports.requireOrganization = requireOrganization;