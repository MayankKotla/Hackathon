const jwt = require('jsonwebtoken');
const DatabaseService = require('../services/database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'flavorcraft_secret');
    const { data: user, error } = await DatabaseService.getUserById(decoded.userId);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.userId = user.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
