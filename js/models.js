// models for the flashcards maker app

class Course {
    constructor(title, description = '') {
        this.title = title;
        this.description = description;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}

class Topic {
    constructor(courseId, title, description = '') {
        this.courseId = courseId;
        this.title = title;
        this.description = description;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}

class Flashcard {
    constructor(topicId, question, answer) {
        this.topicId = topicId;
        this.question = question;
        this.answer = answer;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.lastReviewed = null;
        this.reviewCount = 0;
    }

    // mark the flashcard as reviewed
    review() {
        this.lastReviewed = new Date();
        this.reviewCount++;
        this.updatedAt = new Date();
    }
}

// Note: ID generation is now handled by the database with auto-incrementing SERIAL columns
