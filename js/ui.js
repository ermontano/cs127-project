/**
 * UIManager class
 * Handles UI interactions and DOM updates
 */
class UIManager {
    constructor() {
        // References to main sections
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.courseView = document.getElementById('course-view');
        this.topicView = document.getElementById('topic-view');
        this.studyMode = document.getElementById('study-mode');
        
        // References to modals
        this.courseModal = document.getElementById('course-modal');
        this.topicModal = document.getElementById('topic-modal');
        this.flashcardModal = document.getElementById('flashcard-modal');
        this.confirmModal = document.getElementById('confirm-modal');
        
        // Initialize UI event listeners
        this.initializeUIEvents();
    }

    /**
     * Initialize UI event listeners
     */
    initializeUIEvents() {
        // Welcome screen
        document.getElementById('welcome-create-course').addEventListener('click', () => {
            this.openModal('course');
        });
        
        // Modal close buttons
        document.querySelectorAll('.close-button, [id^=cancel-][id$=-btn]').forEach(button => {
            button.addEventListener('click', () => {
                this.closeAllModals();
            });
        });
        
        // Prevent modal content clicks from closing the modal
        document.querySelectorAll('.modal-content').forEach(content => {
            content.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
        
        // Navigation
        document.getElementById('back-to-course-btn').addEventListener('click', () => {
            this.showSection('course');
        });
        
        document.getElementById('exit-study-btn').addEventListener('click', () => {
            this.showSection('topic');
        });
        
        // Study mode buttons
        document.getElementById('flip-card-btn').addEventListener('click', () => {
            const flashcard = document.getElementById('study-flashcard');
            flashcard.classList.toggle('flipped');
        });

        // Ensure modal content clicks do not close the modal
        this.courseModal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    /**
     * Show a specific section and hide others
     * @param {string} section - The section to show ('welcome', 'course', 'topic', or 'study')
     */
    showSection(section) {
        // Hide all sections
        this.welcomeScreen.classList.add('hidden');
        this.courseView.classList.add('hidden');
        this.topicView.classList.add('hidden');
        this.studyMode.classList.add('hidden');
        
        // Show the requested section
        switch (section) {
            case 'welcome':
                this.welcomeScreen.classList.remove('hidden');
                break;
            case 'course':
                this.courseView.classList.remove('hidden');
                break;
            case 'topic':
                this.topicView.classList.remove('hidden');
                break;
            case 'study':
                this.studyMode.classList.remove('hidden');
                break;
        }
    }

    /**
     * Render the courses list in the sidebar
     * @param {Array} courses - Array of course objects
     * @param {string} activeCourseId - ID of the active course
     */
    renderCoursesList(courses, activeCourseId = null) {
        const coursesList = document.getElementById('courses-list');
        coursesList.innerHTML = '';
        
        if (courses.length === 0) {
            coursesList.innerHTML = `
                <div class="empty-state">
                    <p>No courses yet</p>
                </div>
            `;
            return;
        }
        
        courses.forEach(course => {
            const courseElement = document.createElement('div');
            courseElement.className = 'course-item';
            courseElement.dataset.id = course.id;
            
            if (course.id === activeCourseId) {
                courseElement.classList.add('active');
            }
            
            courseElement.innerHTML = `
                <div class="course-item-info">
                    <div class="course-item-title">${course.title}</div>
                    <div class="course-item-count">
                        <span class="topic-count">0</span> topics
                    </div>
                </div>
            `;
            
            coursesList.appendChild(courseElement);
        });
    }

    /**
     * Update the topics count for a course in the sidebar
     * @param {string} courseId - ID of the course
     * @param {number} count - Number of topics
     */
    updateCourseTopicsCount(courseId, count) {
        const courseElement = document.querySelector(`.course-item[data-id="${courseId}"]`);
        if (courseElement) {
            const countElement = courseElement.querySelector('.topic-count');
            countElement.textContent = count;
        }
    }

    /**
     * Render the course details
     * @param {Object} course - Course object
     */
    renderCourseDetails(course) {
        document.getElementById('course-title').textContent = course.title;
        document.getElementById('course-description').textContent = course.description || 'No description';
    }

    /**
     * Render the topics grid for a course
     * @param {Array} topics - Array of topic objects
     */
    renderTopicsGrid(topics) {
        const topicsGrid = document.getElementById('topics-grid');
        topicsGrid.innerHTML = '';
        
        if (topics.length === 0) {
            topicsGrid.innerHTML = `
                <div class="empty-state">
                    <p>No topics yet. Create your first topic!</p>
                </div>
            `;
            return;
        }
        
        topics.forEach(topic => {
            const topicElement = document.createElement('div');
            topicElement.className = 'topic-card';
            topicElement.dataset.id = topic.id;
            
            topicElement.innerHTML = `
                <h4 class="topic-card-title">${topic.title}</h4>
                <p class="topic-card-description">${topic.description || 'No description'}</p>
                <div class="topic-card-meta">
                    <span class="flashcard-count">0 flashcards</span>
                    <span class="topic-date">${formatDate(new Date(topic.createdAt))}</span>
                </div>
            `;
            
            topicsGrid.appendChild(topicElement);
        });
    }

    /**
     * Update the flashcards count for a topic in the topics grid
     * @param {string} topicId - ID of the topic
     * @param {number} count - Number of flashcards
     */
    updateTopicFlashcardsCount(topicId, count) {
        const topicElement = document.querySelector(`.topic-card[data-id="${topicId}"]`);
        if (topicElement) {
            const countElement = topicElement.querySelector('.flashcard-count');
            countElement.textContent = `${count} flashcard${count !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Render the topic details
     * @param {Object} topic - Topic object
     */
    renderTopicDetails(topic) {
        document.getElementById('topic-title').textContent = topic.title;
        document.getElementById('topic-description').textContent = topic.description || 'No description';
    }

    /**
     * Render the flashcards list for a topic
     * @param {Array} flashcards - Array of flashcard objects
     */
    renderFlashcardsList(flashcards) {
        const flashcardsList = document.getElementById('flashcards-list');
        flashcardsList.innerHTML = '';
        
        if (flashcards.length === 0) {
            flashcardsList.innerHTML = `
                <div class="empty-state">
                    <p>No flashcards yet. Create your first flashcard!</p>
                </div>
            `;
            return;
        }
        
        flashcards.forEach(flashcard => {
            const flashcardElement = document.createElement('div');
            flashcardElement.className = 'flashcard-item';
            flashcardElement.dataset.id = flashcard.id;
            
            flashcardElement.innerHTML = `
                <div class="flashcard-question">${flashcard.question}</div>
                <div class="flashcard-answer">${flashcard.answer}</div>
                <div class="flashcard-actions">
                    <button class="edit-flashcard-btn icon-button" title="Edit Flashcard">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-flashcard-btn icon-button" title="Delete Flashcard">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            
            flashcardsList.appendChild(flashcardElement);
        });
    }

    /**
     * Open a modal
     * @param {string} type - The type of modal to open ('course', 'topic', 'flashcard', or 'confirm')
     * @param {Object} data - Optional data to populate the modal with
     */
    openModal(type, data = null) {
        // Close any open modals first
        this.closeAllModals();
        
        let modal, titleElement, isEdit = false;
        
        switch (type) {
            case 'course':
                modal = this.courseModal;
                titleElement = document.getElementById('course-modal-title');
                
                // Set form fields
                if (data) {
                    isEdit = true;
                    document.getElementById('course-name').value = data.title;
                    document.getElementById('course-desc').value = data.description || '';
                } else {
                    document.getElementById('course-name').value = '';
                    document.getElementById('course-desc').value = '';
                }
                break;
                
            case 'topic':
                modal = this.topicModal;
                titleElement = document.getElementById('topic-modal-title');
                
                // Set form fields
                if (data) {
                    isEdit = true;
                    document.getElementById('topic-name').value = data.title;
                    document.getElementById('topic-desc').value = data.description || '';
                } else {
                    document.getElementById('topic-name').value = '';
                    document.getElementById('topic-desc').value = '';
                }
                break;
                
            case 'flashcard':
                modal = this.flashcardModal;
                titleElement = document.getElementById('flashcard-modal-title');
                
                // Set form fields
                if (data) {
                    isEdit = true;
                    document.getElementById('flashcard-question').value = data.question;
                    document.getElementById('flashcard-answer').value = data.answer;
                } else {
                    document.getElementById('flashcard-question').value = '';
                    document.getElementById('flashcard-answer').value = '';
                }
                break;
                
            case 'confirm':
                modal = this.confirmModal;
                titleElement = document.getElementById('confirm-title');
                
                if (data) {
                    document.getElementById('confirm-title').textContent = data.title || 'Confirm Action';
                    document.getElementById('confirm-message').textContent = data.message || 'Are you sure you want to proceed?';
                    
                    // Set the confirm button
                    const confirmButton = document.getElementById('confirm-action-btn');
                    confirmButton.textContent = data.confirmText || 'Confirm';
                    confirmButton.onclick = data.onConfirm || (() => this.closeAllModals());
                }
                break;
        }
        
        // Update modal title
        if (titleElement) {
            titleElement.textContent = isEdit ? `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}` : `Add New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        }
        
        // Show the modal
        if (modal) {
            modal.classList.add('show');
            
            // Set timeout to add the transition effect
            setTimeout(() => {
                modal.style.opacity = '1';
            }, 10);
            
            // Focus the first input
            const firstInput = modal.querySelector('input, textarea');
            if (firstInput) {
                setTimeout(() => {
                    firstInput.focus();
                }, 300);
            }
        }
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        const modals = [this.courseModal, this.topicModal, this.flashcardModal, this.confirmModal];
        
        modals.forEach(modal => {
            if (modal.classList.contains('show')) {
                modal.style.opacity = '0';
                
                // Remove the show class after the transition
                setTimeout(() => {
                    modal.classList.remove('show');
                }, 300);
            }
        });
    }

    /**
     * Show a notification message
     * @param {string} message - The message to show
     * @param {string} type - The type of notification ('success', 'error', 'warning', or 'info')
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${getIconForType(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="close-notification">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Add the show class after a small delay to trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Add close button functionality
        notification.querySelector('.close-notification').addEventListener('click', () => {
            removeNotification(notification);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            removeNotification(notification);
        }, 5000);
        
        function removeNotification(notificationElement) {
            notificationElement.classList.remove('show');
            
            // Remove from document after animation
            setTimeout(() => {
                notificationElement.remove();
            }, 300);
        }
        
        function getIconForType(notificationType) {
            switch (notificationType) {
                case 'success':
                    return 'fa-check-circle';
                case 'error':
                    return 'fa-exclamation-circle';
                case 'warning':
                    return 'fa-exclamation-triangle';
                default:
                    return 'fa-info-circle';
            }
        }
    }
}

/**
 * Format a date to a human-readable string
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const day = 24 * 60 * 60 * 1000;
    
    if (diff < day) {
        return 'Today';
    } else if (diff < 2 * day) {
        return 'Yesterday';
    } else if (diff < 7 * day) {
        return `${Math.floor(diff / day)} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Add CSS for notifications
const styleElement = document.createElement('style');
styleElement.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        min-width: 300px;
        max-width: 400px;
        padding: 12px 16px;
        border-radius: 8px;
        background-color: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(120%);
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .notification.success {
        border-left: 4px solid var(--success-500);
    }
    
    .notification.error {
        border-left: 4px solid var(--error-500);
    }
    
    .notification.warning {
        border-left: 4px solid var(--warning-500);
    }
    
    .notification.info {
        border-left: 4px solid var(--primary-700);
    }
    
    .notification.success i {
        color: var(--success-500);
    }
    
    .notification.error i {
        color: var(--error-500);
    }
    
    .notification.warning i {
        color: var(--warning-500);
    }
    
    .notification.info i {
        color: var(--primary-700);
    }
    
    .close-notification {
        background: none;
        border: none;
        color: var(--text-tertiary);
        cursor: pointer;
    }
    
    .close-notification:hover {
        color: var(--text-primary);
    }
`;

document.head.appendChild(styleElement);