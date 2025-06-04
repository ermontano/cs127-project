const { pool } = require('../config/database');

/**
 * Setup database tables for the flashcards application
 */
const createTables = async () => {
    try {
        console.log('🔧 Setting up database tables...');

        // Drop existing tables (in reverse dependency order)
        await pool.query('DROP TABLE IF EXISTS flashcards CASCADE');
        await pool.query('DROP TABLE IF EXISTS topics CASCADE');
        await pool.query('DROP TABLE IF EXISTS courses CASCADE');
        await pool.query('DROP TABLE IF EXISTS session CASCADE');
        await pool.query('DROP TABLE IF EXISTS users CASCADE');
        console.log('🗑️  Dropped existing tables');

        // Create users table
        await pool.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table created');

        // Create session table for express-session
        await pool.query(`
            CREATE TABLE session (
                sid VARCHAR NOT NULL COLLATE "default",
                sess JSON NOT NULL,
                expire TIMESTAMP(6) NOT NULL
            )
            WITH (OIDS=FALSE)
        `);
        await pool.query(`
            ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
        `);
        await pool.query(`
            CREATE INDEX IDX_session_expire ON session (expire)
        `);
        console.log('✅ Session table created');

        // Create courses table with user relationship
        await pool.query(`
            CREATE TABLE courses (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Courses table created');

        // Create topics table with optional course_id and user relationship
        await pool.query(`
            CREATE TABLE topics (
                id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Topics table created');

        // Create flashcards table with user relationship
        await pool.query(`
            CREATE TABLE flashcards (
                id SERIAL PRIMARY KEY,
                topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_reviewed TIMESTAMP,
                review_count INTEGER DEFAULT 0
            )
        `);
        console.log('✅ Flashcards table created');

        // Create indexes for better performance
        await pool.query(`CREATE INDEX idx_courses_user_id ON courses(user_id)`);
        await pool.query(`CREATE INDEX idx_topics_course_id ON topics(course_id)`);
        await pool.query(`CREATE INDEX idx_topics_user_id ON topics(user_id)`);
        await pool.query(`CREATE INDEX idx_flashcards_topic_id ON flashcards(topic_id)`);
        await pool.query(`CREATE INDEX idx_flashcards_user_id ON flashcards(user_id)`);
        await pool.query(`CREATE INDEX idx_users_email ON users(email)`);
        await pool.query(`CREATE INDEX idx_users_username ON users(username)`);
        console.log('✅ Database indexes created');

        console.log('🎉 Database setup completed successfully!');
        console.log('💡 All tables support user authentication and data isolation');
        console.log('🔐 Users can now have their own private courses, topics, and flashcards');
        console.log('📝 Topics can be created with or without courses');
        
    } catch (error) {
        console.error('❌ Error setting up database:', error);
        throw error;
    } finally {
        await pool.end();
    }
};

// Run the setup if this file is executed directly
if (require.main === module) {
    createTables()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Setup failed:', error);
            process.exit(1);
        });
}

module.exports = createTables; 