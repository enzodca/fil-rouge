const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token requis' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      organization_id: decoded.organization_id,
      username: decoded.username,
      email: decoded.email
    };
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide' });
  }
};