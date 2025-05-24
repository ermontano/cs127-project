const { pool } = require('../config/database');

const createTables = async () => {
    try {
        console.log('🔧 Setting up database tables with integer IDs...');

        // Drop existing tables first (to change from VARCHAR to SERIAL)
        await pool.query('DROP TABLE IF EXISTS flashcards CASCADE');
        await pool.query('DROP TABLE IF EXISTS topics CASCADE');
        await pool.query('DROP TABLE IF EXISTS courses CASCADE');
        console.log('🗑️  Dropped existing tables');

        // Create courses table with SERIAL PRIMARY KEY
        await pool.query(`
            CREATE TABLE courses (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Courses table created with auto-incrementing ID');

        // Create topics table with SERIAL PRIMARY KEY
        await pool.query(`
            CREATE TABLE topics (
                id SERIAL PRIMARY KEY,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Topics table created with auto-incrementing ID');

        // Create flashcards table with SERIAL PRIMARY KEY
        await pool.query(`
            CREATE TABLE flashcards (
                id SERIAL PRIMARY KEY,
                topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_reviewed TIMESTAMP,
                review_count INTEGER DEFAULT 0
            )
        `);
        console.log('✅ Flashcards table created with auto-incrementing ID');

        // Create indexes for better performance
        await pool.query(`
            CREATE INDEX idx_topics_course_id ON topics(course_id)
        `);
        await pool.query(`
            CREATE INDEX idx_flashcards_topic_id ON flashcards(topic_id)
        `);
        console.log('✅ Database indexes created');

        console.log('🎉 Database setup completed successfully!');
        console.log('💡 All IDs will now auto-increment: 1, 2, 3, ...');
        
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