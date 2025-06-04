// manages topic-related operations like create, edit, delete, and selection

class TopicsManager {
    constructor(storage, ui) {
        this.storage = storage;
        this.ui = ui;
        this.currentTopicId = null;
        this.currentCourseId = null;
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
        // Save topic button
        document.getElementById('save-topic-btn')?.addEventListener('click', () => this.saveTopic());

        // Delete topic button
        document.getElementById('delete-topic-btn')?.addEventListener('click', () => {
            if (this.currentTopicId) {
                const confirmDelete = confirm('Are you sure you want to delete this topic? All flashcards in this topic will also be deleted.');
                if (confirmDelete) {
                    this.deleteTopic(this.currentTopicId);
                }
            }
        });

        // Add topic button
        document.getElementById('add-topic-btn')?.addEventListener('click', () => {
            if (!this.currentCourseId) {
                this.ui.showNotification('Please select a course first', 'error');
                return;
            }
            this.showTopicModal();
        });

        // Topic grid click handlers
        document.getElementById('topics-grid')?.addEventListener('click', (e) => {
            const topicCard = e.target.closest('.topic-card');
            if (!topicCard) return;

            const topicId = topicCard.dataset.id;
            if (!topicId) return;

            // If edit button was clicked
            if (e.target.classList.contains('edit-topic-btn')) {
                this.showTopicModal(topicId);
                return;
            }

            // Otherwise, select the topic
            this.selectTopic(topicId);
        });

        // Course assignment form submit
        document.getElementById('course-assignment-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const courseSelect = document.getElementById('course-select');
            if (courseSelect && this.currentTopicId) {
                this.assignCourse(this.currentTopicId, courseSelect.value);
            }
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
            console.error('Error fetching topic:', error);
            return null;
        }
    }

    // select and load a topic
    async selectTopic(topicId) {
        try {
            const topic = await this.getTopicById(topicId);
            if (!topic) {
                this.ui.showNotification('Topic not found', 'error');
                return;
            }
            
            this.currentTopicId = topic.id;
            
            if (this.coursesManager && topic.courseId) {
                this.currentCourseId = topic.courseId;
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
            this.ui.showNotification('Failed to load topic', 'error');
        }
    }

    // Show topic creation/edit modal
    showTopicModal(topicId = null) {
        if (!this.currentCourseId && !topicId) {
            this.ui.showNotification('Please select a course first', 'error');
            return;
        }

        if (topicId) {
            // For editing, load the topic data first
            this.currentTopicId = topicId;
            this.getTopicById(topicId).then(topic => {
                if (topic) {
                    this.ui.openModal('topic', topic);
                } else {
                    this.ui.showNotification('Failed to load topic data', 'error');
                }
            });
        } else {
            // For creating a new topic
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
            this.ui.showNotification('Failed to load courses', 'error');
        }
    }

    // Save topic
    async saveTopic() {
        const title = document.getElementById('topic-name').value.trim();
        const description = document.getElementById('topic-desc').value.trim();

        if (!title) {
            this.ui.showNotification('Topic title is required', 'error');
            return;
        }

        if (!this.currentCourseId && !this.currentTopicId) {
            this.ui.showNotification('Please select a course first', 'error');
            return;
        }

        try {
            const modalTitle = document.getElementById('topic-modal-title').textContent.toLowerCase();
            const isEditing = this.currentTopicId && modalTitle.startsWith('edit');

            if (isEditing) {
                const topic = await this.getTopicById(this.currentTopicId);
                if (topic) {
                    topic.title = title;
                    topic.description = description;
                    await this.storage.saveTopic(topic);
                    this.ui.showNotification('Topic updated successfully', 'success');
                    
                    if (topic.courseId && this.coursesManager) {
                        await this.coursesManager.selectCourse(topic.courseId);
                    }
                }
            } else {
                const newTopic = {
                    courseId: this.currentCourseId,
                    title: title,
                    description: description
                };
                const savedTopic = await this.storage.saveTopic(newTopic);
                this.ui.showNotification('Topic created successfully', 'success');
                this.currentTopicId = savedTopic.id;

                // Refresh the course view
                if (this.coursesManager) {
                    await this.coursesManager.selectCourse(this.currentCourseId);
                }
            }

            // Close the modal using UIManager
            this.ui.closeAllModals();
        } catch (error) {
            console.error('Error saving topic:', error);
            this.ui.showNotification('Failed to save topic', 'error');
        }
    }

    // Assign course to topic
    async assignCourse(topicId, courseId) {
        try {
            await this.storage.assignCourse(topicId, courseId);
            this.ui.showNotification('Course assigned successfully', 'success');
            
            // Refresh course view if we have a courses manager
            if (this.coursesManager) {
                await this.coursesManager.selectCourse(courseId);
            }
            
            // Close the modal using UIManager
            this.ui.closeAllModals();
        } catch (error) {
            console.error('Error assigning course:', error);
            this.ui.showNotification('Failed to assign course', 'error');
        }
    }

    // Load unassigned topics
    async loadUnassignedTopics() {
        try {
            const topics = await this.storage.getUnassignedTopics();
            this.displayUnassignedTopics(topics);
        } catch (error) {
            console.error('Error loading unassigned topics:', error);
            this.ui.showNotification('Failed to load unassigned topics', 'error');
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
