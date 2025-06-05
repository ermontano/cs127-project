// manages topic-related operations like create, edit, delete, and selection

class TopicsManager {
    constructor(storage, ui) {
        this.storage = storage;
        this.ui = ui;
        this.currentTopicId = null; // ID of the topic currently being viewed in detail or edited
        this.currentCourseIdForContext = null; // Course ID context, e.g., when viewing a topic within a course
        this.allTopicsCache = []; // Cache for all topics shown in overview

        // Dependencies, to be injected
        this.coursesManager = null;
        this.flashcardsManager = null;
        this.authManager = null; // For refreshing stats

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

    // inject auth manager reference
    setAuthManager(authManager) {
        this.authManager = authManager;
    }

    // set up UI event listeners
    initEventListeners() {
        // Topic form submission
        const topicForm = document.getElementById('topic-form');
        if (topicForm) {
            topicForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveTopic();
            });
        }

        // Delete Topic button on the Topic View page (for the currently detailed topic)
        // Note: Delete buttons on topic cards in grids are handled by ui.js directly.
        const deleteTopicBtnOnView = document.querySelector('#topic-view #delete-topic-action');
        if (deleteTopicBtnOnView) {
            deleteTopicBtnOnView.addEventListener('click', () => {
                if (this.currentTopicId) {
                    const topicToDelete = this.allTopicsCache.find(t => t.id === this.currentTopicId) || { title: 'this topic' }; // Fallback title
                    this.ui.showConfirmModal(
                        'Delete Topic',
                        `Are you sure you want to delete "${topicToDelete.title}" and all its flashcards?`,
                        () => this.deleteTopic(this.currentTopicId, this.currentCourseIdForContext) // Pass context for UI refresh
                    );
                }
            });
        }
        
        // Edit Topic button on the Topic View page
        const editTopicBtnOnView = document.querySelector('#topic-view #edit-topic-action');
        if (editTopicBtnOnView) {
            editTopicBtnOnView.addEventListener('click', async () => {
                if (this.currentTopicId) {
                    const topic = await this.getTopicById(this.currentTopicId);
                    if (topic) {
                        this.ui.openModal('topic', topic); // Pass full topic data for editing
                    }
                }
            });
        }
        
        // Study flashcards button on Topic View page
        const studyBtnOnView = document.querySelector('#topic-view #study-flashcards-btn');
        if(studyBtnOnView) {
            studyBtnOnView.addEventListener('click', () => {
                if (this.currentTopicId) {
                    this.ui.showStudyMode(this.currentTopicId);
                }
            });
        }
    }

    // set current course id
    setCurrentCourseId(courseId) {
        this.currentCourseIdForContext = courseId;
    }

    // get a topic by id
    async getTopicById(topicId) {
        try {
            return await this.storage.getTopicById(topicId);
        } catch (error) {
            console.error('Error fetching topic by ID:', error);
            this.ui.showPageAlert('Failed to fetch topic details', 'error');
            return null;
        }
    }

    // select and load a topic
    async selectTopic(topicId) {
        try {
            const topic = await this.getTopicById(topicId);
            if (!topic) {
                this.ui.showPageAlert('Topic not found', 'error');
                return;
            }
            
            this.currentTopicId = topic.id;
            
            if (this.coursesManager && topic.courseId) {
                this.currentCourseIdForContext = topic.courseId;
            }
            
            // Notify flashcards manager about the selected topic
            if (this.flashcardsManager) {
                this.flashcardsManager.setCurrentTopicId(topicId);
            }
            
            this.ui.renderTopicDetails(topic);

            const flashcards = await this.storage.getFlashcardsByTopic(topicId);
            this.ui.renderFlashcardsList(flashcards);

            this.ui.showSection('topic');
        } catch (error) {
            console.error('Error selecting topic:', error);
            this.ui.showPageAlert('Failed to load topic', 'error');
        }
    }

    // Show topic creation/edit modal
    showTopicModal(topicId = null) {
        if (topicId) {
            // For editing, load the topic data first
            this.currentTopicId = topicId;
            this.getTopicById(topicId).then(topic => {
                if (topic) {
                    this.ui.openModal('topic', topic);
                } else {
                    this.ui.showPageAlert('Failed to load topic data', 'error');
                }
            });
        } else {
            // For creating a new topic - allow standalone topics
            this.currentTopicId = null;
            this.ui.openModal('topic');
        }
    }

    // Show course assignment modal
    async showCourseAssignmentModal() {
        try {
            // Fetch available courses
            const courses = await this.storage.getCourses();
            this.ui.openModal('course-assignment', { courses });
        } catch (error) {
            console.error('Error loading courses:', error);
            this.ui.showPageAlert('Failed to load courses', 'error');
        }
    }

    // Save topic
    async handleSaveTopic() {
        const formElement = document.getElementById('topic-form');
        const title = formElement.elements['topic-name'].value.trim();
        const description = formElement.elements['topic-desc'].value.trim();
        const editingId = formElement.dataset.editingId;
        // courseId might be an empty string from dataset, convert to null if so for backend consistency
        let courseId = formElement.dataset.courseId || null; 
        if (courseId === '') courseId = null;

        if (!title) {
            this.ui.showFormError('topic-form', 'Topic title is required');
            return;
        }

        try {
            const topicData = { title, description };
            if (editingId) {
                topicData.id = editingId;
            }
            // Only include courseId if it's explicitly set (not null)
            // This allows creating standalone topics or associating with a course.
            if (courseId) { 
                topicData.courseId = courseId;
            }

            const savedTopic = await this.storage.saveTopic(topicData); // API: POST or PUT
            this.ui.closeAllModals();
            this.ui.showToast(editingId ? 'Topic updated successfully' : 'Topic created successfully', 'success');
            
            if (this.authManager) {
                await this.authManager.refreshStats(); // Update stats in user menu and potentially UI
            }

            // Refresh the relevant view
            if (courseId && this.coursesManager && document.getElementById('course-view') && !document.getElementById('course-view').classList.contains('hidden')) {
                // If we were in a specific course view and the topic belongs to that course
                // this.coursesManager.loadCourseDetailsAndTopics(courseId); // Refresh topics in current course view
                this.loadTopicsForCourse(courseId); // More direct
            } else {
                // Default to refreshing and showing the main topics overview
                this.loadAllTopics(); 
                this.ui.showTopicsOverview(); 
            }
            
            // If a new topic was created and we are on topics overview, it will be re-rendered by loadAllTopics.
            // If editing an existing topic, loadAllTopics will also refresh its card.

        } catch (error) {
            console.error('Error saving topic:', error);
            this.ui.showFormError('topic-form', error.message || 'Failed to save topic');
        }
    }

    // Assign course to topic
    async assignCourse(topicId, courseId) {
        try {
            await this.storage.assignCourse(topicId, courseId);
            this.ui.showToast('Course assigned successfully', 'success');
            
            // Refresh course view if we have a courses manager
            if (this.coursesManager) {
                await this.coursesManager.selectCourse(courseId);
            }
            
            // Close the modal using UIManager
            this.ui.closeAllModals();
        } catch (error) {
            console.error('Error assigning course:', error);
            this.ui.showPageAlert('Failed to assign course', 'error');
        }
    }

    // Load unassigned topics
    async loadUnassignedTopics() {
        try {
            const topics = await this.storage.getUnassignedTopics();
            this.displayUnassignedTopics(topics);
        } catch (error) {
            console.error('Error loading unassigned topics:', error);
            this.ui.showPageAlert('Failed to load unassigned topics', 'error');
        }
    }

    // Display unassigned topics in the UI
    displayUnassignedTopics(topics) {
        const container = document.getElementById('unassigned-topics-list');
        if (!container) return;

        container.innerHTML = '';
        
        topics.forEach(topic => {
            const topicElement = document.createElement('div');
            topicElement.className = 'topic-item';
            topicElement.innerHTML = `
                <h3>${topic.title}</h3>
                <p>${topic.description || 'No description'}</p>
                <button class="assign-course-btn" data-topic-id="${topic.id}">
                    Assign to Course
                </button>
            `;
            
            // Add click handler for assign course button
            const assignBtn = topicElement.querySelector('.assign-course-btn');
            assignBtn.addEventListener('click', () => {
                this.currentTopicId = topic.id;
                this.showCourseAssignmentModal();
            });
            
            container.appendChild(topicElement);
        });
    }

    // delete a topic and refresh the course view
    async deleteTopic(topicId, contextCourseId = null) {
        if (!topicId) return;

        try {
            await this.storage.deleteTopic(topicId);
            this.ui.showToast('Topic deleted successfully', 'success');
            this.currentTopicId = null; // Clear current topic context
            this.currentCourseIdForContext = null;

            if (this.authManager) {
                await this.authManager.refreshStats();
            }

            // Determine which view to refresh and show
            const courseViewElement = document.getElementById('course-view');
            const onCourseView = courseViewElement && !courseViewElement.classList.contains('hidden');

            if (onCourseView && contextCourseId && this.coursesManager) {
                // If on a specific course view AND the deleted topic was associated with this context course
                // this.coursesManager.loadCourseDetailsAndTopics(contextCourseId); // This will re-render topics for the course
                this.loadTopicsForCourse(contextCourseId); // More direct call
                // Check if current view is still valid (e.g. after deleting current topic on its page)
                if (document.getElementById('topic-view') && !document.getElementById('topic-view').classList.contains('hidden')) {
                    this.ui.showCourseView(contextCourseId);
                }
            } else {
                // If not on a specific course view, or topic was standalone, or other cases
                // Then refresh the main topics overview and show it.
                await this.loadAllTopics();
                this.ui.showTopicsOverview();
            }
        } catch (error) {
            console.error('Error deleting topic:', error);
            this.ui.showPageAlert('Failed to delete topic. ' + (error.message || ''), 'error');
        }
    }

    // search for topics by keyword
    async searchTopics(term) {
        if (!term) return [];

        try {
            term = term.toLowerCase();
            const topics = await this.storage.getAllTopics();
            return topics.filter(topic =>
                topic.title.toLowerCase().includes(term) ||
                (topic.description && topic.description.toLowerCase().includes(term))
            );
        } catch (error) {
            console.error('Error searching topics:', error);
            return [];
        }
    }

    async loadAllTopics() {
        try {
            console.log('Loading all topics...');
            const topics = await this.storage.getAllTopics(); // Assumes API returns all topics
            console.log('Loaded topics:', topics);
            this.allTopicsCache = topics; // Cache them
            // The gridId 'topics-grid' is for the main topics overview page
            this.ui.renderTopicsGrid(topics, 'topics-grid', 'overview'); 
        } catch (error) {
            console.error('Error loading all topics:', error);
            this.ui.showPageAlert('Failed to load topics', 'error');
            this.ui.renderTopicsGrid([], 'topics-grid', 'overview'); // Show empty state
        }
    }

    async loadTopicsForCourse(courseId) {
        try {
            const topics = await this.storage.getTopicsByCourse(courseId); // API: GET /api/courses/:courseId/topics or /api/topics?courseId=...
            // The gridId 'course-topics-grid' is for the topics grid within a specific course view
            this.ui.renderTopicsGrid(topics, 'course-topics-grid', 'course');
        } catch (error) {
            console.error(`Error loading topics for course ${courseId}:`, error);
            this.ui.showPageAlert('Failed to load topics for this course', 'error');
            this.ui.renderTopicsGrid([], 'course-topics-grid', 'course'); // Show empty state
        }
    }

    // Called by UI when rendering topic cards to get flashcard count
    async getFlashcardCountForTopic(topicId) {
        try {
            return await this.storage.getFlashcardCountForTopic(topicId); // API: GET /api/topics/:topicId/flashcards/count
        } catch (error) {
            console.error(`Error fetching flashcard count for topic ${topicId}:`, error);
            return 0; // Return 0 or 'N/A' on error
        }
    }

    // Load topic details and flashcards for topic view
    async loadTopicDetailsAndFlashcards(topicId, courseId = null) {
        try {
            this.currentTopicId = topicId;
            this.currentCourseIdForContext = courseId;
            
            // Load topic details
            const topic = await this.getTopicById(topicId);
            if (!topic) {
                this.ui.showPageAlert('Topic not found', 'error');
                return;
            }
            
            // Notify flashcards manager about the selected topic
            if (this.flashcardsManager) {
                this.flashcardsManager.setCurrentTopicId(topicId);
                await this.flashcardsManager.loadFlashcardsForTopic(topicId);
            }
            
            // Render topic details
            this.ui.renderTopicDetails(topic);
            
        } catch (error) {
            console.error('Error loading topic details and flashcards:', error);
            this.ui.showPageAlert('Failed to load topic details', 'error');
        }
    }
}

// Initialize TopicsManager and inject dependencies
// This needs to happen after AuthManager and UIManager are initialized.
document.addEventListener('DOMContentLoaded', () => {
    // Check if core managers are ready before initializing app-specific managers
    // A more robust system might use custom events or promises for readiness.
    const checkReadyInterval = setInterval(() => {
        if (window.storageManager && window.uiManager && window.authManager) {
            clearInterval(checkReadyInterval);

            window.topicsManager = new TopicsManager(window.storageManager, window.uiManager);
            
            // Inject dependencies if other managers are also ready
            if (window.coursesManager) {
                window.topicsManager.setCoursesManager(window.coursesManager);
                // If coursesManager also depends on topicsManager, handle potential circular dependency or sequence initialization
            }
            if (window.flashcardsManager) {
                window.topicsManager.setFlashcardsManager(window.flashcardsManager);
            }
            window.topicsManager.setAuthManager(window.authManager); // For stat refresh

            // Initial load of topics if user is authenticated and UI is ready for topics overview
            // This is now primarily handled by AuthManager.updateUI deciding the initial view.
            // However, if that logic defaults to topicsOverview, this would be the place to call loadAllTopics.
            // For now, AuthManager.updateUI calling uiManager.showTopicsOverview() will trigger loadAllTopics in ui.js.
            // If ui.js's showTopicsOverview doesn't call loadAllTopics, then call it here based on initial view.
            // Current ui.js showSection for 'topics-overview' DOES call loadAllTopics().
        }
    }, 100); // Check every 100ms
});
