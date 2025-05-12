/**
 * Models for the Flashcards Maker app
 * Defines the data structures for courses, topics, and flashcards
 */

/**
 * Course model
 */
class Course {
    /**
     * Create a new course
     * @param {string} title - The title of the course
     * @param {string} description - The description of the course
     */
    constructor(title, description = '') {
        this.id = generateId();
        this.title = title;
        this.description = description;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}

/**
 * Topic model
 */
class Topic {
    /**
     * Create a new topic
     * @param {string} courseId - The ID of the parent course
     * @param {string} title - The title of the topic
     * @param {string} description - The description of the topic
     */
    constructor(courseId, title, description = '') {
        this.id = generateId();
        this.courseId = courseId;
        this.title = title;
        this.description = description;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}

/**
 * Flashcard model
 */
class Flashcard {
    /**
     * Create a new flashcard
     * @param {string} topicId - The ID of the parent topic
     * @param {string} question - The question on the flashcard
     * @param {string} answer - The answer on the flashcard
     */
    constructor(topicId, question, answer) {
        this.id = generateId();
        this.topicId = topicId;
        this.question = question;
        this.answer = answer;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.lastReviewed = null;
        this.reviewCount = 0;
    }

    /**
     * Mark the flashcard as reviewed
     */
    review() {
        this.lastReviewed = new Date();
        this.reviewCount++;
        this.updatedAt = new Date();
    }
}

/**
 * Generate a unique ID
 * @returns {string} A unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}