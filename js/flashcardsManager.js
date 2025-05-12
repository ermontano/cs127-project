/**
 * FlashcardsManager class
 * Manages all operations related to flashcards
 */
class FlashcardsManager {
    /**
     * Create a FlashcardsManager
     * @param {StorageManager} storage - StorageManager instance
     * @param {UIManager} ui - UIManager instance
     */
    constructor(storage, ui) {
        this.storage = storage;
        this.ui = ui;
        this.currentTopicId = null;
        
        // Initialize event listeners
        this.initEventListeners();
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Flashcard form submission
        document.getElementById('flashcard-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveFlashcard();
        });
        
        // Add flashcard button
        document.getElementById('add-flashcard-btn').addEventListener('click', () => {
            this.ui.openModal('flashcard');
        });
        
        // Study flashcards button
        document.getElementById('study-flashcards-btn').addEventListener('click', () => {
            if (this.currentTopicId) {
                const flashcards = this.storage.getFlashcardsByTopic(this.currentTopicId);
                if (flashcards.length === 0) {
                    this.ui.showNotification('No flashcards to study. Create some first!', 'warning');
                    return;
                }
                
                // Initialize study mode
                const studyMode = new StudyMode(this.ui);
                studyMode.startStudy(flashcards);
            }
        });
        
        // Flashcards list click event delegation for edit/delete
        document.getElementById('flashcards-list').addEventListener('click', (e) => {
            const flashcardItem = e.target.closest('.flashcard-item');
            if (!flashcardItem) return;
            
            const flashcardId = flashcardItem.dataset.id;
            
            // Check if edit button was clicked
            if (e.target.closest('.edit-flashcard-btn')) {
                const flashcard = this.getFlashcardById(flashcardId);
                if (flashcard) {
                    this.ui.openModal('flashcard', flashcard);
                }
            }
            
            // Check if delete button was clicked
            if (e.target.closest('.delete-flashcard-btn')) {
                this.ui.openModal('confirm', {
                    title: 'Delete Flashcard',
                    message: 'Are you sure you want to delete this flashcard?',
                    confirmText: 'Delete',
                    onConfirm: () => {
                        this.deleteFlashcard(flashcardId);
                        this.ui.closeAllModals();
                    }
                });
            }
        });
    }

    /**
     * Set the current topic ID
     * @param {string} topicId - ID of the current topic
     */
    setCurrentTopicId(topicId) {
        this.currentTopicId = topicId;
    }

    /**
     * Get a flashcard by ID
     * @param {string} flashcardId - ID of the flashcard
     * @returns {Object|null} The flashcard object or null if not found
     */
    getFlashcardById(flashcardId) {
        const flashcards = this.storage.getFlashcards();
        return flashcards.find(flashcard => flashcard.id === flashcardId) || null;
    }

    /**
     * Save a flashcard (new or edit)
     */
    saveFlashcard() {
        const questionInput = document.getElementById('flashcard-question');
        const answerInput = document.getElementById('flashcard-answer');
        
        const question = questionInput.value.trim();
        const answer = answerInput.value.trim();
        
        if (!question) {
            this.ui.showNotification('Question is required', 'error');
            return;
        }
        
        if (!answer) {
            this.ui.showNotification('Answer is required', 'error');
            return;
        }
        
        // Get the ID of the flashcard being edited (if any)
        let editFlashcardId = null;
        if (document.getElementById('flashcard-modal-title').textContent.startsWith('Edit')) {
            // Find the ID of the flashcard being edited
            const flashcardsList = document.getElementById('flashcards-list');
            const flashcardItems = flashcardsList.querySelectorAll('.flashcard-item');
            
            for (const item of flashcardItems) {
                if (item.querySelector('.flashcard-question').textContent === questionInput.value) {
                    editFlashcardId = item.dataset.id;
                    break;
                }
            }
        }
        
        if (editFlashcardId) {
            // Update existing flashcard
            const flashcard = this.getFlashcardById(editFlashcardId);
            if (flashcard) {
                flashcard.question = question;
                flashcard.answer = answer;
                flashcard.updatedAt = new Date();
                this.storage.saveFlashcard(flashcard);
                this.ui.showNotification('Flashcard updated successfully', 'success');
            }
        } else {
            // Create new flashcard
            const newFlashcard = new Flashcard(this.currentTopicId, question, answer);
            this.storage.saveFlashcard(newFlashcard);
            this.ui.showNotification('Flashcard created successfully', 'success');
        }
        
        // Close the modal and refresh flashcards
        this.ui.closeAllModals();
        
        // Reload flashcards
        const topicsManager = new TopicsManager(this.storage, this.ui);
        topicsManager.selectTopic(this.currentTopicId);
    }

    /**
     * Delete a flashcard
     * @param {string} flashcardId - ID of the flashcard to delete
     */
    deleteFlashcard(flashcardId) {
        const success = this.storage.deleteFlashcard(flashcardId);
        
        if (success) {
            this.ui.showNotification('Flashcard deleted successfully', 'success');
            
            // Reload flashcards
            const flashcards = this.storage.getFlashcardsByTopic(this.currentTopicId);
            this.ui.renderFlashcardsList(flashcards);
            
            // Update topic's flashcard count
            const topicsManager = new TopicsManager(this.storage, this.ui);
            const coursesManager = new CoursesManager(this.storage, this.ui);
            
            const topic = topicsManager.getTopicById(this.currentTopicId);
            if (topic) {
                this.ui.updateTopicFlashcardsCount(this.currentTopicId, flashcards.length);
                
                // Also update in the course view
                const topics = this.storage.getTopicsByCourse(topic.courseId);
                topics.forEach(t => {
                    const count = this.storage.getFlashcardsByTopic(t.id).length;
                    this.ui.updateTopicFlashcardsCount(t.id, count);
                });
            }
        } else {
            this.ui.showNotification('Failed to delete flashcard', 'error');
        }
    }

    /**
     * Search flashcards by term
     * @param {string} term - The search term
     * @returns {Array} Matching flashcard objects
     */
    searchFlashcards(term) {
        if (!term) return [];
        
        term = term.toLowerCase();
        const flashcards = this.storage.getFlashcards();
        
        return flashcards.filter(flashcard => {
            return (
                flashcard.question.toLowerCase().includes(term) ||
                flashcard.answer.toLowerCase().includes(term)
            );
        });
    }
}