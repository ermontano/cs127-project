const db = require('../config/database');

class Topic {
    constructor(courseId, title, description = '', userId = null) {
        if (!courseId) {
            throw new Error('Course ID is required');
        }
        this.courseId = parseInt(courseId);
        this.userId = userId ? parseInt(userId) : null;
        this.title = title;
        this.description = description;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Save topic to database
    async save() {
        try {
            const query = `
                INSERT INTO topics (course_id, user_id, title, description, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;
            const values = [this.courseId, this.userId, this.title, this.description, this.createdAt, this.updatedAt];
            const result = await db.query(query, values);
            
            // Set the auto-generated ID
            this.id = result.rows[0].id;
            return Topic.transformDbRow(result.rows[0]);
        } catch (error) {
            throw new Error(`Error saving topic: ${error.message}`);
        }
    }

    // Update an existing topic
    async update() {
        try {
            const query = `
                UPDATE topics 
                SET title = $1, description = $2, updated_at = $3
                WHERE id = $4 AND user_id = $5 AND course_id = $6
                RETURNING *
            `;
            const values = [this.title, this.description, new Date(), this.id, this.userId, this.courseId];
            const result = await db.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error(`Topic with ID ${this.id} not found or unauthorized`);
            }
            
            return Topic.transformDbRow(result.rows[0]);
        } catch (error) {
            throw new Error(`Error updating topic: ${error.message}`);
        }
    }

    // Static methods
    static async findAll(userId) {
        try {
            const query = 'SELECT * FROM topics WHERE user_id = $1 ORDER BY created_at DESC';
            const result = await db.query(query, [userId]);
            return result.rows.map(Topic.transformDbRow);
        } catch (error) {
            throw new Error(`Error fetching topics: ${error.message}`);
        }
    }

    static async findById(id, userId) {
        try {
            // Validate ID
            const numericId = parseInt(id);
            if (isNaN(numericId) || numericId <= 0) {
                throw new Error(`Invalid topic ID: ${id}`);
            }
            
            const query = 'SELECT * FROM topics WHERE id = $1 AND user_id = $2';
            const result = await db.query(query, [numericId, userId]);
            return result.rows[0] ? Topic.transformDbRow(result.rows[0]) : null;
        } catch (error) {
            throw new Error(`Error fetching topic: ${error.message}`);
        }
    }

    static async findByCourseId(courseId, userId) {
        try {
            // Validate course ID
            const numericCourseId = parseInt(courseId);
            if (isNaN(numericCourseId) || numericCourseId <= 0) {
                throw new Error(`Invalid course ID: ${courseId}`);
            }
            
            const query = 'SELECT * FROM topics WHERE course_id = $1 AND user_id = $2 ORDER BY created_at DESC';
            const result = await db.query(query, [numericCourseId, userId]);
            return result.rows.map(Topic.transformDbRow);
        } catch (error) {
            throw new Error(`Error fetching topics for course: ${error.message}`);
        }
    }

    static async delete(id, userId) {
        try {
            // Validate ID
            const numericId = parseInt(id);
            if (isNaN(numericId) || numericId <= 0) {
                throw new Error(`Invalid topic ID: ${id}`);
            }
            
            const query = 'DELETE FROM topics WHERE id = $1 AND user_id = $2 RETURNING *';
            const result = await db.query(query, [numericId, userId]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error deleting topic: ${error.message}`);
        }
    }

    static async deleteByCourseId(courseId, userId) {
        try {
            // Validate course ID
            const numericCourseId = parseInt(courseId);
            if (isNaN(numericCourseId) || numericCourseId <= 0) {
                throw new Error(`Invalid course ID: ${courseId}`);
            }
            
            const query = 'DELETE FROM topics WHERE course_id = $1 AND user_id = $2 RETURNING *';
            const result = await db.query(query, [numericCourseId, userId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error deleting topics for course: ${error.message}`);
        }
    }

    // Transform database row to frontend-friendly format
    static transformDbRow(row) {
        return {
            id: row.id,
            courseId: row.course_id,
            userId: row.user_id,
            title: row.title,
            description: row.description,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}

module.exports = Topic;