// manages topic-related operations like create, edit, delete, and selection

class TopicsManager {
    constructor(storage, ui) {
        this.storage = storage;
        this.ui = ui;
        this.currentCourseId = null;
        this.currentTopicId = null;
        this.coursesManager = null;
        this.flashcardsManager = null;
        this.initEventListeners();
    }

    // inject courses manager reference
    setCoursesManager(coursesManager) {
        this.coursesManager = coursesManager;
    }

    // inject flashcards manager reference
    setFlashcardsManager(flashcardsManager) {
        this.flashcardsManager = flashcardsManager;
    }

    // set up UI event listeners
    initEventListeners() {
        document.getElementById('topic-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTopic();
        });

        document.getElementById('add-topic-btn').addEventListener('click', () => {
            this.currentCourseId = this.coursesManager.currentCourseId;
            this.ui.openModal('topic');
        });

        document.getElementById('topics-grid').addEventListener('click', (e) => {
            const topicCard = e.target.closest('.topic-card');
            if (topicCard) this.selectTopic(topicCard.dataset.id);
        });

        document.getElementById('edit-topic-btn').addEventListener('click', async () => {
            if (!this.currentTopicId) return;
            try {
                const topic = await this.getTopicById(this.currentTopicId);
                if (topic) this.ui.openModal('topic', topic);
            } catch (error) {
                console.error('Error loading topic for editing:', error);
                this.ui.showNotification('Failed to load topic data', 'error');
            }
        });

        document.getElementById('delete-topic-btn').addEventListener('click', () => {
            if (!this.currentTopicId) return;
            this.ui.openModal('confirm', {
                title: 'Delete Topic',
                message: 'Are you sure you want to delete this topic? This will also delete all flashcards within it.',
                confirmText: 'Delete',
                onConfirm: () => {
                    this.deleteTopic(this.currentTopicId);
                    this.ui.closeAllModals();
                }
            });
        });
    }

    // set current course id
    setCurrentCourseId(courseId) {
        this.currentCourseId = courseId;
    }

    // get a topic by id
    async getTopicById(topicId) {
        try {
            return await this.storage.getTopicById(topicId);
        } catch (error) {
            console.error('Error getting topic by ID:', error);
            return null;
        }
    }

    // select and load a topic
    async selectTopic(topicId) {
        try {
            this.currentTopicId = topicId;
            const topic = await this.getTopicById(topicId);
            if (!topic) return;

            this.currentCourseId = topic.courseId;
            
            // Notify FlashcardsManager of the current topic
            if (this.flashcardsManager) {
                this.flashcardsManager.setCurrentTopicId(topicId);
            }
            
            this.ui.renderTopicDetails(topic);

            const flashcards = await this.storage.getFlashcardsByTopic(topicId);
            this.ui.renderFlashcardsList(flashcards);

            this.ui.showSection('topic');
        } catch (error) {
            console.error('Error selecting topic:', error);
            this.ui.showNotification('Failed to load topic', 'error');
        }
    }

    // create or update a topic
    async saveTopic() {
        const title = document.getElementById('topic-name').value.trim();
        const description = document.getElementById('topic-desc').value.trim();

        if (!title) {
            this.ui.showNotification('Topic title is required', 'error');
            return;
        }

        try {
            const modalTitle = document.getElementById('topic-modal-title').textContent.toLowerCase();
            const isEditing = this.currentTopicId && modalTitle.startsWith('edit');

            console.log('Save topic - modalTitle:', modalTitle, 'isEditing:', isEditing, 'currentTopicId:', this.currentTopicId);

            if (isEditing) {
                const topic = await this.getTopicById(this.currentTopicId);
                if (topic) {
                    console.log('Editing topic with ID:', topic.id, topic);
                    topic.title = title;
                    topic.description = description;
                    topic.updatedAt = new Date();
                    await this.storage.saveTopic(topic);
                    this.ui.showNotification('Topic updated successfully', 'success');
                    
                    // Refresh the course topics list (go back to course view)
                    if (this.coursesManager) {
                        await this.coursesManager.selectCourse(this.currentCourseId);
                    }
                }
            } else {
                console.log('Creating new topic');
                const newTopic = new Topic(this.currentCourseId, title, description);
                const savedTopic = await this.storage.saveTopic(newTopic);
                this.ui.showNotification('Topic created successfully', 'success');
                this.currentTopicId = savedTopic.id;
                if (this.coursesManager) {
                    await this.coursesManager.selectCourse(this.currentCourseId);
                }
            }

            this.ui.closeAllModals();
        } catch (error) {
            console.error('Error saving topic:', error);
            this.ui.showNotification('Failed to save topic', 'error');
        }
    }

    // delete a topic and refresh the course view
    async deleteTopic(topicId) {
        try {
            const topic = await this.getTopicById(topicId);
            if (!topic) return;

            const courseId = topic.courseId;
            const success = await this.storage.deleteTopic(topicId);

            if (success) {
                this.ui.showNotification('Topic deleted successfully', 'success');
                if (this.currentTopicId === topicId) {
                    this.currentTopicId = null;
                }
                if (this.coursesManager) {
                    await this.coursesManager.selectCourse(courseId);
                }
            } else {
                this.ui.showNotification('Failed to delete topic', 'error');
            }
        } catch (error) {
            console.error('Error deleting topic:', error);
            this.ui.showNotification('Failed to delete topic', 'error');
        }
    }

    // search for topics by keyword
    async searchTopics(term) {
        if (!term) return [];

        try {
            term = term.toLowerCase();
            const topics = await this.storage.getTopics();
            return topics.filter(topic =>
                topic.title.toLowerCase().includes(term) ||
                (topic.description && topic.description.toLowerCase().includes(term))
            );
        } catch (error) {
            console.error('Error searching topics:', error);
            return [];
        }
    }
}
