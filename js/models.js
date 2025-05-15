// models for the flashcards maker app

class Course {
    constructor(title, description = '') {
        this.id = generateId();
        this.title = title;
        this.description = description;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}

class Topic {
    constructor(courseId, title, description = '') {
        this.id = generateId();
        this.courseId = courseId;
        this.title = title;
        this.description = description;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}

class Flashcard {
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

    // mark the flashcard as reviewed
    review() {
        this.lastReviewed = new Date();
        this.reviewCount++;
        this.updatedAt = new Date();
    }
}

// generate a unique id
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
