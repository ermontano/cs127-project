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
        document.getElementById('edit-course-btn').addEventListener('click', async () => {
            if (this.currentCourseId) {
                try {
                    const course = await this.getCourseById(this.currentCourseId);
                    if (course) {
                        this.ui.openModal('course', course);
                    }
                } catch (error) {
                    console.error('Error loading course for editing:', error);
                    this.ui.showNotification('Failed to load course data', 'error');
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
        } catch (error) {
            console.error('Error selecting course:', error);
            this.ui.showNotification('Failed to load course', 'error');
        }
    }

    /**
     * save a course (new or edit)
     */
    async saveCourse() {
        const titleInput = document.getElementById('course-name');
        const descInput = document.getElementById('course-desc');
        
        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        
        if (!title) {
            this.ui.showNotification('Course title is required', 'error');
            return;
        }
        
        try {
            const modalTitle = document.getElementById('course-modal-title').textContent.toLowerCase();
            const isEditing = modalTitle.startsWith('edit') && this.currentCourseId;
            
            console.log('Save course - modalTitle:', modalTitle, 'isEditing:', isEditing, 'currentCourseId:', this.currentCourseId);
            
            if (isEditing) {
                // update existing course
                const existingCourse = await this.getCourseById(this.currentCourseId);
                if (!existingCourse) {
                    this.ui.showNotification('Course not found', 'error');
                    return;
                }
                
                console.log('Editing course with ID:', existingCourse.id, existingCourse);
                
                // Update the course object with new values
                existingCourse.title = title;
                existingCourse.description = description;
                existingCourse.updatedAt = new Date();
                
                const updatedCourse = await this.storage.saveCourse(existingCourse);
                this.ui.showNotification('Course updated successfully', 'success');
                
                // refresh the course view
                await this.selectCourse(this.currentCourseId);
            } else {
                // create new course
                console.log('Creating new course');
                const newCourse = new Course(title, description);
                const savedCourse = await this.storage.saveCourse(newCourse);
                this.ui.showNotification('Course created successfully', 'success');
                
                // select the new course
                this.currentCourseId = savedCourse.id;
            }
            
            // close the modal and reload courses
            this.ui.closeAllModals();
            await this.loadCourses();
        } catch (error) {
            console.error('Error saving course:', error);
            this.ui.showNotification('Failed to save course', 'error');
        }
    }

    /**
     * delete a course
     * @param {string} courseId - ID of the course to delete
     */
    async deleteCourse(courseId) {
        try {
            const success = await this.storage.deleteCourse(courseId);
            
            if (success) {
                this.ui.showNotification('Course deleted successfully', 'success');
                
                // clear current course
                if (this.currentCourseId === courseId) {
                    this.currentCourseId = null;
                }
                
                // reload courses
                await this.loadCourses();
            } else {
                this.ui.showNotification('Failed to delete course', 'error');
            }
        } catch (error) {
            console.error('Error deleting course:', error);
            this.ui.showNotification('Failed to delete course', 'error');
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
}