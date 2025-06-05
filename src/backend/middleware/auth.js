const User = require('../models/User');

/**
 * Middleware to check if user is authenticated (for API routes)
 */
const requireAuth = async (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    try {
        // Verify user still exists in database
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            // User was deleted, clear session
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destroy error:', err);
                }
            });
            
            return res.status(401).json({
                success: false,
                message: 'User account no longer exists'
            });
        }

        // Attach user to request for use in route handlers
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication check failed'
        });
    }
};

/**
 * Middleware to check if user is authenticated (for page routes)
 */
const requireAuthPage = async (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/auth.html');
    }

    try {
        // Verify user still exists in database
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            // User was deleted, clear session and redirect
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destroy error:', err);
                }
            });
            
            return res.redirect('/auth.html');
        }

        // Attach user to request for use in route handlers
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth page middleware error:', error);
        res.redirect('/auth.html');
    }
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
const redirectIfAuthenticated = async (req, res, next) => {
    if (!req.session.userId) {
        return next();
    }

    try {
        // Verify user still exists in database
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            // User was deleted, clear session and continue to auth page
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destroy error:', err);
                }
            });
            
            return next();
        }

        // User exists, redirect to main app
        return res.redirect('/');
    } catch (error) {
        console.error('Redirect middleware error:', error);
        next();
    }
};

module.exports = {
    requireAuth,
    requireAuthPage,
    attachUser,
    redirectIfAuthenticated
}; 