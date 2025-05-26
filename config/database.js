const { Pool } = require('pg');
require('dotenv').config();

// Database configuration for local PostgreSQL only
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'CMSC127',
    // Connection pool settings
    max: 20, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
    connectionTimeoutMillis: 10000,
};

console.log(`🔗 Connecting to local PostgreSQL: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
pool.on('connect', () => {
    console.log('✅ Connected to local PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
    process.exit(-1);
});

// Test connection on startup
const testConnection = async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('🎉 Local database connection test successful');
    } catch (error) {
        console.error('❌ Local database connection test failed:', error);
        throw error;
    }
};

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
    testConnection
}; 