import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'amatalink_secret_key_2024';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Try query param if header is missing (useful for direct file downloads)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  // If no token, return unauthorized
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

export default { authenticateToken, requireRole };
