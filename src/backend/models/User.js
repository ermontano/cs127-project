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
                    COUNT(DISTINCT f.id) as flashcard_count
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
                    flashcard_count: 0
                };
            }
            
            return {
                course_count: parseInt(result.rows[0].course_count),
                topic_count: parseInt(result.rows[0].topic_count),
                flashcard_count: parseInt(result.rows[0].flashcard_count)
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update user profile
     */
    static async updateProfile(userId, updateData) {
        const { username, email } = updateData;
        
        try {
            const query = `
                UPDATE users 
                SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $3 
                RETURNING id, username, email, created_at, updated_at
            `;
            const params = [username, email, userId];
            
            const result = await pool.query(query, params);
            
            if (result.rows.length === 0) {
                throw new Error('User not found');
            }
            
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
     * Change user password
     */
    static async changePassword(userId, newPassword) {
        try {
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(newPassword, saltRounds);
            
            const query = `
                UPDATE users 
                SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `;
            const params = [passwordHash, userId];
            
            const result = await pool.query(query, params);
            
            if (result.rowCount === 0) {
                throw new Error('User not found');
            }
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete user account and all associated data
     */
    static async deleteAccount(userId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Delete in correct order to handle foreign key constraints
            // 1. Delete flashcards first (they reference topics)
            await client.query('DELETE FROM flashcards WHERE user_id = $1', [userId]);
            
            // 2. Delete topics (they reference courses)
            await client.query('DELETE FROM topics WHERE user_id = $1', [userId]);
            
            // 3. Delete courses
            await client.query('DELETE FROM courses WHERE user_id = $1', [userId]);
            
            // 4. Finally delete the user
            const result = await client.query('DELETE FROM users WHERE id = $1', [userId]);
            
            if (result.rowCount === 0) {
                throw new Error('User not found');
            }
            
            await client.query('COMMIT');
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
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