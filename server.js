const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import database configuration
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (only enable if behind a reverse proxy)
if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', true);
}

// Import routes
const coursesRoutes = require('./routes/courses');
const topicsRoutes = require('./routes/topics');
const flashcardsRoutes = require('./routes/flashcards');
const setupRoutes = require('./routes/setup');

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "blob:"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (your frontend)
app.use(express.static(path.join(__dirname)));

// API routes
app.use('/api/courses', coursesRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/flashcards', flashcardsRoutes);
app.use('/api/setup', setupRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
    try {
        const { pool } = require('./config/database');
        
        // Test basic connection
        const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
        
        // Check if tables exist
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('courses', 'topics', 'flashcards')
            ORDER BY table_name
        `);
        
        res.json({
            success: true,
            message: 'Database connection successful',
            data: {
                currentTime: result.rows[0].current_time,
                postgresVersion: result.rows[0].pg_version,
                tablesFound: tablesResult.rows.map(row => row.table_name),
                tablesCount: tablesResult.rows.length
            }
        });
    } catch (error) {
        console.error('Database test failed:', error);
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Create sample data test endpoint
app.post('/api/test/create-sample', async (req, res) => {
    try {
        const { pool } = require('./config/database');
        
        // Create a sample course
        const courseResult = await pool.query(`
            INSERT INTO courses (title, description) 
            VALUES ($1, $2) 
            RETURNING *
        `, ['Sample Course', 'This is a test course created by the API']);
        
        const courseId = courseResult.rows[0].id;
        
        // Create a sample topic
        const topicResult = await pool.query(`
            INSERT INTO topics (course_id, title, description) 
            VALUES ($1, $2, $3) 
            RETURNING *
        `, [courseId, 'Sample Topic', 'This is a test topic']);
        
        const topicId = topicResult.rows[0].id;
        
        // Create sample flashcards
        const flashcardResults = await Promise.all([
            pool.query(`
                INSERT INTO flashcards (topic_id, question, answer) 
                VALUES ($1, $2, $3) 
                RETURNING *
            `, [topicId, 'What is Node.js?', 'Node.js is a JavaScript runtime built on Chrome\'s V8 engine.']),
            
            pool.query(`
                INSERT INTO flashcards (topic_id, question, answer) 
                VALUES ($1, $2, $3) 
                RETURNING *
            `, [topicId, 'What is PostgreSQL?', 'PostgreSQL is a powerful, open-source relational database system.'])
        ]);
        
        res.json({
            success: true,
            message: 'Sample data created successfully!',
            data: {
                course: courseResult.rows[0],
                topic: topicResult.rows[0],
                flashcards: flashcardResults.map(result => result.rows[0])
            }
        });
    } catch (error) {
        console.error('Error creating sample data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create sample data',
            error: error.message
        });
    }
});

// Serve the frontend for any non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server with optional database connection test
const startServer = async () => {
    try {
        // Test database connection first (but don't fail if it doesn't work immediately)
        console.log('🔍 Testing database connection...');
        try {
            await testConnection();
            console.log('✅ Database connection successful');
        } catch (dbError) {
            console.warn('⚠️  Database connection failed during startup:', dbError.message);
            console.log('🔄 Server will start anyway. Database connection will be retried on first request.');
        }
        
        // Start the server
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📱 Frontend: http://localhost:${PORT}`);
            console.log(`🔗 API: http://localhost:${PORT}/api`);
            console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            
            // Log environment info
            if (process.env.NODE_ENV === 'production') {
                console.log(`📦 Running in production mode`);
            }
        });
        
        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('🛑 SIGTERM received, shutting down gracefully');
            server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        console.error('💡 Please check your configuration and try again.');
        process.exit(1);
    }
};

startServer();

module.exports = app; 