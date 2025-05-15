// manages topic-related operations like create, edit, delete, and selection

class TopicsManager {
    constructor(storage, ui) {
        this.storage = storage;
        this.ui = ui;
        this.currentCourseId = null;
        this.currentTopicId = null;
        this.coursesManager = null;
        this.initEventListeners();
    }

    // inject courses manager reference
    setCoursesManager(coursesManager) {
        this.coursesManager = coursesManager;
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

        document.getElementById('edit-topic-btn').addEventListener('click', () => {
            if (!this.currentTopicId) return;
            const topic = this.getTopicById(this.currentTopicId);
            if (topic) this.ui.openModal('topic', topic);
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
    getTopicById(topicId) {
        const topics = this.storage.getTopics();
        return topics.find(topic => topic.id === topicId) || null;
    }

    // select and load a topic
    selectTopic(topicId) {
        this.currentTopicId = topicId;
        const topic = this.getTopicById(topicId);
        if (!topic) return;

        this.currentCourseId = topic.courseId;
        this.ui.renderTopicDetails(topic);

        const flashcards = this.storage.getFlashcardsByTopic(topicId);
        this.ui.renderFlashcardsList(flashcards);

        this.ui.showSection('topic');
    }

    // create or update a topic
    saveTopic() {
        const title = document.getElementById('topic-name').value.trim();
        const description = document.getElementById('topic-desc').value.trim();

        if (!title) {
            this.ui.showNotification('Topic title is required', 'error');
            return;
        }

        const isEditing = this.currentTopicId &&
            document.getElementById('topic-modal-title').textContent.startsWith('Edit');

        if (isEditing) {
            const topic = this.getTopicById(this.currentTopicId);
            if (topic) {
                topic.title = title;
                topic.description = description;
                topic.updatedAt = new Date();
                this.storage.saveTopic(topic);
                this.ui.showNotification('Topic updated successfully', 'success');
                this.selectTopic(this.currentTopicId);
            }
        } else {
            const newTopic = new Topic(this.currentCourseId, title, description);
            this.storage.saveTopic(newTopic);
            this.ui.showNotification('Topic created successfully', 'success');
            this.currentTopicId = newTopic.id;
            if (this.coursesManager) {
                this.coursesManager.selectCourse(this.currentCourseId);
            }
        }

        this.ui.closeAllModals();
    }

    // delete a topic and refresh the course view
    deleteTopic(topicId) {
        const topic = this.getTopicById(topicId);
        if (!topic) return;

        const courseId = topic.courseId;
        const success = this.storage.deleteTopic(topicId);

        if (success) {
            this.ui.showNotification('Topic deleted successfully', 'success');
            if (this.currentTopicId === topicId) {
                this.currentTopicId = null;
            }
            if (this.coursesManager) {
                this.coursesManager.selectCourse(courseId);
            }
        } else {
            this.ui.showNotification('Failed to delete topic', 'error');
        }
    }

    // search for topics by keyword
    searchTopics(term) {
        if (!term) return [];

        term = term.toLowerCase();
        return this.storage.getTopics().filter(topic =>
            topic.title.toLowerCase().includes(term) ||
            (topic.description && topic.description.toLowerCase().includes(term))
        );
    }
}
