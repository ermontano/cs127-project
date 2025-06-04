const { Pool } = require('pg');
require('dotenv').config();

// Database configuration for local PostgreSQL
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'flashcards_db',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ Database connected successfully at', result.rows[0].now);
        client.release();
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🔄 Closing database pool...');
    pool.end(() => {
        console.log('✅ Database pool closed');
        process.exit(0);
    });
});

module.exports = { pool, testConnection }; 