// storage manager for flashcards maker

class StorageManager {
    constructor() {
        this.COURSES_KEY = 'flashcards_courses';
        this.TOPICS_KEY = 'flashcards_topics';
        this.FLASHCARDS_KEY = 'flashcards_cards';
    }

    // save array of courses
    saveCourses(courses) {
        localStorage.setItem(this.COURSES_KEY, JSON.stringify(courses));
    }

    // get all courses
    getCourses() {
        const courses = localStorage.getItem(this.COURSES_KEY);
        return courses ? JSON.parse(courses) : [];
    }

    // save or update a single course
    saveCourse(course) {
        const courses = this.getCourses();
        const index = courses.findIndex(c => c.id === course.id);
        if (index !== -1) {
            courses[index] = course;
        } else {
            courses.push(course);
        }
        this.saveCourses(courses);
    }

    // delete a course and related topics and flashcards
    deleteCourse(courseId) {
        const courses = this.getCourses();
        const filteredCourses = courses.filter(c => c.id !== courseId);
        if (filteredCourses.length === courses.length) return false;
        this.saveCourses(filteredCourses);
        this.deleteTopicsByCourse(courseId);
        return true;
    }

    saveTopics(topics) {
        localStorage.setItem(this.TOPICS_KEY, JSON.stringify(topics));
    }

    getTopics() {
        const topics = localStorage.getItem(this.TOPICS_KEY);
        return topics ? JSON.parse(topics) : [];
    }

    getTopicsByCourse(courseId) {
        const topics = this.getTopics();
        return topics.filter(topic => topic.courseId === courseId);
    }

    saveTopic(topic) {
        const topics = this.getTopics();
        const index = topics.findIndex(t => t.id === topic.id);
        if (index !== -1) {
            topics[index] = topic;
        } else {
            topics.push(topic);
        }
        this.saveTopics(topics);
    }

    deleteTopic(topicId) {
        const topics = this.getTopics();
        const filteredTopics = topics.filter(t => t.id !== topicId);
        if (filteredTopics.length === topics.length) return false;
        this.saveTopics(filteredTopics);
        this.deleteFlashcardsByTopic(topicId);
        return true;
    }

    deleteTopicsByCourse(courseId) {
        const topics = this.getTopics();
        const courseTopics = topics.filter(t => t.courseId === courseId);
        courseTopics.forEach(topic => this.deleteFlashcardsByTopic(topic.id));
        const filteredTopics = topics.filter(t => t.courseId !== courseId);
        this.saveTopics(filteredTopics);
    }

    saveFlashcards(flashcards) {
        localStorage.setItem(this.FLASHCARDS_KEY, JSON.stringify(flashcards));
    }

    getFlashcards() {
        const flashcards = localStorage.getItem(this.FLASHCARDS_KEY);
        return flashcards ? JSON.parse(flashcards) : [];
    }

    getFlashcardsByTopic(topicId) {
        const flashcards = this.getFlashcards();
        return flashcards.filter(f => f.topicId === topicId);
    }

    saveFlashcard(flashcard) {
        const flashcards = this.getFlashcards();
        const index = flashcards.findIndex(f => f.id === flashcard.id);
        if (index !== -1) {
            flashcards[index] = flashcard;
        } else {
            flashcards.push(flashcard);
        }
        this.saveFlashcards(flashcards);
    }

    deleteFlashcard(flashcardId) {
        const flashcards = this.getFlashcards();
        const filtered = flashcards.filter(f => f.id !== flashcardId);
        if (filtered.length === flashcards.length) return false;
        this.saveFlashcards(filtered);
        return true;
    }

    deleteFlashcardsByTopic(topicId) {
        const flashcards = this.getFlashcards();
        const filtered = flashcards.filter(f => f.topicId !== topicId);
        this.saveFlashcards(filtered);
    }

    clearAll() {
        localStorage.removeItem(this.COURSES_KEY);
        localStorage.removeItem(this.TOPICS_KEY);
        localStorage.removeItem(this.FLASHCARDS_KEY);
    }
}
