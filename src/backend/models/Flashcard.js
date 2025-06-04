const { pool } = require('../config/database');

/**
 * Flashcard model for managing user flashcards
 */
class Flashcard {
    constructor(data) {
        this.id = data.id;
        this.topic_id = data.topic_id;
        this.user_id = data.user_id;
        this.question = data.question;
        this.answer = data.answer;
        this.last_reviewed = data.last_reviewed;
        this.review_count = data.review_count || 0;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    /**
     * Create a new flashcard
     */
    static async create(flashcardData) {
        const { user_id, topic_id, question, answer } = flashcardData;
        
        try {
            const result = await pool.query(
                `INSERT INTO flashcards (user_id, topic_id, question, answer, updated_at) 
                 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) 
                 RETURNING *`,
                [user_id, topic_id, question, answer]
            );
            
            return new Flashcard(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find flashcards by user ID
     */
    static async findByUserId(userId) {
        try {
            const result = await pool.query(
                'SELECT * FROM flashcards WHERE user_id = $1 ORDER BY updated_at DESC',
                [userId]
            );
            
            return result.rows.map(row => new Flashcard(row));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find flashcards by topic ID and user ID
     */
    static async findByTopicId(topicId, userId) {
        try {
            const result = await pool.query(
                'SELECT * FROM flashcards WHERE topic_id = $1 AND user_id = $2 ORDER BY updated_at DESC',
                [topicId, userId]
            );
            
            return result.rows.map(row => new Flashcard(row));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find flashcard by ID and user ID
     */
    static async findByIdAndUserId(id, userId) {
        try {
            const result = await pool.query(
                'SELECT * FROM flashcards WHERE id = $1 AND user_id = $2',
                [id, userId]
            );
            
            return result.rows.length > 0 ? new Flashcard(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Find flashcards for study mode (with topic info)
     */
    static async findForStudy(topicId, userId) {
        try {
            const result = await pool.query(`
                SELECT f.*, t.title as topic_title 
                FROM flashcards f
                JOIN topics t ON f.topic_id = t.id
                WHERE f.topic_id = $1 AND f.user_id = $2
                ORDER BY f.last_reviewed ASC NULLS FIRST, f.review_count ASC
            `, [topicId, userId]);
            
            return result.rows.map(row => ({
                ...new Flashcard(row).toJSON(),
                topic_title: row.topic_title
            }));
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update flashcard
     */
    async update(updateData) {
        const { question, answer, topic_id } = updateData;
        
        try {
            const result = await pool.query(
                `UPDATE flashcards 
                 SET question = $1, answer = $2, topic_id = $3, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $4 AND user_id = $5 
                 RETURNING *`,
                [question, answer, topic_id, this.id, this.user_id]
            );
            
            if (result.rows.length === 0) {
                throw new Error('Flashcard not found or unauthorized');
            }
            
            Object.assign(this, result.rows[0]);
            return this;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Mark flashcard as reviewed
     */
    async markReviewed() {
        try {
            const result = await pool.query(
                `UPDATE flashcards 
                 SET last_reviewed = CURRENT_TIMESTAMP, 
                     review_count = review_count + 1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1 AND user_id = $2 
                 RETURNING *`,
                [this.id, this.user_id]
            );
            
            if (result.rows.length === 0) {
                throw new Error('Flashcard not found or unauthorized');
            }
            
            Object.assign(this, result.rows[0]);
            return this;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete flashcard
     */
    async delete() {
        try {
            const result = await pool.query(
                'DELETE FROM flashcards WHERE id = $1 AND user_id = $2 RETURNING *',
                [this.id, this.user_id]
            );
            
            return result.rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user's study statistics
     */
    static async getStudyStats(userId) {
        try {
            const result = await pool.query(`
                SELECT 
                    COUNT(*) as total_flashcards,
                    SUM(review_count) as total_reviews,
                    COUNT(CASE WHEN last_reviewed IS NOT NULL THEN 1 END) as reviewed_cards,
                    AVG(review_count) as avg_reviews_per_card
                FROM flashcards 
                WHERE user_id = $1
            `, [userId]);
            
            return {
                total_flashcards: parseInt(result.rows[0].total_flashcards),
                total_reviews: parseInt(result.rows[0].total_reviews) || 0,
                reviewed_cards: parseInt(result.rows[0].reviewed_cards),
                avg_reviews_per_card: parseFloat(result.rows[0].avg_reviews_per_card) || 0
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
            topic_id: this.topic_id,
            user_id: this.user_id,
            question: this.question,
            answer: this.answer,
            last_reviewed: this.last_reviewed,
            review_count: this.review_count,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = Flashcard; 