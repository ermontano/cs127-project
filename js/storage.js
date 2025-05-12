/**
 * StorageManager class
 * Handles persistence of data using localStorage
 */
class StorageManager {
    constructor() {
        this.COURSES_KEY = 'flashcards_courses';
        this.TOPICS_KEY = 'flashcards_topics';
        this.FLASHCARDS_KEY = 'flashcards_cards';
    }

    /**
     * Save courses to localStorage
     * @param {Array} courses - Array of course objects
     */
    saveCourses(courses) {
        localStorage.setItem(this.COURSES_KEY, JSON.stringify(courses));
    }

    /**
     * Get courses from localStorage
     * @returns {Array} Array of course objects
     */
    getCourses() {
        const courses = localStorage.getItem(this.COURSES_KEY);
        return courses ? JSON.parse(courses) : [];
    }

    /**
     * Save a course to localStorage
     * @param {Object} course - Course object to save
     */
    saveCourse(course) {
        const courses = this.getCourses();
        const index = courses.findIndex(c => c.id === course.id);
        
        if (index !== -1) {
            // Update existing course
            courses[index] = course;
        } else {
            // Add new course
            courses.push(course);
        }
        
        this.saveCourses(courses);
    }

    /**
     * Delete a course from localStorage
     * @param {string} courseId - ID of the course to delete
     * @returns {boolean} True if course was deleted, false otherwise
     */
    deleteCourse(courseId) {
        const courses = this.getCourses();
        const filteredCourses = courses.filter(c => c.id !== courseId);
        
        if (filteredCourses.length === courses.length) {
            return false;
        }
        
        this.saveCourses(filteredCourses);
        
        // Also delete associated topics and flashcards
        this.deleteTopicsByCourse(courseId);
        return true;
    }

    /**
     * Save topics to localStorage
     * @param {Array} topics - Array of topic objects
     */
    saveTopics(topics) {
        localStorage.setItem(this.TOPICS_KEY, JSON.stringify(topics));
    }

    /**
     * Get topics from localStorage
     * @returns {Array} Array of topic objects
     */
    getTopics() {
        const topics = localStorage.getItem(this.TOPICS_KEY);
        return topics ? JSON.parse(topics) : [];
    }

    /**
     * Get topics for a specific course
     * @param {string} courseId - ID of the course
     * @returns {Array} Array of topic objects for the course
     */
    getTopicsByCourse(courseId) {
        const topics = this.getTopics();
        return topics.filter(topic => topic.courseId === courseId);
    }

    /**
     * Save a topic to localStorage
     * @param {Object} topic - Topic object to save
     */
    saveTopic(topic) {
        const topics = this.getTopics();
        const index = topics.findIndex(t => t.id === topic.id);
        
        if (index !== -1) {
            // Update existing topic
            topics[index] = topic;
        } else {
            // Add new topic
            topics.push(topic);
        }
        
        this.saveTopics(topics);
    }

    /**
     * Delete a topic from localStorage
     * @param {string} topicId - ID of the topic to delete
     * @returns {boolean} True if topic was deleted, false otherwise
     */
    deleteTopic(topicId) {
        const topics = this.getTopics();
        const filteredTopics = topics.filter(t => t.id !== topicId);
        
        if (filteredTopics.length === topics.length) {
            return false;
        }
        
        this.saveTopics(filteredTopics);
        
        // Also delete associated flashcards
        this.deleteFlashcardsByTopic(topicId);
        return true;
    }

    /**
     * Delete all topics associated with a course
     * @param {string} courseId - ID of the course
     */
    deleteTopicsByCourse(courseId) {
        const topics = this.getTopics();
        const courseTopics = topics.filter(t => t.courseId === courseId);
        
        // Delete flashcards for each topic
        courseTopics.forEach(topic => {
            this.deleteFlashcardsByTopic(topic.id);
        });
        
        // Filter out the topics for this course
        const filteredTopics = topics.filter(t => t.courseId !== courseId);
        this.saveTopics(filteredTopics);
    }

    /**
     * Save flashcards to localStorage
     * @param {Array} flashcards - Array of flashcard objects
     */
    saveFlashcards(flashcards) {
        localStorage.setItem(this.FLASHCARDS_KEY, JSON.stringify(flashcards));
    }

    /**
     * Get flashcards from localStorage
     * @returns {Array} Array of flashcard objects
     */
    getFlashcards() {
        const flashcards = localStorage.getItem(this.FLASHCARDS_KEY);
        return flashcards ? JSON.parse(flashcards) : [];
    }

    /**
     * Get flashcards for a specific topic
     * @param {string} topicId - ID of the topic
     * @returns {Array} Array of flashcard objects for the topic
     */
    getFlashcardsByTopic(topicId) {
        const flashcards = this.getFlashcards();
        return flashcards.filter(flashcard => flashcard.topicId === topicId);
    }

    /**
     * Save a flashcard to localStorage
     * @param {Object} flashcard - Flashcard object to save
     */
    saveFlashcard(flashcard) {
        const flashcards = this.getFlashcards();
        const index = flashcards.findIndex(f => f.id === flashcard.id);
        
        if (index !== -1) {
            // Update existing flashcard
            flashcards[index] = flashcard;
        } else {
            // Add new flashcard
            flashcards.push(flashcard);
        }
        
        this.saveFlashcards(flashcards);
    }

    /**
     * Delete a flashcard from localStorage
     * @param {string} flashcardId - ID of the flashcard to delete
     * @returns {boolean} True if flashcard was deleted, false otherwise
     */
    deleteFlashcard(flashcardId) {
        const flashcards = this.getFlashcards();
        const filteredFlashcards = flashcards.filter(f => f.id !== flashcardId);
        
        if (filteredFlashcards.length === flashcards.length) {
            return false;
        }
        
        this.saveFlashcards(filteredFlashcards);
        return true;
    }

    /**
     * Delete all flashcards associated with a topic
     * @param {string} topicId - ID of the topic
     */
    deleteFlashcardsByTopic(topicId) {
        const flashcards = this.getFlashcards();
        const filteredFlashcards = flashcards.filter(f => f.topicId !== topicId);
        this.saveFlashcards(filteredFlashcards);
    }

    /**
     * Clear all data from localStorage
     */
    clearAll() {
        localStorage.removeItem(this.COURSES_KEY);
        localStorage.removeItem(this.TOPICS_KEY);
        localStorage.removeItem(this.FLASHCARDS_KEY);
    }
}