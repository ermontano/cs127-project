// uiManager class
// handles ui interactions and dom updates
class UIManager {
    constructor() {
        // references to main sections
        this.topicsOverview = document.getElementById('topics-overview');
        this.courseManagementView = document.getElementById('course-management-view');
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
        this.initializeActionMenuHandler();
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
        
        // Disabled backdrop click listeners to prevent accidental modal closure
        // Users can only close modals using the X button or Cancel/Save buttons
        /*
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
        */
        
        // Main Navigation
        const navDashboardBtn = document.getElementById('nav-dashboard-btn');
        const navTopicsBtn = document.getElementById('nav-topics-btn');
        const navManageCoursesBtn = document.getElementById('nav-manage-courses-btn');
        const navScheduleBtn = document.getElementById('nav-schedule-btn');

        if (navDashboardBtn) {
            navDashboardBtn.addEventListener('click', () => {
                this.showDashboard();
            });
        }
        if (navTopicsBtn) {
            navTopicsBtn.addEventListener('click', () => {
                this.showTopicsOverview();
            });
        }
        if (navManageCoursesBtn) {
            navManageCoursesBtn.addEventListener('click', () => {
                this.showCourseManagementView();
            });
        }
        if (navScheduleBtn) {
            navScheduleBtn.addEventListener('click', () => {
                this.showScheduleView();
            });
        }
        
        // View-specific navigation (breadcrumbs and context-sensitive back buttons)
        const backToOverviewBtn = document.getElementById('back-to-overview-btn'); // In Topic View, for standalone topics
        if (backToOverviewBtn) {
            backToOverviewBtn.addEventListener('click', () => this.showTopicsOverview());
        }

        const backToCourseFromTopicBtn = document.getElementById('back-to-course-from-topic-btn'); // In Topic View, for topics within a course
        if (backToCourseFromTopicBtn) {
            backToCourseFromTopicBtn.addEventListener('click', () => {
                if (window.topicsManager && window.topicsManager.currentTopic && window.topicsManager.currentTopic.courseId) {
                    this.showCourseView(window.topicsManager.currentTopic.courseId);
                } else {
                    this.showCourseManagementView(); 
                }
            });
        }

        const backToManageCoursesBtn = document.getElementById('back-to-manage-courses-btn'); // In Course View
        if (backToManageCoursesBtn) {
            backToManageCoursesBtn.addEventListener('click', () => this.showCourseManagementView());
        }
        
        // Dashboard screen buttons
        const dashboardCreateTopicBtn = document.getElementById('dashboard-create-topic');
        if (dashboardCreateTopicBtn) {
            dashboardCreateTopicBtn.addEventListener('click', () => {
                this.openModal('topic');
            });
        }

        const dashboardCreateCourseBtn = document.getElementById('dashboard-create-course');
        if (dashboardCreateCourseBtn) {
            dashboardCreateCourseBtn.addEventListener('click', () => {
                this.openModal('course');
            });
        }
        
        const dashboardViewScheduleBtn = document.getElementById('dashboard-view-schedule');
        if (dashboardViewScheduleBtn) {
            dashboardViewScheduleBtn.addEventListener('click', () => {
                this.showScheduleView();
            });
        }
        
        // Topics overview buttons
        const createTopicMainBtn = document.getElementById('create-topic-main-btn'); // In Topics Overview header
        if (createTopicMainBtn) {
            createTopicMainBtn.addEventListener('click', () => {
                 this.openModal('topic');
            });
        }
        
        // Course Management buttons
        const addCourseBtnInManagement = document.querySelector('#course-management-view #add-course-btn'); // In Course Management header
        if (addCourseBtnInManagement) {
            addCourseBtnInManagement.addEventListener('click', () => this.openModal('course'));
        }
        
        // Add topic to course button (in course-view)
        const addTopicToCourseBtn = document.getElementById('add-topic-to-course-btn');
        if (addTopicToCourseBtn) {
            addTopicToCourseBtn.addEventListener('click', () => {
                if (window.coursesManager && window.coursesManager.currentCourseId) {
                    this.openModal('topic', { courseId: window.coursesManager.currentCourseId });
                } else {
                    console.warn('Cannot add topic: current course ID not set.');
                    this.openModal('topic');
                }
            });
        }

        const exitStudyBtn = document.getElementById('exit-study-btn');
        if (exitStudyBtn) {
            exitStudyBtn.addEventListener('click', () => {
                // Exit study functionality is now handled by studyModeManager.exitStudy()
                // Remove this handler to prevent conflicts and undefined topic ID errors
                if (window.studyModeManager) {
                    window.studyModeManager.exitStudy();
                } else {
                    this.showTopicsOverview();
                }
            });
        }
    }

    /**
     * Initialize global click handler for action menus
     */
    initializeActionMenuHandler() {
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('.action-menu-trigger');
            const clickedInsideExistingMenu = e.target.closest('.action-menu-dropdown');

            // Close all open action menus if click is outside any action menu trigger AND outside any open dropdown
            if (!trigger && !clickedInsideExistingMenu) {
                document.querySelectorAll('.action-menu-dropdown.show').forEach(dropdown => {
                    dropdown.classList.remove('show');
                    const parentCard = dropdown.closest('.topic-card, .flashcard-item, .course-item-card');
                    if (parentCard) {
                        parentCard.classList.remove('has-open-menu');
                    }
                });
            }

            // Handle action menu trigger clicks
            if (trigger) {
                e.stopPropagation(); // Stop propagation to prevent immediate closing by the listener above
                const menu = trigger.closest('.action-menu');
                const dropdown = menu.querySelector('.action-menu-dropdown');
                const parentCard = menu.closest('.topic-card, .flashcard-item, .course-item-card');

                const wasOpen = dropdown.classList.contains('show');

                // Close all other open dropdowns and remove 'has-open-menu' from their parent cards
                document.querySelectorAll('.action-menu-dropdown.show').forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        otherDropdown.classList.remove('show');
                        const otherParentCard = otherDropdown.closest('.topic-card, .flashcard-item, .course-item-card');
                        if (otherParentCard) {
                            otherParentCard.classList.remove('has-open-menu');
                        }
                    }
                });

                // Toggle current dropdown
                if (!wasOpen) { // If it wasn't open, open it
                    dropdown.classList.add('show');
                    if (parentCard) {
                        parentCard.classList.add('has-open-menu');
                    }
                } else { // If it was open, close it (and remove class from parent)
                    dropdown.classList.remove('show');
                    if (parentCard) {
                        parentCard.classList.remove('has-open-menu');
                    }
                }
            }
        });
    }

    /**
     * Create an action menu (kebab menu) with the given actions
     * @param {Array} actions - Array of action objects with {label, icon, class, onClick}
     * @returns {string} HTML string for the action menu
     */
    createActionMenu(actions) {
        const actionItems = actions.map(action => 
            `<button class="action-menu-item ${action.class || ''}" data-action="${action.action}">
                <i class="fas ${action.icon}"></i>
                ${action.label}
            </button>`
        ).join('');
        
        return `
            <div class="action-menu">
                <button class="action-menu-trigger" title="More actions">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="action-menu-dropdown">
                    ${actionItems}
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners to action menu items
     * @param {HTMLElement} container - Container element with action menus
     * @param {Object} actionHandlers - Object mapping action names to handler functions
     */
    attachActionMenuListeners(container, actionHandlers) {
        container.querySelectorAll('.action-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.target.closest('.action-menu-item').dataset.action;
                const handler = actionHandlers[action];
                if (handler) {
                    handler(e);
                }
                // Close the dropdown and remove parent card class
                const dropdownElement = e.target.closest('.action-menu-dropdown');
                if (dropdownElement) {
                    dropdownElement.classList.remove('show');
                    const parentCard = dropdownElement.closest('.topic-card, .flashcard-item, .course-item-card');
                    if (parentCard) {
                        parentCard.classList.remove('has-open-menu');
                    }
                }
            });
        });
    }

    // show a specific section and hide others
    // @param {string} section - the section to show ('dashboard', 'topics-overview', 'course-management', 'course', 'topic', or 'study')
    showSection(sectionName, data = null) {
        // hide all sections
        const dashboardView = document.getElementById('dashboard-view');
        if (dashboardView) dashboardView.classList.add('hidden');
        this.topicsOverview.classList.add('hidden');
        this.courseManagementView.classList.add('hidden');
        this.courseView.classList.add('hidden');
        this.topicView.classList.add('hidden');
        this.studyMode.classList.add('hidden');
        
        // Hide schedule view
        const scheduleView = document.getElementById('schedule-view');
        if (scheduleView) scheduleView.classList.add('hidden');
        
        // Manage main content overflow for course management view
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.remove('course-management-active');
        }
        
        const navDashboardBtn = document.getElementById('nav-dashboard-btn');
        const navTopicsBtn = document.getElementById('nav-topics-btn');
        const navManageCoursesBtn = document.getElementById('nav-manage-courses-btn');
        const navScheduleBtn = document.getElementById('nav-schedule-btn');

        // Reset active state for nav links
        if (navDashboardBtn) navDashboardBtn.classList.remove('active');
        if (navTopicsBtn) navTopicsBtn.classList.remove('active');
        if (navManageCoursesBtn) navManageCoursesBtn.classList.remove('active');
        if (navScheduleBtn) navScheduleBtn.classList.remove('active');
        
        // show the requested section and update nav active state
        switch (sectionName) {
            case 'dashboard':
                const dashboardViewElement = document.getElementById('dashboard-view');
                if (dashboardViewElement) dashboardViewElement.classList.remove('hidden');
                if (navDashboardBtn) navDashboardBtn.classList.add('active');
                break;
            case 'topics-overview':
            case 'overview':
                this.topicsOverview.classList.remove('hidden');
                if (window.topicsManager && typeof window.topicsManager.loadAllTopics === 'function') {
                    window.topicsManager.loadAllTopics().catch(error => {
                        console.error('Error loading topics:', error);
                    });
                }
                if (navTopicsBtn) navTopicsBtn.classList.add('active');
                break;
            case 'course-management':
                this.courseManagementView.classList.remove('hidden');
                if (mainContent) mainContent.classList.add('course-management-active');
                if (window.coursesManager) window.coursesManager.loadAllCoursesForManagement();
                if (navManageCoursesBtn) navManageCoursesBtn.classList.add('active');
                break;
            case 'course': // Navigating into a specific course
                this.courseView.classList.remove('hidden');
                // Keep 'Manage Courses' active as the parent section
                if (navManageCoursesBtn) navManageCoursesBtn.classList.add('active'); 
                break;
            case 'topic': // Navigating into a specific topic
                this.topicView.classList.remove('hidden');
                // Determine if topic is standalone or part of course for nav
                if (data && data.courseId) {
                    if (navManageCoursesBtn) navManageCoursesBtn.classList.add('active');
                } else {
                    if (navTopicsBtn) navTopicsBtn.classList.add('active');
                }
                break;
            case 'study':
                this.studyMode.classList.remove('hidden');
                // No specific nav change, keep context of where study mode was entered from
                // (e.g., if entered from topic in a course, keep course nav active)
                // This might need more sophisticated context tracking if direct nav to study mode is possible.
                break;
            case 'schedule':
                const scheduleView = document.getElementById('schedule-view');
                if (scheduleView) scheduleView.classList.remove('hidden');
                if (navScheduleBtn) navScheduleBtn.classList.add('active');
                break;
            default:
                const defaultDashboardView = document.getElementById('dashboard-view');
                if (defaultDashboardView) defaultDashboardView.classList.remove('hidden');
                if (navDashboardBtn) navDashboardBtn.classList.add('active');
                break;
        }
    }

    // --- View-specific show methods ---
    showDashboard() {
        this.showSection('dashboard');
        this.updateDashboard();
    }
    
    async updateDashboard() {
        try {
            // Get user stats
            const topics = await window.storageManager.getAllTopics();
            const courses = await window.storageManager.getCourses();
            
            // Calculate total flashcards
            let totalFlashcards = 0;
            if (window.topicsManager) {
                for (const topic of topics) {
                    const count = await window.topicsManager.getFlashcardCountForTopic(topic.id);
                    totalFlashcards += count || 0;
                }
            }
            
            // Determine if user is new or returning
            const isNewUser = topics.length === 0 && courses.length === 0;
            
            // Update welcome message
            const titleElement = document.getElementById('dashboard-title');
            const subtitleElement = document.getElementById('dashboard-subtitle');
            
            if (titleElement && subtitleElement) {
                const user = window.authManager ? window.authManager.getUser() : null;
                const userName = user ? user.username : '';
                
                if (isNewUser) {
                    titleElement.textContent = userName ? `Welcome, ${userName}!` : 'Welcome to MemoFlash!';
                    subtitleElement.textContent = 'Ready to start your learning journey? Create your first topic or course below.';
                } else {
                    titleElement.textContent = userName ? `Welcome back, ${userName}!` : 'Welcome back!';
                    subtitleElement.textContent = 'Ready to continue your learning adventure?';
                }
            }
            
            // Update stats
            const statsContainer = document.getElementById('dashboard-stats');
            if (statsContainer) {
                if (isNewUser) {
                    statsContainer.innerHTML = '';
                } else {
                    statsContainer.innerHTML = `
                        <div class="dashboard-stat-card">
                            <div class="dashboard-stat-number">${topics.length}</div>
                            <div class="dashboard-stat-label">Topics</div>
                        </div>
                        <div class="dashboard-stat-card">
                            <div class="dashboard-stat-number">${courses.length}</div>
                            <div class="dashboard-stat-label">Courses</div>
                        </div>
                        <div class="dashboard-stat-card">
                            <div class="dashboard-stat-number">${totalFlashcards}</div>
                            <div class="dashboard-stat-label">Flashcards</div>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    showTopicsOverview() {
        this.showSection('topics-overview');
        const backToOverviewBtn = document.getElementById('back-to-overview-btn');
        const backToCourseFromTopicBtn = document.getElementById('back-to-course-from-topic-btn');
        if (backToOverviewBtn) backToOverviewBtn.classList.remove('hidden');
        if (backToCourseFromTopicBtn) backToCourseFromTopicBtn.classList.add('hidden');
    }

    showCourseManagementView() {
        this.showSection('course-management');
    }

    showScheduleView() {
        this.showSection('schedule');
        // Load schedule data when the view is shown
        if (window.scheduleManager) {
            window.scheduleManager.loadScheduleView();
        }
    }

    showCourseView(courseId) {
        this.showSection('course', { courseId });
         if (window.coursesManager) {
            window.coursesManager.loadCourseDetailsAndTopics(courseId);
        }
    }

    showTopicView(topicId, courseId = null) {
        this.showSection('topic', { topicId, courseId });
        const backToOverviewBtn = document.getElementById('back-to-overview-btn');
        const backToCourseFromTopicBtn = document.getElementById('back-to-course-from-topic-btn');

        if (courseId) {
            if (backToOverviewBtn) backToOverviewBtn.classList.add('hidden');
            if (backToCourseFromTopicBtn) backToCourseFromTopicBtn.classList.remove('hidden');
        } else {
            if (backToOverviewBtn) backToOverviewBtn.classList.remove('hidden');
            if (backToCourseFromTopicBtn) backToCourseFromTopicBtn.classList.add('hidden');
        }
        if (window.topicsManager) {
            window.topicsManager.loadTopicDetailsAndFlashcards(topicId, courseId);
        }
    }

    showStudyMode(topicId) {
        this.showSection('study', { topicId });
        if (window.studyModeManager) {
            window.studyModeManager.startStudy(topicId);
        }
    }

    getCurrentView() {
        const dashboardView = document.getElementById('dashboard-view');
        if (dashboardView && !dashboardView.classList.contains('hidden')) return 'dashboard';
        if (!this.topicsOverview.classList.contains('hidden')) return 'topics-overview';
        if (!this.courseManagementView.classList.contains('hidden')) return 'course-management';
        if (!this.courseView.classList.contains('hidden')) return 'course';
        if (!this.topicView.classList.contains('hidden')) return 'topic';
        if (!this.studyMode.classList.contains('hidden')) return 'study';
        const scheduleView = document.getElementById('schedule-view');
        if (scheduleView && !scheduleView.classList.contains('hidden')) return 'schedule';
        return null; // Or a default view name
    }

    // render the courses list (for sidebar, now adapted for Course Management page)
    // @param {array} courses - array of course objects
    renderCoursesForManagement(courses) {
        const coursesListContainer = document.getElementById('courses-list');
        coursesListContainer.innerHTML = '';
        
        if (!courses || courses.length === 0) {
            coursesListContainer.innerHTML = `
                <div class="empty-state">
                    <p>No courses created yet. Click "Create New Course" to start.</p>
                </div>
            `;
            return;
        }
        
        courses.forEach(course => {
            const courseElement = document.createElement('div');
            courseElement.className = 'course-item-card';
            courseElement.dataset.id = course.id;
            
            const courseActions = [
                { action: 'edit', label: 'Edit', icon: 'fa-edit', class: '' },
                { action: 'delete', label: 'Delete', icon: 'fa-trash-alt', class: 'danger' }
            ];
            
            courseElement.innerHTML = `
                <div class="course-item-info">
                    <h4 class="course-item-title">${course.title}</h4>
                    <p class="course-item-desc">${course.description || 'No description'}</p>
                    <span class="course-item-topic-count">${course.topicCount || 0} topics</span> 
                </div>
                <div class="course-item-actions">
                    <div class="course-item-primary-actions">
                        <button class="view-course-btn primary-button" title="View Course">
                            View Topics
                        </button>
                    </div>
                    ${this.createActionMenu(courseActions)}
                </div>
            `;
            
            coursesListContainer.appendChild(courseElement);

            // Attach action menu listeners
            this.attachActionMenuListeners(courseElement, {
                edit: (e) => {
                    this.openModal('course', course);
                },
                delete: (e) => {
                    this.showConfirmModal('Delete Course', `Are you sure you want to delete "${course.title}" and all its topics and flashcards?"`, () => {
                        if(window.coursesManager) window.coursesManager.deleteCourse(course.id);
                    });
                }
            });

            // Attach primary action listener
            courseElement.querySelector('.view-course-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.showCourseView(course.id);
            });
        });
    }

    renderCourseDetails(course) {
        document.getElementById('course-title').textContent = course.title;
        document.getElementById('course-description').textContent = course.description || 'No description provided.';
    }

    // render the topics grid (generalized for main overview and within a course)
    // @param {array} topics - array of topic objects
    // @param {string} gridId - ID of the grid element to render into
    // @param {string} context - 'overview' or 'course'
    renderTopicsGrid(topics, gridId = 'topics-grid', context = 'overview') {
        const topicsGridElement = document.getElementById(gridId);
        if (!topicsGridElement) {
            console.error(`Topics grid element with ID '${gridId}' not found.`);
            return;
        }
        topicsGridElement.innerHTML = '';
        
        if (!topics || topics.length === 0) {
            let message = "No topics yet. Click 'Add Topic' to create your first one!";
            if (context === 'course') {
                message = "This course has no topics yet. Click 'Add Topic to Course' to create one.";
            }
            topicsGridElement.innerHTML = `
                <div class="empty-state">
                    <p>${message}</p>
                </div>
            `;
            return;
        }
        
        topics.forEach(topic => {
            const topicElement = document.createElement('div');
            topicElement.className = 'topic-card';
            topicElement.dataset.id = topic.id;
            if (topic.courseId) {
                topicElement.dataset.courseId = topic.courseId;
            }
            
            const topicActions = [
                { action: 'edit', label: 'Edit', icon: 'fa-edit', class: '' },
                { action: 'delete', label: 'Delete', icon: 'fa-trash-alt', class: 'danger' }
            ];
            
            topicElement.innerHTML = `
                <div class="topic-card-header">
                <h4 class="topic-card-title">${topic.title}</h4>
                    ${topic.courseTitle ? `<span class="topic-card-course-chip">${topic.courseTitle}</span>` : ''}
                </div>
                <p class="topic-card-description">${topic.description || 'No description'}</p>
                <div class="topic-card-meta">
                    <span class="flashcard-count">Loading...</span>
                    <span class="topic-date">${formatDate(new Date(topic.created_at || topic.createdAt))}</span>
                </div>
                <div class="topic-card-actions">
                    <div class="topic-card-primary-actions">
                        <button class="study-topic-btn primary-button" title="Study Topic"><i class="fas fa-play"></i> Study</button>
                    </div>
                    ${this.createActionMenu(topicActions)}
                </div>
            `;
            
            topicsGridElement.appendChild(topicElement);

            // Make card clickable (except for buttons)
            topicElement.addEventListener('click', (e) => {
                 if (e.target.closest('button') || e.target.closest('.action-menu')) return;
                 this.showTopicView(topic.id, topic.courseId);
            });

            // Attach action menu listeners
            this.attachActionMenuListeners(topicElement, {
                edit: (e) => {
                    this.openModal('topic', topic);
                },
                delete: (e) => {
                    this.showConfirmModal('Delete Topic', `Are you sure you want to delete "${topic.title}" and all its flashcards?"`, () => {
                         if(window.topicsManager) window.topicsManager.deleteTopic(topic.id, topic.courseId);
                    });
                }
            });

            // Attach primary action listener
            topicElement.querySelector('.study-topic-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.showStudyMode(topic.id);
            });

            if (window.topicsManager) {
                window.topicsManager.getFlashcardCountForTopic(topic.id)
                    .then(count => this.updateTopicFlashcardsCount(topic.id, count, gridId))
                    .catch(err => {
                        console.error(`Failed to get flashcard count for topic ${topic.id}:`, err);
                        this.updateTopicFlashcardsCount(topic.id, 'N/A', gridId);
                    });
            } else {
                 this.updateTopicFlashcardsCount(topic.id, 'N/A', gridId);
            }
        });
    }

    // update the flashcards count for a topic
    // @param {string} topicId - id of the topic
    // @param {number | string} count - number of flashcards or 'N/A'
    // @param {string} gridId - the ID of the parent grid to find the topic card
    updateTopicFlashcardsCount(topicId, count, gridId = 'topics-grid') {
        const topicElement = document.querySelector(`#${gridId} .topic-card[data-id="${topicId}"]`);
        if (topicElement) {
            const countElement = topicElement.querySelector('.flashcard-count');
            if (countElement) {
                countElement.textContent = `${count} flashcard${(typeof count === 'number' && count !== 1) ? 's' : ''}`;
            }
        }
    }

    // render the topic details
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
            
            const flashcardActions = [
                { action: 'edit', label: 'Edit', icon: 'fa-edit', class: '' },
                { action: 'delete', label: 'Delete', icon: 'fa-trash-alt', class: 'danger' }
            ];
            
            flashcardElement.innerHTML = `
                <div class="flashcard-item-content">
                    <div class="flashcard-question">${this.escapeHTML(flashcard.question)}</div>
                    <div class="flashcard-answer">${this.escapeHTML(flashcard.answer)}</div>
                </div>
                <div class="flashcard-actions">
                    ${this.createActionMenu(flashcardActions)}
                </div>
            `;
            
            flashcardsList.appendChild(flashcardElement);

            // Attach action menu listeners
            this.attachActionMenuListeners(flashcardElement, {
                edit: (e) => {
                    this.openModal('flashcard', flashcard);
                },
                delete: (e) => {
                    this.showConfirmModal('Delete Flashcard', `Are you sure you want to delete this flashcard?`, () => {
                        if(window.flashcardsManager) window.flashcardsManager.deleteFlashcard(flashcard.id);
                    });
                }
            });
        });
    }

    // Show modal
    // @param {string} type - 'course', 'topic', or 'flashcard'
    // @param {object} data - existing data for editing (optional)
    openModal(type, data = null) {
        this.closeAllModals();
        
        let modalElement;
        let formElement;
        let modalTitle;
        
        switch (type) {
            case 'course':
                modalElement = this.courseModal;
                formElement = document.getElementById('course-form');
                modalTitle = document.getElementById('course-modal-title');
                this.hideFormError('course-form'); // Clear any existing error messages
                
                // Get entire color picker section
                const colorPickerSection = document.querySelector('.course-color-picker');
                
                // Always hide entire color picker section initially - it will be shown when Add Schedule is clicked
                if (colorPickerSection) {
                    colorPickerSection.style.display = 'none';
                }
                
                if (data) {
                    modalTitle.textContent = 'Edit Course';
                    formElement.elements['course-name'].value = data.title || '';
                    formElement.elements['course-desc'].value = data.description || '';
                    formElement.dataset.editingId = data.id;
                    
                    // Load existing schedules for this course
                    if (window.scheduleManager) {
                        window.scheduleManager.clearScheduleForm();
                        window.scheduleManager.loadCourseSchedules(data.id);
                        
                        // If course has schedules, show color picker section
                        if (data.hasSchedules && colorPickerSection) {
                            colorPickerSection.style.display = 'block';
                            
                            // Set existing color if available
                            if (data.color) {
                                setTimeout(() => {
                                    window.scheduleManager.setColorPickerSelection(data.color);
                                }, 150);
                            }
                        }
                    }
                } else {
                    modalTitle.textContent = 'Add New Course';
                    formElement.reset();
                    delete formElement.dataset.editingId;
                    
                    // Clear schedule form for new course and reset color picker
                    if (window.scheduleManager) {
                        window.scheduleManager.clearScheduleForm();
                        // Reset color picker to default for new course
                        window.scheduleManager.setColorPickerSelection('#3b82f6');
                    }
                }
                break;
            case 'topic':
                modalElement = this.topicModal;
                formElement = document.getElementById('topic-form');
                modalTitle = document.getElementById('topic-modal-title');
                this.hideFormError('topic-form'); // Clear any existing error messages
                const courseContextId = data && data.courseId ? data.courseId : (window.coursesManager ? window.coursesManager.currentCourseId : null);

                if (data && data.id) {
                    modalTitle.textContent = 'Edit Topic';
                    formElement.elements['topic-name'].value = data.title || '';
                    formElement.elements['topic-desc'].value = data.description || '';
                    formElement.dataset.editingId = data.id;
                    formElement.dataset.courseId = data.courseId || (courseContextId || '');
                } else {
                    modalTitle.textContent = 'Add New Topic';
                    formElement.reset();
                    delete formElement.dataset.editingId;
                    formElement.dataset.courseId = courseContextId || ''; 
                }
                break;
            case 'flashcard':
                modalElement = this.flashcardModal;
                formElement = document.getElementById('flashcard-form');
                modalTitle = document.getElementById('flashcard-modal-title');
                this.hideFormError('flashcard-form'); // Clear any existing error messages
                if (data) {
                    modalTitle.textContent = 'Edit Flashcard';
                    const questionInput = document.getElementById('flashcard-question');
                    const answerInput = document.getElementById('flashcard-answer');
                    questionInput.value = data.question;
                    answerInput.value = data.answer;
                    formElement.dataset.editingId = data.id;
                } else {
                    modalTitle.textContent = 'Add New Flashcard';
                    document.getElementById('flashcard-question').value = '';
                    document.getElementById('flashcard-answer').value = '';
                    delete formElement.dataset.editingId;
                }
                break;
        }

        if (modalElement) {
            modalElement.classList.add('show');
            setTimeout(() => { 
                modalElement.style.opacity = '1'; 
            }, 10);
            const firstInput = modalElement.querySelector('input, textarea');
            if (firstInput) {
                setTimeout(() => { 
                    firstInput.focus();
                    firstInput.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                    }, { once: true });
                }, 350);
            }
        }
    }

    // Show confirmation modal
    showConfirmModal(title, message, onConfirm, onCancel = null) {
        this.closeAllModals();
        
        const titleElement = document.getElementById('confirm-title');
        const messageElement = document.getElementById('confirm-message');
        const confirmBtn = document.getElementById('confirm-action-btn');
        const cancelBtn = document.getElementById('cancel-confirm-btn');
        
        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.textContent = message;
        
        // Remove existing listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        // Add new listeners
        newConfirmBtn.addEventListener('click', () => {
            this.closeAllModals();
            if (onConfirm) onConfirm();
        });
        
        newCancelBtn.addEventListener('click', () => {
            this.closeAllModals();
            if (onCancel) onCancel();
        });
        
        // Show the modal
        if (this.confirmModal) {
            this.confirmModal.classList.add('show');
            setTimeout(() => { 
                this.confirmModal.style.opacity = '1'; 
            }, 10);
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

    // Legacy notification method - redirects to new methods
    // @param {string} message - the message to show
    // @param {string} type - the type of notification ('success', 'error', 'warning', or 'info')
    showNotification(message, type = 'info') {
        console.warn('showNotification is deprecated. Use showToast, showPageAlert, or showSuccessOverlay instead.');
        
        // Redirect to appropriate new method based on type and content
        if (type === 'success' && (message.includes('completed') || message.includes('finished'))) {
            // For completion/success messages, use overlay
            this.showSuccessOverlay('Success!', message);
        } else if (type === 'error') {
            // For errors, use page alert
            this.showPageAlert(message, 'error');
        } else {
            // For other messages, use toast
            this.showToast(message, type);
        }
    }

    // Show inline form error message
    // @param {string} formId - the ID of the form ('course-form' or 'topic-form')
    // @param {string} message - the error message to display
    showFormError(formId, message) {
        const errorElement = document.getElementById(`${formId}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    // Hide inline form error message
    // @param {string} formId - the ID of the form ('course-form' or 'topic-form')
    hideFormError(formId) {
        const errorElement = document.getElementById(`${formId}-error`);
        if (errorElement) {
            errorElement.classList.add('hidden');
            errorElement.textContent = '';
        }
    }

    // Show success overlay for major accomplishments
    // @param {string} title - the title of the success message
    // @param {string} message - the detailed message
    // @param {function} onClose - callback when overlay is closed
    showSuccessOverlay(title, message, onClose = null) {
        // Remove any existing overlay
        this.hideSuccessOverlay();
        
        const overlay = document.createElement('div');
        overlay.id = 'success-overlay';
        overlay.className = 'success-overlay';
        overlay.innerHTML = `
            <div class="success-overlay-content">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>${title}</h2>
                <p>${message}</p>
                <button class="primary-button" id="success-overlay-close">Continue</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add event listener for close button
        const closeBtn = overlay.querySelector('#success-overlay-close');
        closeBtn.addEventListener('click', () => {
            this.hideSuccessOverlay();
            if (onClose) onClose();
        });
        
        // Add click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideSuccessOverlay();
                if (onClose) onClose();
            }
        });
        
        // Show with animation
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    // Hide success overlay
    hideSuccessOverlay() {
        const overlay = document.getElementById('success-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }
    }

    // Show page-level alert
    // @param {string} message - the alert message
    // @param {string} type - 'info', 'warning', 'error', 'success'
    // @param {boolean} persistent - if true, alert stays until manually closed
    showPageAlert(message, type = 'info', persistent = false) {
        // Remove any existing page alert
        this.hidePageAlert();
        
        const alert = document.createElement('div');
        alert.id = 'page-alert';
        alert.className = `page-alert ${type}`;
        alert.innerHTML = `
            <div class="page-alert-content">
                <i class="fas ${this.getAlertIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="page-alert-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Insert at the beginning of main content or after header
        const mainContent = document.querySelector('.main-content') || document.querySelector('.app-container');
        if (mainContent) {
            mainContent.insertBefore(alert, mainContent.firstChild);
        } else {
            document.body.appendChild(alert);
        }
        
        // Add close event listener
        const closeBtn = alert.querySelector('.page-alert-close');
        closeBtn.addEventListener('click', () => this.hidePageAlert());
        
        // Auto hide if not persistent
        if (!persistent) {
            setTimeout(() => this.hidePageAlert(), 5000);
        }
        
        // Show with animation
        setTimeout(() => alert.classList.add('show'), 10);
    }

    // Hide page alert
    hidePageAlert() {
        const alert = document.getElementById('page-alert');
        if (alert) {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 300);
        }
    }

    // Show minimal toast for quick feedback
    // @param {string} message - the message to show
    // @param {string} type - 'success', 'error', 'warning', 'info'
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${this.getAlertIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        toastContainer.appendChild(toast);
        
        // Show with animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto hide
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Helper method to get icon for alert type
    getAlertIcon(type) {
        switch (type) {
                case 'success': return 'fa-check-circle';
                case 'error': return 'fa-exclamation-circle';
                case 'warning': return 'fa-exclamation-triangle';
                default: return 'fa-info-circle';
        }
    }

    // Utility to escape HTML to prevent XSS when rendering user content
    escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/[&<>"']/g, function (match) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[match];
        });
    }

    // Render courses list (for course management or course selection)
    renderCoursesList(courses, selectedCourseId = null) {
        const container = document.getElementById('courses-list');
        if (!container) {
            console.warn('Courses list container not found');
            return;
        }

        container.innerHTML = '';

        if (!courses || courses.length === 0) {
            container.innerHTML = '<p class="empty-state">No courses found. Create your first course!</p>';
            return;
        }

        courses.forEach(course => {
            const courseElement = document.createElement('div');
            courseElement.className = `course-item ${selectedCourseId === course.id ? 'selected' : ''}`;
            courseElement.innerHTML = `
                <div class="course-header">
                    <h3>${this.escapeHTML(course.title)}</h3>
                    <div class="course-actions">
                        <button class="edit-course-btn icon-button" title="Edit course" data-course-id="${course.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-course-btn icon-button" title="Delete course" data-course-id="${course.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                <p class="course-description">${this.escapeHTML(course.description || 'No description')}</p>
                <div class="course-stats">
                    <span class="topic-count">${course.topicCount || 0} topics</span>
                    <span class="created-date">Created ${formatDate(new Date(course.created_at))}</span>
                </div>
            `;

            // Add click handler to view course details
            courseElement.addEventListener('click', (e) => {
                if (!e.target.closest('.course-actions')) {
                    if (window.coursesManager) {
                        window.coursesManager.selectCourse(course.id);
                    }
                }
            });

            container.appendChild(courseElement);
        });
    }

    // Update course topics count in the UI
    updateCourseTopicsCount(courseId, count) {
        const courseElement = document.querySelector(`[data-course-id="${courseId}"]`);
        if (courseElement) {
            const topicCountElement = courseElement.querySelector('.topic-count');
            if (topicCountElement) {
                topicCountElement.textContent = `${count} topics`;
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

// Note: Notification styles are now in the main CSS file

// Initialize UI manager when DOM is loaded
// This is now primarily handled by AuthManager after successful authentication.
// Keeping a simplified version or removing if AuthManager fully controls UIManager instantiation.
document.addEventListener('DOMContentLoaded', () => {
    // UIManager is now initialized by AuthManager or the main script in index.html
    // after authentication is confirmed. This listener might be redundant or 
    // could serve as a fallback if UIManager is needed for non-authed states (not current use case for index.html)
    // For now, let's ensure it doesn't conflict.
    // if (!window.uiManager && !window.authCheckInProgress && !window.authManager) {
        // If no auth process is happening and authManager isn't there, 
        // it implies a state where UIManager might not be needed or is managed elsewhere.
        // console.log("UIManager DOMContentLoaded: No active auth process, UIManager not initialized by this listener.");
    // }
});
