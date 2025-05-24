// API storage manager for flashcards maker - database only (no localStorage)

class StorageManager {
    constructor() {
        this.baseUrl = window.location.origin + '/api';
    }

    // Generic API call helper
    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    ...options.headers
                },
                ...options
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data.data;
        } catch (error) {
            console.error(`API call failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // Helper method to validate IDs
    validateId(id, type = 'ID') {
        if (id === undefined || id === null || id === '' || id === 'undefined') {
            throw new Error(`Invalid ${type}: ${id}`);
        }
        return id;
    }

    // Course methods
    async getCourses() {
        return await this.apiCall('/courses');
    }

    async saveCourse(course) {
        // Simplified logic: if course has an ID, try to update; otherwise create
        if (course.id) {
            try {
                // Update existing course
                console.log('Updating course with ID:', course.id);
                return await this.apiCall(`/courses/${course.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        title: course.title,
                        description: course.description
                    })
                });
            } catch (error) {
                console.error('Failed to update course:', error);
                throw error;
            }
        } else {
            try {
                // Create new course
                console.log('Creating new course');
                return await this.apiCall('/courses', {
                    method: 'POST',
                    body: JSON.stringify({
                        title: course.title,
                        description: course.description
                    })
                });
            } catch (error) {
                console.error('Failed to create course:', error);
                throw error;
            }
        }
    }

    async getCourseById(courseId) {
        try {
            this.validateId(courseId, 'course ID');
            return await this.apiCall(`/courses/${courseId}`);
        } catch (error) {
            if (error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    async deleteCourse(courseId) {
        try {
            this.validateId(courseId, 'course ID');
            await this.apiCall(`/courses/${courseId}`, { method: 'DELETE' });
            return true;
        } catch (error) {
            console.error('Failed to delete course:', error);
            return false;
        }
    }

    // Topic methods
    async getTopics() {
        return await this.apiCall('/topics');
    }

    async getTopicsByCourse(courseId) {
        this.validateId(courseId, 'course ID');
        return await this.apiCall(`/topics?courseId=${courseId}`);
    }

    async saveTopic(topic) {
        // Simplified logic: if topic has an ID, try to update; otherwise create
        if (topic.id) {
            try {
                // Update existing topic
                console.log('Updating topic with ID:', topic.id);
                return await this.apiCall(`/topics/${topic.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        title: topic.title,
                        description: topic.description
                    })
                });
            } catch (error) {
                console.error('Failed to update topic:', error);
                throw error;
            }
        } else {
            try {
                // Create new topic
                console.log('Creating new topic for course:', topic.courseId);
                this.validateId(topic.courseId, 'course ID');
                return await this.apiCall('/topics', {
                    method: 'POST',
                    body: JSON.stringify({
                        courseId: topic.courseId,
                        title: topic.title,
                        description: topic.description
                    })
                });
            } catch (error) {
                console.error('Failed to create topic:', error);
                throw error;
            }
        }
    }

    async getTopicById(topicId) {
        try {
            this.validateId(topicId, 'topic ID');
            return await this.apiCall(`/topics/${topicId}`);
        } catch (error) {
            if (error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    async deleteTopic(topicId) {
        try {
            this.validateId(topicId, 'topic ID');
            await this.apiCall(`/topics/${topicId}`, { method: 'DELETE' });
            return true;
        } catch (error) {
            console.error('Failed to delete topic:', error);
            return false;
        }
    }

    // Flashcard methods
    async getFlashcards() {
        return await this.apiCall('/flashcards');
    }

    async getFlashcardsByTopic(topicId) {
        this.validateId(topicId, 'topic ID');
        return await this.apiCall(`/flashcards?topicId=${topicId}`);
    }

    async saveFlashcard(flashcard) {
        // Simplified logic: if flashcard has an ID, try to update; otherwise create
        if (flashcard.id) {
            try {
                // Update existing flashcard
                console.log('Updating flashcard with ID:', flashcard.id);
                return await this.apiCall(`/flashcards/${flashcard.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        question: flashcard.question,
                        answer: flashcard.answer
                    })
                });
            } catch (error) {
                console.error('Failed to update flashcard:', error);
                throw error;
            }
        } else {
            try {
                // Create new flashcard
                console.log('Creating new flashcard for topic:', flashcard.topicId);
                this.validateId(flashcard.topicId, 'topic ID');
                return await this.apiCall('/flashcards', {
                    method: 'POST',
                    body: JSON.stringify({
                        topicId: flashcard.topicId,
                        question: flashcard.question,
                        answer: flashcard.answer
                    })
                });
            } catch (error) {
                console.error('Failed to create flashcard:', error);
                throw error;
            }
        }
    }

    async getFlashcardById(flashcardId) {
        try {
            this.validateId(flashcardId, 'flashcard ID');
            return await this.apiCall(`/flashcards/${flashcardId}`);
        } catch (error) {
            if (error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    async deleteFlashcard(flashcardId) {
        try {
            this.validateId(flashcardId, 'flashcard ID');
            await this.apiCall(`/flashcards/${flashcardId}`, { method: 'DELETE' });
            return true;
        } catch (error) {
            console.error('Failed to delete flashcard:', error);
            return false;
        }
    }

    async markFlashcardAsReviewed(flashcardId) {
        try {
            this.validateId(flashcardId, 'flashcard ID');
            return await this.apiCall(`/flashcards/${flashcardId}/review`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Failed to mark flashcard as reviewed:', error);
            throw error;
        }
    }

    // Legacy compatibility methods (these are now handled by database CASCADE)
    async deleteTopicsByCourse(courseId) {
        // This is handled automatically by the database CASCADE
        console.log('Topics will be deleted automatically when course is deleted');
    }

    async deleteFlashcardsByTopic(topicId) {
        // This is handled automatically by the database CASCADE
        console.log('Flashcards will be deleted automatically when topic is deleted');
    }

    // Legacy methods no longer needed with API storage
    saveCourses(courses) {
        console.warn('saveCourses called - not needed with API storage');
    }

    saveTopics(topics) {
        console.warn('saveTopics called - not needed with API storage');
    }

    saveFlashcards(flashcards) {
        console.warn('saveFlashcards called - not needed with API storage');
    }

    clearAll() {
        console.warn('clearAll not implemented for API storage - please delete items individually');
    }
}
