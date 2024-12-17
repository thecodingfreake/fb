const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate user
const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;
    console.log(token)

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findOne({ email: decoded.email });
        if (!req.user) {
            return res.status(404).json({ message: 'User not found' });
        }
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Middleware to check if the user is an admin
const isAdmin = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
    }

    next();
};

module.exports = { authMiddleware, isAdmin };
