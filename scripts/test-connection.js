const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Database Connection Diagnostic');
console.log('================================');

// Show current environment variables
console.log('Environment variables:');
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_PORT: ${process.env.DB_PORT}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log(`DB_USER: ${process.env.DB_USER}`);
console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '***hidden***' : 'NOT SET'}`);
console.log(`USE_SSL: ${process.env.USE_SSL}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log('');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'CMSC127',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
};

// For Google Cloud SQL with SSL
if (process.env.NODE_ENV === 'production' || process.env.USE_SSL === 'true') {
    dbConfig.ssl = {
        rejectUnauthorized: false
    };
    console.log('🔒 Using SSL connection');
}

console.log(`🔗 Attempting to connect to: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
console.log(`👤 Using user: ${dbConfig.user}`);
console.log('');

const testConnection = async () => {
    const pool = new Pool(dbConfig);
    
    try {
        console.log('⏳ Connecting to database...');
        const client = await pool.connect();
        
        console.log('✅ Connected successfully!');
        
        // Test basic query
        console.log('⏳ Testing basic query...');
        const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
        console.log('✅ Query successful!');
        console.log(`📅 Current time: ${result.rows[0].current_time}`);
        console.log(`🔧 PostgreSQL version: ${result.rows[0].pg_version}`);
        
        // Check if our tables exist
        console.log('⏳ Checking for existing tables...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('courses', 'topics', 'flashcards')
            ORDER BY table_name
        `);
        
        if (tablesResult.rows.length > 0) {
            console.log('📋 Found existing tables:');
            tablesResult.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });
        } else {
            console.log('❌ No flashcard tables found in database');
        }
        
        // Check all tables in the database
        console.log('⏳ Checking all tables in database...');
        const allTablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        if (allTablesResult.rows.length > 0) {
            console.log('📋 All tables in database:');
            allTablesResult.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });
        } else {
            console.log('📝 No tables found in database (empty database)');
        }
        
        client.release();
        console.log('');
        console.log('🎉 Connection test completed successfully!');
        
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        console.error('Full error:', error);
    } finally {
        await pool.end();
    }
};

testConnection(); 