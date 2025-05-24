const db = require('../config/database');

class Course {
    constructor(title, description = '') {
        // Remove ID generation - let PostgreSQL handle it with SERIAL
        this.title = title;
        this.description = description;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Save course to database
    async save() {
        try {
            const query = `
                INSERT INTO courses (title, description, created_at, updated_at)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const values = [this.title, this.description, this.createdAt, this.updatedAt];
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
    static async findAll() {
        try {
            const query = 'SELECT * FROM courses ORDER BY created_at DESC';
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching courses: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            // Validate ID
            const numericId = parseInt(id);
            if (isNaN(numericId) || numericId <= 0) {
                throw new Error(`Invalid course ID: ${id}`);
            }
            
            const query = 'SELECT * FROM courses WHERE id = $1';
            const result = await db.query(query, [numericId]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error fetching course: ${error.message}`);
        }
    }

    static async delete(id) {
        try {
            // Validate ID
            const numericId = parseInt(id);
            if (isNaN(numericId) || numericId <= 0) {
                throw new Error(`Invalid course ID: ${id}`);
            }
            
            const query = 'DELETE FROM courses WHERE id = $1 RETURNING *';
            const result = await db.query(query, [numericId]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error deleting course: ${error.message}`);
        }
    }
}

module.exports = Course;