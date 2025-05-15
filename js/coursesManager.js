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

        this.initEventListeners();
    }

    initEventListeners() {
        // course form submission
        document.getElementById('course-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCourse();
        });
        
        // add course button
        document.getElementById('add-course-btn').addEventListener('click', () => {
            this.ui.openModal('course');
        });
        
        // welcome screen create course button
        document.getElementById('welcome-create-course').addEventListener('click', () => {
            this.ui.openModal('course');
        });
        
        // course list click event delegation
        document.getElementById('courses-list').addEventListener('click', (e) => {
            const courseItem = e.target.closest('.course-item');
            if (courseItem) {
                const courseId = courseItem.dataset.id;
                this.selectCourse(courseId);
            }
        });
        
        // edit course button
        document.getElementById('edit-course-btn').addEventListener('click', () => {
            if (this.currentCourseId) {
                const course = this.getCourseById(this.currentCourseId);
                if (course) {
                    this.ui.openModal('course', course);
                }
            }
        });
        
        // delete course button
        document.getElementById('delete-course-btn').addEventListener('click', () => {
            if (this.currentCourseId) {
                this.ui.openModal('confirm', {
                    title: 'Delete Course',
                    message: 'Are you sure you want to delete this course? This will also delete all topics and flashcards within it.',
                    confirmText: 'Delete',
                    onConfirm: () => {
                        this.deleteCourse(this.currentCourseId);
                        this.ui.closeAllModals();
                    }
                });
            }
        });
    }

    /**
     * load all courses and render them
     */
    loadCourses() {
        const courses = this.storage.getCourses();
        
        // render courses in the sidebar
        this.ui.renderCoursesList(courses, this.currentCourseId);
        
        // update topic counts for each course
        courses.forEach(course => {
            const topicsCount = this.getTopicsCountForCourse(course.id);
            this.ui.updateCourseTopicsCount(course.id, topicsCount);
        });
        
        // show welcome screen if no courses
        if (courses.length === 0) {
            this.ui.showSection('welcome');
        } else if (this.currentCourseId) {
            // if we have a selected course, show it
            this.selectCourse(this.currentCourseId);
        } else if (courses.length > 0) {
            // otherwise select the first course
            this.selectCourse(courses[0].id);
        }
    }

    /**
     * get a course by ID
     * @param {string} courseId - ID of the course
     * @returns {Object|null} the course object or null if not found
     */
    getCourseById(courseId) {
        const courses = this.storage.getCourses();
        return courses.find(course => course.id === courseId) || null;
    }

    /**
     * get the number of topics for a course
     * @param {string} courseId - ID of the course
     * @returns {number} the number of topics
     */
    getTopicsCountForCourse(courseId) {
        const topics = this.storage.getTopicsByCourse(courseId);
        return topics.length;
    }

    /**
     * select a course and show its details
     * @param {string} courseId - ID of the course
     */
    selectCourse(courseId) {
        // update current course
        this.currentCourseId = courseId;
        
        // get the course
        const course = this.getCourseById(courseId);
        if (!course) return;
        
        // update UI to show the selected course
        this.ui.renderCoursesList(this.storage.getCourses(), courseId);
        this.ui.renderCourseDetails(course);
        
        // load and render topics for this course
        const topics = this.storage.getTopicsByCourse(courseId);
        this.ui.renderTopicsGrid(topics);
        
        // update flashcard counts for each topic
        topics.forEach(topic => {
            const flashcardsCount = this.storage.getFlashcardsByTopic(topic.id).length;
            this.ui.updateTopicFlashcardsCount(topic.id, flashcardsCount);
        });
        
        // show the course view
        this.ui.showSection('course');
    }

    /**
     * save a course (new or edit)
     */
    saveCourse() {
        const titleInput = document.getElementById('course-name');
        const descInput = document.getElementById('course-desc');
        
        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        
        if (!title) {
            this.ui.showNotification('Course title is required', 'error');
            return;
        }
        
        // check if we're editing or creating a new course
        if (this.currentCourseId && document.getElementById('course-modal-title').textContent.startsWith('Edit')) {
            // update existing course
            const course = this.getCourseById(this.currentCourseId);
            if (course) {
                course.title = title;
                course.description = description;
                course.updatedAt = new Date();
                this.storage.saveCourse(course);
                this.ui.showNotification('Course updated successfully', 'success');
                
                // refresh the course view
                this.selectCourse(this.currentCourseId);
            }
        } else {
            // create new course
            const newCourse = new Course(title, description);
            this.storage.saveCourse(newCourse);
            this.ui.showNotification('Course created successfully', 'success');
            
            // select the new course
            this.currentCourseId = newCourse.id;
        }
        
        // close the modal and reload courses
        this.ui.closeAllModals();
        this.loadCourses();
    }

    /**
     * delete a course
     * @param {string} courseId - ID of the course to delete
     */
    deleteCourse(courseId) {
        const success = this.storage.deleteCourse(courseId);
        
        if (success) {
            this.ui.showNotification('Course deleted successfully', 'success');
            
            // clear current course
            if (this.currentCourseId === courseId) {
                this.currentCourseId = null;
            }
            
            // reload courses
            this.loadCourses();
        } else {
            this.ui.showNotification('Failed to delete course', 'error');
        }
    }

    /**
     * search courses by term
     * @param {string} term - the search term
     * @returns {Array} matching course objects
     */
    searchCourses(term) {
        if (!term) return [];
        
        term = term.toLowerCase();
        const courses = this.storage.getCourses();
        
        return courses.filter(course => {
            return (
                course.title.toLowerCase().includes(term) ||
                (course.description && course.description.toLowerCase().includes(term))
            );
        });
    }
}