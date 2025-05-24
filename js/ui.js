// uiManager class
// handles ui interactions and dom updates
class UIManager {
    constructor() {
        // references to main sections
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.courseView = document.getElementById('course-view');
        this.topicView = document.getElementById('topic-view');
        this.studyMode = document.getElementById('study-mode');
        
        // references to modals
        this.courseModal = document.getElementById('course-modal');
        this.topicModal = document.getElementById('topic-modal');
        this.flashcardModal = document.getElementById('flashcard-modal');
        this.confirmModal = document.getElementById('confirm-modal');
        
        // initialize ui event listeners
        this.initializeUIEvents();
    }

    // initialize ui event listeners
    initializeUIEvents() {
        // modal close buttons
        document.querySelectorAll('.close-button, [id^=cancel-][id$=-btn]').forEach(button => {
            button.addEventListener('click', () => {
                this.closeAllModals();
            });
        });
        
        // prevent modal content clicks from closing the modal
        document.querySelectorAll('.modal-content').forEach(content => {
            content.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            // Prevent text selection events from bubbling to modal backdrop
            content.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
            
            content.addEventListener('mouseup', (e) => {
                e.stopPropagation();
            });
            
            content.addEventListener('selectstart', (e) => {
                e.stopPropagation();
            });
        });
        
        // add backdrop click listeners to all modals
        [this.courseModal, this.topicModal, this.flashcardModal, this.confirmModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('mousedown', (e) => {
                    // Store where the mousedown happened
                    modal._mouseDownTarget = e.target;
                });
                
                modal.addEventListener('click', (e) => {
                    // Only close if both mousedown and click happened on the backdrop (modal itself)
                    // This prevents text selection from closing the modal
                    if (e.target === modal && modal._mouseDownTarget === modal) {
                        this.closeAllModals();
                    }
                    // Clear the stored target
                    modal._mouseDownTarget = null;
                });
                
                // Prevent modal from closing during text selection
                modal.addEventListener('selectstart', (e) => {
                    e.stopPropagation();
                });
            }
        });
        
        // navigation
        document.getElementById('back-to-course-btn').addEventListener('click', () => {
            this.showSection('course');
        });
        
        document.getElementById('exit-study-btn').addEventListener('click', () => {
            this.showSection('topic');
        });
        
        // study mode buttons
        document.getElementById('flip-card-btn').addEventListener('click', () => {
            const flashcard = document.getElementById('study-flashcard');
            flashcard.classList.toggle('flipped');
        });
    }

    // show a specific section and hide others
    // @param {string} section - the section to show ('welcome', 'course', 'topic', or 'study')
    showSection(section) {
        // hide all sections
        this.welcomeScreen.classList.add('hidden');
        this.courseView.classList.add('hidden');
        this.topicView.classList.add('hidden');
        this.studyMode.classList.add('hidden');
        
        // show the requested section
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

    // render the courses list in the sidebar
    // @param {array} courses - array of course objects
    // @param {string} activeCourseId - id of the active course
    renderCoursesList(courses, activeCourseId = null) {
        const coursesList = document.getElementById('courses-list');
        coursesList.innerHTML = '';
        
        if (courses.length === 0) {
            coursesList.innerHTML = `
                <div class="empty-state">
                    <p>no courses yet</p>
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

    // update the topics count for a course in the sidebar
    // @param {string} courseId - id of the course
    // @param {number} count - number of topics
    updateCourseTopicsCount(courseId, count) {
        const courseElement = document.querySelector(`.course-item[data-id="${courseId}"]`);
        if (courseElement) {
            const countElement = courseElement.querySelector('.topic-count');
            countElement.textContent = count;
        }
    }

    // render the course details
    // @param {object} course - course object
    renderCourseDetails(course) {
        document.getElementById('course-title').textContent = course.title;
        document.getElementById('course-description').textContent = course.description || 'no description';
    }

    // render the topics grid for a course
    // @param {array} topics - array of topic objects
    renderTopicsGrid(topics) {
        const topicsGrid = document.getElementById('topics-grid');
        topicsGrid.innerHTML = '';
        
        if (topics.length === 0) {
            topicsGrid.innerHTML = `
                <div class="empty-state">
                    <p>no topics yet. create your first topic!</p>
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
                <p class="topic-card-description">${topic.description || 'no description'}</p>
                <div class="topic-card-meta">
                    <span class="flashcard-count">0 flashcards</span>
                    <span class="topic-date">${formatDate(new Date(topic.createdAt))}</span>
                </div>
            `;
            
            topicsGrid.appendChild(topicElement);
        });
    }

    // update the flashcards count for a topic in the topics grid
    // @param {string} topicId - id of the topic
    // @param {number} count - number of flashcards
    updateTopicFlashcardsCount(topicId, count) {
        const topicElement = document.querySelector(`.topic-card[data-id="${topicId}"]`);
        if (topicElement) {
            const countElement = topicElement.querySelector('.flashcard-count');
            countElement.textContent = `${count} flashcard${count !== 1 ? 's' : ''}`;
        }
    }

    // render the topic details
    // @param {object} topic - topic object
    renderTopicDetails(topic) {
        document.getElementById('topic-title').textContent = topic.title;
        document.getElementById('topic-description').textContent = topic.description || 'no description';
    }

    // render the flashcards list for a topic
    // @param {array} flashcards - array of flashcard objects
    renderFlashcardsList(flashcards) {
        const flashcardsList = document.getElementById('flashcards-list');
        flashcardsList.innerHTML = '';
        
        if (flashcards.length === 0) {
            flashcardsList.innerHTML = `
                <div class="empty-state">
                    <p>no flashcards yet. create your first flashcard!</p>
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
                    <button class="edit-flashcard-btn icon-button" title="edit flashcard">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-flashcard-btn icon-button" title="delete flashcard">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            
            flashcardsList.appendChild(flashcardElement);
        });
    }

    // open a modal
    // @param {string} type - the type of modal to open ('course', 'topic', 'flashcard', or 'confirm')
    // @param {object} data - optional data to populate the modal with
    openModal(type, data = null) {
        console.log('Opening modal:', type, data ? 'with data' : 'without data');
        
        // Prevent opening if already opening a modal
        if (this._openingModal) {
            console.log('Modal already opening, ignoring request');
            return;
        }
        this._openingModal = true;
        
        // close any open modals first
        this.closeAllModals();
        
        let modal, titleElement, isEdit = false;
        
        switch (type) {
            case 'course':
                modal = this.courseModal;
                titleElement = document.getElementById('course-modal-title');
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
                if (data) {
                    isEdit = true;
                    const questionInput = document.getElementById('flashcard-question');
                    const answerInput = document.getElementById('flashcard-answer');
                    questionInput.value = data.question;
                    answerInput.value = data.answer;
                    // Store the flashcard ID for editing
                    questionInput.setAttribute('data-flashcard-id', data.id);
                    console.log('Editing flashcard with ID:', data.id);
                } else {
                    document.getElementById('flashcard-question').value = '';
                    document.getElementById('flashcard-answer').value = '';
                    // Clear any existing flashcard ID
                    document.getElementById('flashcard-question').removeAttribute('data-flashcard-id');
                }
                break;
            case 'confirm':
                modal = this.confirmModal;
                titleElement = document.getElementById('confirm-title');
                if (data) {
                    document.getElementById('confirm-title').textContent = data.title || 'confirm action';
                    document.getElementById('confirm-message').textContent = data.message || 'are you sure you want to proceed?';
                    const confirmButton = document.getElementById('confirm-action-btn');
                    confirmButton.textContent = data.confirmText || 'confirm';
                    confirmButton.onclick = data.onConfirm || (() => this.closeAllModals());
                }
                break;
        }

        if (titleElement) {
            titleElement.textContent = isEdit ? `edit ${type}` : `add new ${type}`;
        }

        if (modal) {
            modal.classList.add('show');
            setTimeout(() => { 
                modal.style.opacity = '1'; 
                this._openingModal = false; // Allow new modals after this one is fully open
            }, 10);
            const firstInput = modal.querySelector('input, textarea');
            if (firstInput) {
                setTimeout(() => { 
                    firstInput.focus();
                    // Prevent text selection from immediately closing modal
                    firstInput.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                    }, { once: true });
                }, 350);
            }
            console.log('Modal opened successfully:', type);
        } else {
            this._openingModal = false;
        }
    }

    // close all modals
    closeAllModals() {
        console.log('Closing all modals - called from:', new Error().stack.split('\n')[2]);
        const modals = [this.courseModal, this.topicModal, this.flashcardModal, this.confirmModal];
        modals.forEach(modal => {
            if (modal && modal.classList.contains('show')) {
                console.log('Closing modal:', modal.id);
                modal.style.opacity = '0';
                setTimeout(() => { modal.classList.remove('show'); }, 300);
            }
        });
    }

    // show a notification message
    // @param {string} message - the message to show
    // @param {string} type - the type of notification ('success', 'error', 'warning', or 'info')
    showNotification(message, type = 'info') {
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
        document.body.appendChild(notification);
        setTimeout(() => { notification.classList.add('show'); }, 10);
        notification.querySelector('.close-notification').addEventListener('click', () => {
            removeNotification(notification);
        });
        setTimeout(() => {
            removeNotification(notification);
        }, 5000);

        function removeNotification(notificationElement) {
            notificationElement.classList.remove('show');
            setTimeout(() => { notificationElement.remove(); }, 300);
        }

        function getIconForType(notificationType) {
            switch (notificationType) {
                case 'success': return 'fa-check-circle';
                case 'error': return 'fa-exclamation-circle';
                case 'warning': return 'fa-exclamation-triangle';
                default: return 'fa-info-circle';
            }
        }
    }
}

// format a date to a human-readable string
// @param {date} date - the date to format
// @returns {string} formatted date string
function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const day = 24 * 60 * 60 * 1000;

    if (diff < day) return 'today';
    if (diff < 2 * day) return 'yesterday';
    if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;
    return date.toLocaleDateString();
}

// add css for notifications
const styleElement = document.createElement('style');
styleElement.textContent = `/* unchanged css styles */`;
document.head.appendChild(styleElement);
