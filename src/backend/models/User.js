const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

/**
 * User model for handling user authentication and management
 */
class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.email = data.email;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    /**
     * Create a new user account
     */
    static async create(userData) {
        const { username, email, password } = userData;
        
        try {
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            
            const result = await pool.query(
                `INSERT INTO users (username, email, password_hash, updated_at) 
                 VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
                 RETURNING id, username, email, created_at, updated_at`,
                [username, email, passwordHash]
            );
            
            return new User(result.rows[0]);
        } catch (error) {
            if (error.code === '23505') {
                if (error.constraint === 'users_email_key') {
                    throw new Error('Email already exists');
                } else if (error.constraint === 'users_username_key') {
                    throw new Error('Username already exists');
                }
            }
            throw error;
        }
    }

    /**
     * Find user by email
     */
    static async findByEmail(email) {
        const result = await pool.query(
            'SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) return null;
        
        const userData = result.rows[0];
        userData.passwordHash = userData.password_hash;
        return userData;
    }

    /**
     * Find user by username
     */
    static async findByUsername(username) {
        const result = await pool.query(
            'SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE username = $1',
            [username]
        );
        
        if (result.rows.length === 0) return null;
        
        const userData = result.rows[0];
        userData.passwordHash = userData.password_hash;
        return userData;
    }

    /**
     * Find user by ID
     */
    static async findById(id) {
        const result = await pool.query(
            'SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1',
            [id]
        );
        
        return result.rows.length > 0 ? new User(result.rows[0]) : null;
    }

    /**
     * Verify password against hash
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Authenticate user with email/username and password
     */
    static async authenticate(identifier, password) {
        try {
            let userData;
            if (identifier.includes('@')) {
                userData = await User.findByEmail(identifier);
            } else {
                userData = await User.findByUsername(identifier);
            }
            
            if (!userData) return null;
            
            const isValidPassword = await User.verifyPassword(password, userData.passwordHash);
            return isValidPassword ? new User(userData) : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user statistics
     */
    async getStats() {
        try {
            const result = await pool.query(`
                SELECT 
                    COUNT(DISTINCT c.id) as course_count,
                    COUNT(DISTINCT t.id) as topic_count,
                    COUNT(DISTINCT f.id) as flashcard_count,
                    COALESCE(SUM(f.review_count), 0) as total_reviews
                FROM users u
                LEFT JOIN courses c ON u.id = c.user_id
                LEFT JOIN topics t ON u.id = t.user_id
                LEFT JOIN flashcards f ON u.id = f.user_id
                WHERE u.id = $1
                GROUP BY u.id
            `, [this.id]);
            
            if (result.rows.length === 0) {
                return {
                    course_count: 0,
                    topic_count: 0,
                    flashcard_count: 0,
                    total_reviews: 0
                };
            }
            
            return {
                course_count: parseInt(result.rows[0].course_count),
                topic_count: parseInt(result.rows[0].topic_count),
                flashcard_count: parseInt(result.rows[0].flashcard_count),
                total_reviews: parseInt(result.rows[0].total_reviews)
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Convert to JSON (excluding sensitive data)
     */
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = User; 