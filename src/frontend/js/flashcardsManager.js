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
        this.authManager = null; // For refreshing global stats

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
     * set auth manager reference
     * @param {AuthManager} authManager - auth manager instance
     */
    setAuthManager(authManager) {
        this.authManager = authManager;
    }

    /**
     * initialize event listeners
     */
    initEventListeners() {
        // flashcard form submission
        const flashcardForm = document.getElementById('flashcard-form');
        if (flashcardForm) {
            flashcardForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveFlashcard();
            });
        }

        // add flashcard button
        const addFlashcardBtn = document.getElementById('add-flashcard-btn');
        if (addFlashcardBtn) {
            addFlashcardBtn.addEventListener('click', () => {
                        if (!this.currentTopicId) {
            this.ui.showPageAlert('No topic selected to add flashcard to. Please select a topic first.', 'error');
            return;
        }
                this.ui.openModal('flashcard');
            });
        }

        // study flashcards button
        const studyBtn = document.getElementById('study-flashcards-btn');
        if (studyBtn) {
            studyBtn.addEventListener('click', async () => {
                if (this.currentTopicId) {
                    try {
                        const flashcards = await this.storage.getFlashcardsByTopic(this.currentTopicId);
                        if (flashcards.length === 0) {
                            this.ui.showPageAlert('No flashcards to study. Create some flashcards first!', 'warning');
                            return;
                        }
                        // Use the global study mode manager
                        if (window.studyModeManager) {
                            window.studyModeManager.start(flashcards, this.currentTopicId);
                        } else {
                            this.ui.showPageAlert('Study mode is currently unavailable. Please refresh the page and try again.', 'error');
                        }
                    } catch (error) {
                        console.error('Error loading flashcards for study:', error);
                        this.ui.showPageAlert('Failed to load flashcards for study. Please try again.', 'error');
                    }
                }
            });
        }

        // Note: Edit/delete actions for flashcards are now handled by the action menu system in UI manager
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
            const flashcard = await this.storage.getFlashcardById(flashcardId);
            if (!flashcard) this.ui.showPageAlert('Flashcard not found', 'error');
            return flashcard;
        } catch (error) {
            console.error('Error getting flashcard by ID:', error);
            this.ui.showPageAlert('Failed to fetch flashcard details', 'error');
            return null;
        }
    }

    /**
     * load flashcards for a topic
     * @param {string} topicId - id of the topic
     */
    async loadFlashcardsForTopic(topicId) {
        this.setCurrentTopicId(topicId);
        try {
            const flashcards = await this.storage.getFlashcardsByTopic(topicId);
            this.ui.renderFlashcardsList(flashcards);
        } catch (error) {
            console.error(`Error loading flashcards for topic ${topicId}:`, error);
            this.ui.showPageAlert('Failed to load flashcards for this topic', 'error');
            this.ui.renderFlashcardsList([]);
        }
    }

    /**
     * save a flashcard (new or edit)
     */
    async handleSaveFlashcard() {
        const formElement = document.getElementById('flashcard-form');
        const questionInput = formElement.elements['flashcard-question'];
        const answerInput = formElement.elements['flashcard-answer'];
        const question = questionInput.value.trim();
        const answer = answerInput.value.trim();
        const editingFlashcardId = formElement.dataset.editingId;

        if (!question || !answer) {
            this.ui.showFormError('flashcard-form', 'Both question and answer are required');
            return;
        }
        if (!this.currentTopicId) {
            this.ui.showFormError('flashcard-form', 'No active topic selected to save flashcard to');
            return;
        }

        const flashcardData = { question, answer, topicId: this.currentTopicId };
        if (editingFlashcardId) {
            flashcardData.id = editingFlashcardId;
        }

        try {
            await this.storage.saveFlashcard(flashcardData);
            this.ui.closeAllModals();
            this.ui.showToast(editingFlashcardId ? 'Flashcard updated successfully' : 'Flashcard created successfully', 'success');

            await this.loadFlashcardsForTopic(this.currentTopicId);
            
            if (this.authManager) {
                await this.authManager.refreshStats();
            }
        } catch (error) {
            console.error('Error saving flashcard:', error);
            this.ui.showFormError('flashcard-form', error.message || 'Failed to save flashcard');
        }
    }

    /**
     * delete a flashcard
     * @param {string} flashcardId - id of the flashcard to delete
     */
    async deleteFlashcard(flashcardId) {
        if (!flashcardId || !this.currentTopicId) return;

        try {
            await this.storage.deleteFlashcard(flashcardId);
            this.ui.showToast('Flashcard deleted successfully', 'success');

            await this.loadFlashcardsForTopic(this.currentTopicId);
            
            if (this.authManager) {
                await this.authManager.refreshStats();
            }
        } catch (error) {
            console.error('Error deleting flashcard:', error);
            this.ui.showPageAlert('Failed to delete flashcard. ' + (error.message || ''), 'error');
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

// Initialize FlashcardsManager and inject dependencies
document.addEventListener('DOMContentLoaded', () => {
    const checkReadyInterval = setInterval(() => {
        if (window.storageManager && window.uiManager && window.authManager && window.topicsManager) { // All core managers ready
            clearInterval(checkReadyInterval);

            window.flashcardsManager = new FlashcardsManager(window.storageManager, window.uiManager);
            window.flashcardsManager.setTopicsManager(window.topicsManager);
            window.flashcardsManager.setAuthManager(window.authManager);

            // If topicsManager needs flashcardsManager (it does, for loading flashcards within a topic)
            if (typeof window.topicsManager.setFlashcardsManager === 'function') {
                window.topicsManager.setFlashcardsManager(window.flashcardsManager);
            }
            
            // Flashcards are loaded when a topic is viewed, no initial global load needed here.
        }
    }, 100);
});
