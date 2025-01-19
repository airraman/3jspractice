const jwt = require('jsonwebtoken');

// Generate JWT token for user
const generateToken = (user) => {
    return jwt.sign(
        { 
            userId: user._id,
            phoneNumber: user.phoneNumber
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '7d' // Token expires in 7 days
        }
    );
};

// Verify JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Create session token with subscription status
const createSessionToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            phoneNumber: user.phoneNumber,
            subscription: user.subscription,
            trialUsageRemaining: user.trialUsageRemaining
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '24h' // Session tokens expire in 24 hours
        }
    );
};

// Helper function to extract token from Authorization header
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7); // Remove 'Bearer ' prefix
};

module.exports = {
    generateToken,
    verifyToken,
    createSessionToken,
    extractTokenFromHeader
};