const User = require('../models/User');

/**
 * Middleware to check if user is authenticated (for API routes)
 */
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    next();
};

/**
 * Middleware to check if user is authenticated (for page routes)
 */
const requireAuthPage = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/auth.html');
    }
    next();
};

/**
 * Middleware to attach user info to request if authenticated
 */
const attachUser = async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            req.user = user;
        } catch (error) {
            console.error('Error attaching user:', error);
        }
    }
    next();
};

/**
 * Middleware to redirect authenticated users away from auth pages
 */
const redirectIfAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return res.redirect('/');
    }
    next();
};

module.exports = {
    requireAuth,
    requireAuthPage,
    attachUser,
    redirectIfAuthenticated
}; 