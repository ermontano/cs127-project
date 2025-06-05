const { pool } = require('../config/database');

/**
 * Course model for managing user courses
 */
class Course {
    constructor(data) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.title = data.title;
        this.description = data.description;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    /**
     * Create a new course
     */
    static async create(courseData) {
        const { user_id, title, description } = courseData;
        
        try {
            const result = await pool.query(
                `INSERT INTO courses (user_id, title, description, updated_at) 
                 VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
                 RETURNING *`,
                [user_id, title, description]
            );
            
            return new Course(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find courses by user ID
     */
    static async findByUserId(userId) {
        try {
            const result = await pool.query(
                'SELECT * FROM courses WHERE user_id = $1 ORDER BY updated_at DESC',
                [userId]
            );
            
            return result.rows.map(row => new Course(row));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find courses by user ID with topic count
     */
    static async findByUserIdWithTopicCount(userId) {
        try {
            const result = await pool.query(`
                SELECT c.*, COUNT(t.id) as topic_count 
                FROM courses c
                LEFT JOIN topics t ON c.id = t.course_id
                WHERE c.user_id = $1 
                GROUP BY c.id
                ORDER BY c.updated_at DESC
            `, [userId]);
            
            return result.rows.map(row => ({
                ...new Course(row).toJSON(),
                topicCount: parseInt(row.topic_count)
            }));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find course by ID and user ID
     */
    static async findByIdAndUserId(id, userId) {
        try {
            const result = await pool.query(
                'SELECT * FROM courses WHERE id = $1 AND user_id = $2',
                [id, userId]
            );
            
            return result.rows.length > 0 ? new Course(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find course by title and user ID (for uniqueness check)
     */
    static async findByTitleAndUserId(title, userId, excludeId = null) {
        try {
            let query = 'SELECT * FROM courses WHERE title = $1 AND user_id = $2';
            let params = [title, userId];
            
            if (excludeId) {
                query += ' AND id != $3';
                params.push(excludeId);
            }
            
            const result = await pool.query(query, params);
            
            return result.rows.length > 0 ? new Course(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find course by ID with associated topics
     */
    static async findByIdWithTopics(id, userId) {
        try {
            // First get the course
            const courseResult = await pool.query(
                'SELECT * FROM courses WHERE id = $1 AND user_id = $2',
                [id, userId]
            );
            
            if (courseResult.rows.length === 0) {
                return null;
            }
            
            // Then get the topics for this course
            const topicsResult = await pool.query(
                'SELECT * FROM topics WHERE course_id = $1 AND user_id = $2 ORDER BY updated_at DESC',
                [id, userId]
            );
            
            const course = new Course(courseResult.rows[0]);
            const topics = topicsResult.rows.map(row => ({
                id: row.id,
                course_id: row.course_id,
                user_id: row.user_id,
                title: row.title,
                description: row.description,
                created_at: row.created_at,
                updated_at: row.updated_at
            }));
            
            return {
                ...course.toJSON(),
                topics: topics
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update course
     */
    async update(updateData) {
        const { title, description } = updateData;
        
        try {
            const result = await pool.query(
                `UPDATE courses 
                 SET title = $1, description = $2, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $3 AND user_id = $4 
                 RETURNING *`,
                [title, description, this.id, this.user_id]
            );
            
            if (result.rows.length === 0) {
                throw new Error('Course not found or unauthorized');
            }
            
            Object.assign(this, result.rows[0]);
            return this;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete course and all related data
     */
    async delete() {
        try {
            const result = await pool.query(
                'DELETE FROM courses WHERE id = $1 AND user_id = $2 RETURNING *',
                [this.id, this.user_id]
            );
            
            return result.rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get course statistics
     */
    async getStats() {
        try {
            const result = await pool.query(`
                SELECT 
                    COUNT(DISTINCT t.id) as topic_count,
                    COUNT(DISTINCT f.id) as flashcard_count
                FROM courses c
                LEFT JOIN topics t ON c.id = t.course_id
                LEFT JOIN flashcards f ON t.id = f.topic_id
                WHERE c.id = $1 AND c.user_id = $2
                GROUP BY c.id
            `, [this.id, this.user_id]);
            
            if (result.rows.length === 0) {
                return { topic_count: 0, flashcard_count: 0 };
            }
            
            return {
                topic_count: parseInt(result.rows[0].topic_count),
                flashcard_count: parseInt(result.rows[0].flashcard_count)
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Convert to JSON
     */
    toJSON() {
        return {
            id: this.id,
            user_id: this.user_id,
            title: this.title,
            description: this.description,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = Course; 