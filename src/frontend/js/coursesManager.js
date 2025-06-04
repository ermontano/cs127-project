/**
 * manages all operations related to courses
 */
class CoursesManager {
    /**
     * @param {StorageManager} storage
     * @param {UIManager} ui
     */
    constructor(storage, ui) {
        this.storage = storage;
        this.ui = ui;
        this.currentCourseId = null;
        this.topicsManager = null;
        this.authManager = null;

        this.initEventListeners();
    }

    /**
     * set the topics manager reference
     * @param {TopicsManager} topicsManager
     */
    setTopicsManager(topicsManager) {
        this.topicsManager = topicsManager;
    }

    setAuthManager(authManager) {
        this.authManager = authManager;
    }

    initEventListeners() {
        // course form submission
        const courseForm = document.getElementById('course-form');
        if (courseForm) {
            courseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveCourse();
            });
        }
        
        // course list click event delegation
        const coursesList = document.getElementById('courses-list');
        if (coursesList) {
            coursesList.addEventListener('click', (e) => {
                const courseItem = e.target.closest('.course-item');
                if (courseItem) {
                    const courseId = courseItem.dataset.id;
                    this.selectCourse(courseId);
                }
            });
        }
        
        // Edit Course button on the Course View page
        const editCourseBtnOnView = document.querySelector('#course-view #edit-course-action');
        if (editCourseBtnOnView) {
            editCourseBtnOnView.addEventListener('click', async () => {
                if (this.currentCourseId) {
                    const course = await this.getCourseById(this.currentCourseId);
                    if (course) {
                        this.ui.openModal('course', course);
                    }
                }
            });
        }
        
        // Delete Course button on the Course View page
        const deleteCourseBtnOnView = document.querySelector('#course-view #delete-course-action');
        if (deleteCourseBtnOnView) {
            deleteCourseBtnOnView.addEventListener('click', async () => {
                if (this.currentCourseId) {
                    const course = await this.getCourseById(this.currentCourseId);
                    const courseTitle = course ? course.title : 'this course';
                    this.ui.showConfirmModal(
                        'Delete Course',
                        `Are you sure you want to delete "${courseTitle}" and all its topics and flashcards? This action cannot be undone.`,
                        () => this.deleteCourse(this.currentCourseId)
                    );
                }
            });
        }
    }

    /**
     * load all courses and render them
     */
    async loadCourses() {
        try {
            const courses = await this.storage.getCourses();
            
            // render courses in the sidebar
            this.ui.renderCoursesList(courses, this.currentCourseId);
            
            // update topic counts for each course
            for (const course of courses) {
                const topicsCount = await this.getTopicsCountForCourse(course.id);
                this.ui.updateCourseTopicsCount(course.id, topicsCount);
            }
            
            // show welcome screen if no courses
            if (courses.length === 0) {
                this.ui.showSection('welcome');
            } else if (this.currentCourseId) {
                // if we have a selected course, show it
                await this.selectCourse(this.currentCourseId);
            } else if (courses.length > 0) {
                // otherwise select the first course
                await this.selectCourse(courses[0].id);
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            this.ui.showNotification('Failed to load courses', 'error');
            this.ui.showSection('welcome');
        }
    }

    /**
     * get a course by ID
     * @param {string} courseId - ID of the course
     * @returns {Object|null} the course object or null if not found
     */
    async getCourseById(courseId) {
        try {
            return await this.storage.getCourseById(courseId);
        } catch (error) {
            console.error('Error getting course by ID:', error);
            this.ui.showNotification('Failed to fetch course details', 'error');
            return null;
        }
    }

    /**
     * get the number of topics for a course
     * @param {string} courseId - ID of the course
     * @returns {number} the number of topics
     */
    async getTopicsCountForCourse(courseId) {
        try {
            const topics = await this.storage.getTopicsByCourse(courseId);
            return topics.length;
        } catch (error) {
            console.error('Error getting topics count:', error);
            return 0;
        }
    }

    /**
     * select a course and show its details
     * @param {string} courseId - ID of the course
     */
    async selectCourse(courseId) {
        try {
            // update current course
            this.currentCourseId = courseId;
            
            // get the course
            const course = await this.getCourseById(courseId);
            if (!course) return;
            
            // update UI to show the selected course
            const courses = await this.storage.getCourses();
            this.ui.renderCoursesList(courses, courseId);
            this.ui.renderCourseDetails(course);
            
            // load and render topics for this course
            const topics = await this.storage.getTopicsByCourse(courseId);
            this.ui.renderTopicsGrid(topics);
            
            // update flashcard counts for each topic
            for (const topic of topics) {
                try {
                    const flashcards = await this.storage.getFlashcardsByTopic(topic.id);
                    this.ui.updateTopicFlashcardsCount(topic.id, flashcards.length);
                } catch (error) {
                    console.error('Error getting flashcards count for topic:', topic.id, error);
                }
            }
            
            // show the course view
            this.ui.showSection('course');

            // Notify the topics manager when a course is selected
            if (this.topicsManager) {
                this.topicsManager.setCurrentCourseId(courseId);
            }
        } catch (error) {
            console.error('Error selecting course:', error);
            this.ui.showNotification('Failed to load course', 'error');
        }
    }

    /**
     * save a course (new or edit)
     */
    async handleSaveCourse() {
        const formElement = document.getElementById('course-form');
        const title = formElement.elements['course-name'].value.trim();
        const description = formElement.elements['course-desc'].value.trim();
        const editingId = formElement.dataset.editingId;

        if (!title) {
            this.ui.showNotification('Course title is required', 'error');
            return;
        }
        
        const courseData = { title, description };
        if (editingId) {
            courseData.id = editingId;
        }
        
        try {
            const savedCourse = await this.storage.saveCourse(courseData);
            this.ui.closeAllModals();
            this.ui.showNotification(editingId ? 'Course updated successfully' : 'Course created successfully', 'success');

            if (this.authManager) {
                await this.authManager.refreshStats();
            }

            // Refresh the course management view and navigate there, or to the edited/created course view
            await this.loadAllCoursesForManagement();
            
            if (editingId) {
                this.ui.showCourseView(savedCourse.id);
            } else {
                this.ui.showCourseManagementView();
            }
        } catch (error) {
            console.error('Error saving course:', error);
            this.ui.showNotification('Failed to save course. ' + (error.message || ''), 'error');
        }
    }

    /**
     * delete a course
     * @param {string} courseId - ID of the course to delete
     */
    async deleteCourse(courseId) {
        if (!courseId) return;
        
        try {
            await this.storage.deleteCourse(courseId);
            this.ui.showNotification('Course deleted successfully', 'success');
            this.currentCourseId = null;

            if (this.authManager) {
                await this.authManager.refreshStats();
            }

            // Refresh the course management list and show that view
            await this.loadAllCoursesForManagement();
            this.ui.showCourseManagementView();
        } catch (error) {
            console.error('Error deleting course:', error);
            this.ui.showNotification('Failed to delete course. ' + (error.message || ''), 'error');
        }
    }

    /**
     * search courses by term
     * @param {string} term - the search term
     * @returns {Array} matching course objects
     */
    async searchCourses(term) {
        if (!term) return [];
        
        try {
            term = term.toLowerCase();
            const courses = await this.storage.getCourses();
            
            return courses.filter(course => {
                return (
                    course.title.toLowerCase().includes(term) ||
                    (course.description && course.description.toLowerCase().includes(term))
                );
            });
        } catch (error) {
            console.error('Error searching courses:', error);
            return [];
        }
    }

    async loadAllCoursesForManagement() {
        try {
            const courses = await this.storage.getCourses();
            this.ui.renderCoursesForManagement(courses);
        } catch (error) {
            console.error('Error loading courses for management:', error);
            this.ui.showNotification('Failed to load courses', 'error');
            this.ui.renderCoursesForManagement([]);
        }
    }

    async loadCourseDetailsAndTopics(courseId) {
        this.currentCourseId = null;
        try {
            const course = await this.getCourseById(courseId);
            if (!course) {
                this.ui.showNotification('Course not found.', 'error');
                this.ui.showCourseManagementView();
                return;
            }

            this.currentCourseId = course.id;
            this.ui.renderCourseDetails(course);

            if (this.topicsManager) {
                await this.topicsManager.loadTopicsForCourse(course.id);
            } else {
                this.ui.renderTopicsGrid([], 'course-topics-grid', 'course');
            }
        } catch (error) {
            console.error('Error loading course details and topics:', error);
            this.ui.showNotification('Failed to load course information', 'error');
        }
    }
}

// Initialize CoursesManager and inject dependencies
document.addEventListener('DOMContentLoaded', () => {
    const checkReadyInterval = setInterval(() => {
        if (window.storageManager && window.uiManager && window.authManager && window.topicsManager) {
            clearInterval(checkReadyInterval);

            window.coursesManager = new CoursesManager(window.storageManager, window.uiManager);
            window.coursesManager.setTopicsManager(window.topicsManager);
            window.coursesManager.setAuthManager(window.authManager);

            if (window.topicsManager && typeof window.topicsManager.setCoursesManager === 'function') {
                window.topicsManager.setCoursesManager(window.coursesManager);
            }
        }
    }, 100);
});