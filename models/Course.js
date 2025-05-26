const db = require('../config/database');

class Course {
    constructor(title, description = '', userId = null) {
        // Remove ID generation - let PostgreSQL handle it with SERIAL
        this.title = title;
        this.description = description;
        this.userId = userId;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Save course to database
    async save() {
        try {
            if (!this.userId) {
                throw new Error('User ID is required to save course');
            }
            
            const query = `
                INSERT INTO courses (user_id, title, description, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
            const values = [this.userId, this.title, this.description, this.createdAt, this.updatedAt];
            const result = await db.query(query, values);
            
            // Set the auto-generated ID
            this.id = result.rows[0].id;
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error saving course: ${error.message}`);
        }
    }

    // Update course in database
    async update() {
        try {
            this.updatedAt = new Date();
            const query = `
                UPDATE courses 
                SET title = $1, description = $2, updated_at = $3
                WHERE id = $4
                RETURNING *
            `;
            const values = [this.title, this.description, this.updatedAt, this.id];
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error updating course: ${error.message}`);
        }
    }

    // Static methods
    static async findAll(userId = null) {
        try {
            let query, values;
            if (userId) {
                query = 'SELECT * FROM courses WHERE user_id = $1 ORDER BY created_at DESC';
                values = [userId];
            } else {
                query = 'SELECT * FROM courses ORDER BY created_at DESC';
                values = [];
            }
            const result = await db.query(query, values);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching courses: ${error.message}`);
        }
    }

    static async findById(id, userId = null) {
        try {
            // Validate ID
            const numericId = parseInt(id);
            if (isNaN(numericId) || numericId <= 0) {
                throw new Error(`Invalid course ID: ${id}`);
            }
            
            let query, values;
            if (userId) {
                query = 'SELECT * FROM courses WHERE id = $1 AND user_id = $2';
                values = [numericId, userId];
            } else {
                query = 'SELECT * FROM courses WHERE id = $1';
                values = [numericId];
            }
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error fetching course: ${error.message}`);
        }
    }

    static async delete(id, userId = null) {
        try {
            // Validate ID
            const numericId = parseInt(id);
            if (isNaN(numericId) || numericId <= 0) {
                throw new Error(`Invalid course ID: ${id}`);
            }
            
            let query, values;
            if (userId) {
                query = 'DELETE FROM courses WHERE id = $1 AND user_id = $2 RETURNING *';
                values = [numericId, userId];
            } else {
                query = 'DELETE FROM courses WHERE id = $1 RETURNING *';
                values = [numericId];
            }
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error deleting course: ${error.message}`);
        }
    }
}

module.exports = Course;