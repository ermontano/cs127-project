const db = require('../config/database');

class Flashcard {
    constructor(topicId, question, answer, userId = null) {
        // Remove ID generation - let PostgreSQL handle it with SERIAL
        this.topicId = parseInt(topicId); // Ensure integer
        this.question = question;
        this.answer = answer;
        this.userId = userId; // Add user ID for authentication
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.lastReviewed = null;
        this.reviewCount = 0;
    }

    // Mark the flashcard as reviewed
    review() {
        this.lastReviewed = new Date();
        this.reviewCount++;
        this.updatedAt = new Date();
    }

    // Save flashcard to database
    async save() {
        try {
            const query = `
                INSERT INTO flashcards (topic_id, question, answer, user_id, created_at, updated_at, last_reviewed, review_count)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;
            const values = [
                this.topicId, this.question, this.answer, this.userId,
                this.createdAt, this.updatedAt, this.lastReviewed, this.reviewCount
            ];
            const result = await db.query(query, values);
            
            // Set the auto-generated ID
            this.id = result.rows[0].id;
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error saving flashcard: ${error.message}`);
        }
    }

    // Update flashcard in database
    async update() {
        try {
            this.updatedAt = new Date();
            const query = `
                UPDATE flashcards 
                SET question = $1, answer = $2, updated_at = $3, last_reviewed = $4, review_count = $5
                WHERE id = $6
                RETURNING *
            `;
            const values = [this.question, this.answer, this.updatedAt, this.lastReviewed, this.reviewCount, this.id];
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error updating flashcard: ${error.message}`);
        }
    }

    // Update review status
    async updateReview() {
        try {
            this.review();
            const query = `
                UPDATE flashcards 
                SET last_reviewed = $1, review_count = $2, updated_at = $3
                WHERE id = $4
                RETURNING *
            `;
            const values = [this.lastReviewed, this.reviewCount, this.updatedAt, this.id];
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error updating flashcard review: ${error.message}`);
        }
    }

    // Static methods
    static async findAll() {
        try {
            const query = 'SELECT * FROM flashcards ORDER BY created_at DESC';
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching flashcards: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            // Validate ID
            const numericId = parseInt(id);
            if (isNaN(numericId) || numericId <= 0) {
                throw new Error(`Invalid flashcard ID: ${id}`);
            }
            
            const query = 'SELECT * FROM flashcards WHERE id = $1';
            const result = await db.query(query, [numericId]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error fetching flashcard: ${error.message}`);
        }
    }

    static async findByTopicId(topicId) {
        try {
            // Validate topic ID
            const numericTopicId = parseInt(topicId);
            if (isNaN(numericTopicId) || numericTopicId <= 0) {
                throw new Error(`Invalid topic ID: ${topicId}`);
            }
            
            const query = 'SELECT * FROM flashcards WHERE topic_id = $1 ORDER BY created_at DESC';
            const result = await db.query(query, [numericTopicId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching flashcards for topic: ${error.message}`);
        }
    }

    static async delete(id) {
        try {
            // Validate ID
            const numericId = parseInt(id);
            if (isNaN(numericId) || numericId <= 0) {
                throw new Error(`Invalid flashcard ID: ${id}`);
            }
            
            const query = 'DELETE FROM flashcards WHERE id = $1 RETURNING *';
            const result = await db.query(query, [numericId]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Error deleting flashcard: ${error.message}`);
        }
    }

    static async deleteByTopicId(topicId) {
        try {
            // Validate topic ID
            const numericTopicId = parseInt(topicId);
            if (isNaN(numericTopicId) || numericTopicId <= 0) {
                throw new Error(`Invalid topic ID: ${topicId}`);
            }
            
            const query = 'DELETE FROM flashcards WHERE topic_id = $1 RETURNING *';
            const result = await db.query(query, [numericTopicId]);
            return result.rows;
        } catch (error) {
            throw new Error(`Error deleting flashcards for topic: ${error.message}`);
        }
    }
}

module.exports = Flashcard;