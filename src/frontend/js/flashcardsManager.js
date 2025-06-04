/**
 * flashcardsmanager class
 * manages all operations related to flashcards
 */
class FlashcardsManager {
    /**
     * create a flashcardsmanager
     * @param {storagemanager} storage - storagemanager instance
     * @param {uimanager} ui - uimanager instance
     */
    constructor(storage, ui) {
        this.storage = storage;
        this.ui = ui;
        this.currentTopicId = null;
        this.topicsManager = null;

        // initialize event listeners
        this.initEventListeners();
    }

    /**
     * set topics manager reference
     * @param {TopicsManager} topicsManager - topics manager instance
     */
    setTopicsManager(topicsManager) {
        this.topicsManager = topicsManager;
    }

    /**
     * initialize event listeners
     */
    initEventListeners() {
        // flashcard form submission
        document.getElementById('flashcard-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveFlashcard();
        });

        // add flashcard button
        document.getElementById('add-flashcard-btn').addEventListener('click', () => {
            this.ui.openModal('flashcard');
        });

        // study flashcards button
        document.getElementById('study-flashcards-btn').addEventListener('click', async () => {
            if (this.currentTopicId) {
                try {
                    const flashcards = await this.storage.getFlashcardsByTopic(this.currentTopicId);
                    if (flashcards.length === 0) {
                        this.ui.showNotification('no flashcards to study. create some first!', 'warning');
                        return;
                    }

                    // initialize study mode
                    const studyMode = new StudyMode(this.ui);
                    studyMode.startStudy(flashcards);
                } catch (error) {
                    console.error('Error loading flashcards for study:', error);
                    this.ui.showNotification('Failed to load flashcards', 'error');
                }
            }
        });

        // flashcards list click event delegation for edit/delete
        document.getElementById('flashcards-list').addEventListener('click', async (e) => {
            const flashcardItem = e.target.closest('.flashcard-item');
            if (!flashcardItem) return;

            const flashcardId = flashcardItem.dataset.id;

            // check if edit button was clicked
            if (e.target.closest('.edit-flashcard-btn')) {
                e.preventDefault();
                e.stopPropagation();
                
                // Prevent rapid clicking
                const editBtn = e.target.closest('.edit-flashcard-btn');
                if (editBtn.disabled) return;
                editBtn.disabled = true;
                
                try {
                    const flashcard = await this.getFlashcardById(flashcardId);
                    if (flashcard) {
                        // Longer delay to ensure all events are processed
                        setTimeout(() => {
                            this.ui.openModal('flashcard', flashcard);
                            // Re-enable button after modal opens
                            setTimeout(() => {
                                editBtn.disabled = false;
                            }, 100);
                        }, 100);
                    } else {
                        editBtn.disabled = false;
                    }
                } catch (error) {
                    console.error('Error loading flashcard for editing:', error);
                    this.ui.showNotification('Failed to load flashcard data', 'error');
                    editBtn.disabled = false;
                }
                return;
            }

            // check if delete button was clicked
            if (e.target.closest('.delete-flashcard-btn')) {
                e.preventDefault();
                e.stopPropagation();
                
                this.ui.openModal('confirm', {
                    title: 'delete flashcard',
                    message: 'are you sure you want to delete this flashcard?',
                    confirmText: 'delete',
                    onConfirm: () => {
                        this.deleteFlashcard(flashcardId);
                        this.ui.closeAllModals();
                    }
                });
                return;
            }
        });
    }

    /**
     * set the current topic id
     * @param {string} topicId - id of the current topic
     */
    setCurrentTopicId(topicId) {
        this.currentTopicId = topicId;
    }

    /**
     * get a flashcard by id
     * @param {string} flashcardId - id of the flashcard
     * @returns {object|null} the flashcard object or null if not found
     */
    async getFlashcardById(flashcardId) {
        try {
            return await this.storage.getFlashcardById(flashcardId);
        } catch (error) {
            console.error('Error getting flashcard by ID:', error);
            return null;
        }
    }

    /**
     * save a flashcard (new or edit)
     */
    async saveFlashcard() {
        const questionInput = document.getElementById('flashcard-question');
        const answerInput = document.getElementById('flashcard-answer');

        const question = questionInput.value.trim();
        const answer = answerInput.value.trim();

        if (!question) {
            this.ui.showNotification('question is required', 'error');
            return;
        }

        if (!answer) {
            this.ui.showNotification('answer is required', 'error');
            return;
        }

        try {
            const modalTitle = document.getElementById('flashcard-modal-title').textContent.toLowerCase();
            const isEditing = modalTitle.startsWith('edit');
            const editingFlashcardId = questionInput.getAttribute('data-flashcard-id');
            
            console.log('Save flashcard - modalTitle:', modalTitle, 'isEditing:', isEditing, 'editingFlashcardId:', editingFlashcardId);
            
            if (isEditing && editingFlashcardId) {
                // Edit existing flashcard
                const existingFlashcard = await this.getFlashcardById(editingFlashcardId);
                if (existingFlashcard) {
                    console.log('Editing flashcard with ID:', existingFlashcard.id, existingFlashcard);
                    existingFlashcard.question = question;
                    existingFlashcard.answer = answer;
                    existingFlashcard.updatedAt = new Date();
                    await this.storage.saveFlashcard(existingFlashcard);
                    this.ui.showNotification('flashcard updated successfully', 'success');
                }
            } else {
                // create new flashcard
                console.log('Creating new flashcard');
                
                // Get current topic ID - fallback to topicsManager if not set
                let topicId = this.currentTopicId;
                if (!topicId && this.topicsManager) {
                    topicId = this.topicsManager.currentTopicId;
                    this.currentTopicId = topicId; // Update our local reference
                }
                
                if (!topicId) {
                    this.ui.showNotification('No topic selected. Please select a topic first.', 'error');
                    return;
                }
                
                const newFlashcard = new Flashcard(question, answer, topicId);
                await this.storage.saveFlashcard(newFlashcard);
                this.ui.showNotification('flashcard created successfully', 'success');
            }

            // close the modal and refresh flashcards
            this.ui.closeAllModals();

            // reload flashcards using the topics manager
            if (this.topicsManager) {
                await this.topicsManager.selectTopic(this.currentTopicId);
            }
        } catch (error) {
            console.error('Error saving flashcard:', error);
            this.ui.showNotification('Failed to save flashcard', 'error');
        }
    }

    /**
     * delete a flashcard
     * @param {string} flashcardId - id of the flashcard to delete
     */
    async deleteFlashcard(flashcardId) {
        try {
            const success = await this.storage.deleteFlashcard(flashcardId);

            if (success) {
                this.ui.showNotification('flashcard deleted successfully', 'success');

                // reload flashcards
                const flashcards = await this.storage.getFlashcardsByTopic(this.currentTopicId);
                this.ui.renderFlashcardsList(flashcards);

                // update topic's flashcard count
                this.ui.updateTopicFlashcardsCount(this.currentTopicId, flashcards.length);

                // If we have topics manager reference, refresh the course view too
                if (this.topicsManager) {
                    const topic = await this.topicsManager.getTopicById(this.currentTopicId);
                    if (topic && this.topicsManager.coursesManager) {
                        await this.topicsManager.coursesManager.selectCourse(topic.courseId);
                    }
                }
            } else {
                this.ui.showNotification('failed to delete flashcard', 'error');
            }
        } catch (error) {
            console.error('Error deleting flashcard:', error);
            this.ui.showNotification('failed to delete flashcard', 'error');
        }
    }

    /**
     * search flashcards by term
     * @param {string} term - the search term
     * @returns {array} matching flashcard objects
     */
    async searchFlashcards(term) {
        if (!term) return [];

        try {
            term = term.toLowerCase();
            const flashcards = await this.storage.getFlashcards();

            return flashcards.filter(flashcard => {
                return (
                    flashcard.question.toLowerCase().includes(term) ||
                    flashcard.answer.toLowerCase().includes(term)
                );
            });
        } catch (error) {
            console.error('Error searching flashcards:', error);
            return [];
        }
    }
}
