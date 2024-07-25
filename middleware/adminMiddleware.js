const jwt = require('jsonwebtoken');
const User = require('../model/userModel'); 
const jwtSecret = process.env.JWT_SECRET

// Middleware to verify token and admin role
const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Only admins can access this route.' });
    }

    req.user = user; 
    next();
  } catch (err) {

    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
