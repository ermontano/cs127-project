const express = require('express');
const router = express.Router();

// Database setup route - call this once to create tables
router.post('/database', async (req, res) => {
    const { pool } = require('../config/database');
    
    try {
        console.log('🚀 Starting database setup...');
        
        // Create courses table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Courses table created');

        // Create topics table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS topics (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Topics table created');

        // Create flashcards table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS flashcards (
                id SERIAL PRIMARY KEY,
                front VARCHAR(1000) NOT NULL,
                back VARCHAR(1000) NOT NULL,
                topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Flashcards table created');

        // Create indexes for better performance
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_topics_course_id ON topics(course_id)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_flashcards_topic_id ON flashcards(topic_id)
        `);
        console.log('✅ Indexes created');

        // Test data insertion
        const testResult = await pool.query('SELECT NOW() as current_time');
        console.log('✅ Database connection test successful');

        res.json({
            success: true,
            message: 'Database setup completed successfully!',
            timestamp: testResult.rows[0].current_time,
            tables: ['courses', 'topics', 'flashcards']
        });

    } catch (error) {
        console.error('❌ Database setup failed:', error);
        res.status(500).json({
            success: false,
            message: 'Database setup failed',
            error: error.message
        });
    }
});

// Get database status
router.get('/status', async (req, res) => {
    const { pool } = require('../config/database');
    
    try {
        // Check if tables exist
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('courses', 'topics', 'flashcards')
            ORDER BY table_name
        `);

        // Count records in each table
        const counts = {};
        for (const table of ['courses', 'topics', 'flashcards']) {
            try {
                const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
                counts[table] = parseInt(countResult.rows[0].count);
            } catch (err) {
                counts[table] = 'Table not found';
            }
        }

        res.json({
            success: true,
            tables: tablesResult.rows.map(row => row.table_name),
            counts: counts,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Database status check failed:', error);
        res.status(500).json({
            success: false,
            message: 'Database status check failed',
            error: error.message
        });
    }
});

module.exports = router; 