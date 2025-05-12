/**
 * TopicsManager class
 * Manages all operations related to topics
 */
class TopicsManager {
    /**
     * Create a TopicsManager
     * @param {StorageManager} storage - StorageManager instance
     * @param {UIManager} ui - UIManager instance
     */
    constructor(storage, ui) {
        this.storage = storage;
        this.ui = ui;
        this.currentCourseId = null;
        this.currentTopicId = null;
        this.coursesManager = null;
        
        // Initialize event listeners
        this.initEventListeners();
    }

    /**
     * Set the CoursesManager instance
     * @param {CoursesManager} coursesManager - CoursesManager instance
     */
    setCoursesManager(coursesManager) {
        this.coursesManager = coursesManager;
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Topic form submission
        document.getElementById('topic-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTopic();
        });
        
        // Add topic button
        document.getElementById('add-topic-btn').addEventListener('click', () => {
            this.currentCourseId = this.coursesManager.currentCourseId;
            this.ui.openModal('topic');
        });
        
        // Topics grid click event delegation
        document.getElementById('topics-grid').addEventListener('click', (e) => {
            const topicCard = e.target.closest('.topic-card');
            if (topicCard) {
                const topicId = topicCard.dataset.id;
                this.selectTopic(topicId);
            }
        });
        
        // Edit topic button
        document.getElementById('edit-topic-btn').addEventListener('click', () => {
            if (this.currentTopicId) {
                const topic = this.getTopicById(this.currentTopicId);
                if (topic) {
                    this.ui.openModal('topic', topic);
                }
            }
        });
        
        // Delete topic button
        document.getElementById('delete-topic-btn').addEventListener('click', () => {
            if (this.currentTopicId) {
                this.ui.openModal('confirm', {
                    title: 'Delete Topic',
                    message: 'Are you sure you want to delete this topic? This will also delete all flashcards within it.',
                    confirmText: 'Delete',
                    onConfirm: () => {
                        this.deleteTopic(this.currentTopicId);
                        this.ui.closeAllModals();
                    }
                });
            }
        });
    }

    /**
     * Set the current course ID
     * @param {string} courseId - ID of the current course
     */
    setCurrentCourseId(courseId) {
        this.currentCourseId = courseId;
    }

    /**
     * Get a topic by ID
     * @param {string} topicId - ID of the topic
     * @returns {Object|null} The topic object or null if not found
     */
    getTopicById(topicId) {
        const topics = this.storage.getTopics();
        return topics.find(topic => topic.id === topicId) || null;
    }

    /**
     * Select a topic and show its details
     * @param {string} topicId - ID of the topic
     */
    selectTopic(topicId) {
        // Update current topic
        this.currentTopicId = topicId;
        
        // Get the topic
        const topic = this.getTopicById(topicId);
        if (!topic) return;
        
        // Update current course ID
        this.currentCourseId = topic.courseId;
        
        // Update UI to show the selected topic
        this.ui.renderTopicDetails(topic);
        
        // Load and render flashcards for this topic
        const flashcards = this.storage.getFlashcardsByTopic(topicId);
        this.ui.renderFlashcardsList(flashcards);
        
        // Show the topic view
        this.ui.showSection('topic');
    }

    /**
     * Save a topic (new or edit)
     */
    saveTopic() {
        const titleInput = document.getElementById('topic-name');
        const descInput = document.getElementById('topic-desc');
        
        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        
        if (!title) {
            this.ui.showNotification('Topic title is required', 'error');
            return;
        }
        
        // Check if we're editing or creating a new topic
        if (this.currentTopicId && document.getElementById('topic-modal-title').textContent.startsWith('Edit')) {
            // Update existing topic
            const topic = this.getTopicById(this.currentTopicId);
            if (topic) {
                topic.title = title;
                topic.description = description;
                topic.updatedAt = new Date();
                this.storage.saveTopic(topic);
                this.ui.showNotification('Topic updated successfully', 'success');
                
                // Refresh the topic view
                this.selectTopic(this.currentTopicId);
            }
        } else {
            // Create new topic
            const newTopic = new Topic(this.currentCourseId, title, description);
            this.storage.saveTopic(newTopic);
            this.ui.showNotification('Topic created successfully', 'success');
            
            // Select the new topic
            this.currentTopicId = newTopic.id;
            
            // Refresh course view to show new topic
            if (this.coursesManager) {
                this.coursesManager.selectCourse(this.currentCourseId);
            }
        }
        
        // Close the modal
        this.ui.closeAllModals();
    }

    /**
     * Delete a topic
     * @param {string} topicId - ID of the topic to delete
     */
    deleteTopic(topicId) {
        const topic = this.getTopicById(topicId);
        if (!topic) return;
        
        const courseId = topic.courseId;
        const success = this.storage.deleteTopic(topicId);
        
        if (success) {
            this.ui.showNotification('Topic deleted successfully', 'success');
            
            // Clear current topic
            if (this.currentTopicId === topicId) {
                this.currentTopicId = null;
            }
            
            // Go back to course view
            if (this.coursesManager) {
                this.coursesManager.selectCourse(courseId);
            }
        } else {
            this.ui.showNotification('Failed to delete topic', 'error');
        }
    }

    /**
     * Search topics by term
     * @param {string} term - The search term
     * @returns {Array} Matching topic objects
     */
    searchTopics(term) {
        if (!term) return [];
        
        term = term.toLowerCase();
        const topics = this.storage.getTopics();
        
        return topics.filter(topic => {
            return (
                topic.title.toLowerCase().includes(term) ||
                (topic.description && topic.description.toLowerCase().includes(term))
            );
        });
    }
}