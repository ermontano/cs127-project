const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'CMSC127',
    // Connection pool settings
    max: 20, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle
    connectionTimeoutMillis: 10000, // increased timeout for Cloud SQL
    // Additional settings for Cloud SQL
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
};

// Determine connection method based on environment
if (process.env.DB_HOST && process.env.DB_HOST.startsWith('/cloudsql/')) {
    // App Engine with Cloud SQL socket
    dbConfig.host = process.env.DB_HOST;
    console.log('📡 Using Cloud SQL Unix socket connection');
} else if (process.env.DB_HOST) {
    // Direct IP connection (development or external)
    dbConfig.host = process.env.DB_HOST;
    dbConfig.port = process.env.DB_PORT || 5432;
    
    // For Google Cloud SQL with SSL
    if (process.env.NODE_ENV === 'production' || process.env.USE_SSL === 'true') {
        dbConfig.ssl = {
            rejectUnauthorized: false
        };
    }
    console.log('🔗 Using direct IP connection');
} else {
    // Fallback to localhost
    dbConfig.host = 'localhost';
    dbConfig.port = 5432;
    console.log('🏠 Using localhost connection');
}

console.log(`🔗 Connecting to database: ${dbConfig.host}${dbConfig.port ? ':' + dbConfig.port : ''}/${dbConfig.database}`);

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
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
        console.log('🎉 Database connection test successful');
    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        throw error;
    }
};

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
    testConnection
}; 