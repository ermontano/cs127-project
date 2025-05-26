const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.email = data.email;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Create a new user (register)
    static async create(userData) {
        const { username, email, password } = userData;
        
        try {
            // Hash the password
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            
            // Insert user into database
            const result = await pool.query(
                `INSERT INTO users (username, email, password_hash, updated_at) 
                 VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
                 RETURNING id, username, email, created_at, updated_at`,
                [username, email, passwordHash]
            );
            
            return new User(result.rows[0]);
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                if (error.constraint === 'users_email_key') {
                    throw new Error('Email already exists');
                } else if (error.constraint === 'users_username_key') {
                    throw new Error('Username already exists');
                }
            }
            throw error;
        }
    }

    // Find user by email
    static async findByEmail(email) {
        const result = await pool.query(
            'SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        const userData = result.rows[0];
        userData.passwordHash = userData.password_hash;
        return userData;
    }

    // Find user by username
    static async findByUsername(username) {
        const result = await pool.query(
            'SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE username = $1',
            [username]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        const userData = result.rows[0];
        userData.passwordHash = userData.password_hash;
        return userData;
    }

    // Find user by ID
    static async findById(id) {
        const result = await pool.query(
            'SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return new User(result.rows[0]);
    }

    // Verify password
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Authenticate user (login)
    static async authenticate(identifier, password) {
        try {
            // Try to find user by email or username
            let userData;
            if (identifier.includes('@')) {
                userData = await User.findByEmail(identifier);
            } else {
                userData = await User.findByUsername(identifier);
            }
            
            if (!userData) {
                return null;
            }
            
            // Verify password
            const isValidPassword = await User.verifyPassword(password, userData.passwordHash);
            if (!isValidPassword) {
                return null;
            }
            
            // Return user without password hash
            return new User(userData);
        } catch (error) {
            throw error;
        }
    }

    // Update user information
    async update(updateData) {
        const { username, email } = updateData;
        
        try {
            const result = await pool.query(
                `UPDATE users 
                 SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $3 
                 RETURNING id, username, email, created_at, updated_at`,
                [username, email, this.id]
            );
            
            if (result.rows.length === 0) {
                throw new Error('User not found');
            }
            
            // Update current instance
            Object.assign(this, result.rows[0]);
            return this;
        } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
                if (error.constraint === 'users_email_key') {
                    throw new Error('Email already exists');
                } else if (error.constraint === 'users_username_key') {
                    throw new Error('Username already exists');
                }
            }
            throw error;
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            // First verify current password
            const userData = await User.findById(this.id);
            if (!userData) {
                throw new Error('User not found');
            }
            
            // Get current password hash
            const result = await pool.query(
                'SELECT password_hash FROM users WHERE id = $1',
                [this.id]
            );
            
            const isValidPassword = await User.verifyPassword(currentPassword, result.rows[0].password_hash);
            if (!isValidPassword) {
                throw new Error('Current password is incorrect');
            }
            
            // Hash new password and update
            const saltRounds = 12;
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
            
            await pool.query(
                'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [newPasswordHash, this.id]
            );
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Delete user and all their data
    async delete() {
        try {
            await pool.query('DELETE FROM users WHERE id = $1', [this.id]);
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Get user statistics
    async getStats() {
        try {
            const result = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM courses WHERE user_id = $1) as courses_count,
                    (SELECT COUNT(*) FROM topics WHERE user_id = $1) as topics_count,
                    (SELECT COUNT(*) FROM flashcards WHERE user_id = $1) as flashcards_count,
                    (SELECT COUNT(*) FROM flashcards WHERE user_id = $1 AND last_reviewed IS NOT NULL) as reviewed_count
            `, [this.id]);
            
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Convert to JSON (exclude sensitive data)
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