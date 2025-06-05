const { pool } = require('../config/database');

/**
 * Topic model for managing user topics
 */
class Topic {
    constructor(data) {
        this.id = data.id;
        this.course_id = data.course_id;
        this.user_id = data.user_id;
        this.title = data.title;
        this.description = data.description;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    /**
     * Create a new topic
     */
    static async create(topicData) {
        const { user_id, course_id, title, description } = topicData;
        
        try {
            const result = await pool.query(
                `INSERT INTO topics (user_id, course_id, title, description, updated_at) 
                 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) 
                 RETURNING *`,
                [user_id, course_id, title, description]
            );
            
            return new Topic(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find topics by user ID
     */
    static async findByUserId(userId) {
        try {
            const result = await pool.query(
                'SELECT * FROM topics WHERE user_id = $1 ORDER BY updated_at DESC',
                [userId]
            );
            
            return result.rows.map(row => new Topic(row));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find topics by user ID with course title information
     */
    static async findByUserIdWithCourseTitle(userId) {
        try {
            const result = await pool.query(`
                SELECT t.*, c.title as course_title 
                FROM topics t
                LEFT JOIN courses c ON t.course_id = c.id
                WHERE t.user_id = $1 
                ORDER BY t.updated_at DESC
            `, [userId]);
            
            return result.rows.map(row => ({
                ...new Topic(row).toJSON(),
                courseTitle: row.course_title
            }));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find topics by course ID and user ID
     */
    static async findByCourseId(courseId, userId) {
        try {
            const result = await pool.query(
                'SELECT * FROM topics WHERE course_id = $1 AND user_id = $2 ORDER BY updated_at DESC',
                [courseId, userId]
            );
            
            return result.rows.map(row => new Topic(row));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find standalone topics (no course) by user ID
     */
    static async findStandaloneByUserId(userId) {
        try {
            const result = await pool.query(
                'SELECT * FROM topics WHERE course_id IS NULL AND user_id = $1 ORDER BY updated_at DESC',
                [userId]
            );
            
            return result.rows.map(row => new Topic(row));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find topic by ID and user ID
     */
    static async findByIdAndUserId(id, userId) {
        try {
            const result = await pool.query(
                'SELECT * FROM topics WHERE id = $1 AND user_id = $2',
                [id, userId]
            );
            
            return result.rows.length > 0 ? new Topic(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find topic by title and user ID (for uniqueness check)
     */
    static async findByTitleAndUserId(title, userId, excludeId = null) {
        try {
            let query = 'SELECT * FROM topics WHERE title = $1 AND user_id = $2';
            let params = [title, userId];
            
            if (excludeId) {
                query += ' AND id != $3';
                params.push(excludeId);
            }
            
            const result = await pool.query(query, params);
            
            return result.rows.length > 0 ? new Topic(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update topic
     */
    async update(updateData) {
        const { title, description, course_id } = updateData;
        
        try {
            const result = await pool.query(
                `UPDATE topics 
                 SET title = $1, description = $2, course_id = $3, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $4 AND user_id = $5 
                 RETURNING *`,
                [title, description, course_id, this.id, this.user_id]
            );
            
            if (result.rows.length === 0) {
                throw new Error('Topic not found or unauthorized');
            }
            
            Object.assign(this, result.rows[0]);
            return this;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete topic and all related data
     */
    async delete() {
        try {
            const result = await pool.query(
                'DELETE FROM topics WHERE id = $1 AND user_id = $2 RETURNING *',
                [this.id, this.user_id]
            );
            
            return result.rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get topic statistics
     */
    async getStats() {
        try {
            const result = await pool.query(`
                SELECT 
                    COUNT(f.id) as flashcard_count
                FROM topics t
                LEFT JOIN flashcards f ON t.id = f.topic_id
                WHERE t.id = $1 AND t.user_id = $2
                GROUP BY t.id
            `, [this.id, this.user_id]);
            
            if (result.rows.length === 0) {
                return { flashcard_count: 0 };
            }
            
            return {
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
            course_id: this.course_id,
            user_id: this.user_id,
            title: this.title,
            description: this.description,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = Topic; 