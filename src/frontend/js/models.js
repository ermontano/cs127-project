/**
 * Frontend Model Classes
 * These represent the data structures used in the frontend
 */

/**
 * Course model
 */
class Course {
    constructor(title, description = '') {
        this.id = null; // Will be assigned by the backend
        this.title = title;
        this.description = description;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Convert to JSON for API requests
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

/**
 * Topic model
 */
class Topic {
    constructor(title, description = '', courseId = null) {
        this.id = null; // Will be assigned by the backend
        this.title = title;
        this.description = description;
        this.courseId = courseId; // Can be null for standalone topics
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Convert to JSON for API requests
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            courseId: this.courseId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

/**
 * Flashcard model
 */
class Flashcard {
    constructor(question, answer, topicId) {
        this.id = null; // Will be assigned by the backend
        this.question = question;
        this.answer = answer;
        this.topicId = topicId;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.lastReviewed = null;
        this.reviewCount = 0;
    }

    /**
     * Convert to JSON for API requests
     */
    toJSON() {
        return {
            id: this.id,
            question: this.question,
            answer: this.answer,
            topicId: this.topicId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastReviewed: this.lastReviewed,
            reviewCount: this.reviewCount
        };
    }

    /**
     * Mark flashcard as reviewed
     */
    markReviewed() {
        this.lastReviewed = new Date();
        this.reviewCount += 1;
    }
}

// Make classes available globally
window.Course = Course;
window.Topic = Topic;
window.Flashcard = Flashcard; 