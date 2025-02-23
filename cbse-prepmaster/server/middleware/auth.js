const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token middleware
exports.verifyToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Check if user is admin middleware
exports.isAdmin = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Check if user is student middleware
exports.isStudent = async (req, res, next) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Access denied. Student privileges required.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Check if user has access to specific test
exports.hasTestAccess = async (req, res, next) => {
    try {
        const testId = req.params.testId;
        const test = await Test.findById(testId);
        
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        // Admin has access to all tests
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if student is assigned to the test
        if (!test.assignedTo.includes(req.user._id)) {
            return res.status(403).json({ message: 'Access denied. Test not assigned to user.' });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
