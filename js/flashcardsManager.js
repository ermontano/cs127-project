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

        // initialize event listeners
        this.initEventListeners();
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
        document.getElementById('study-flashcards-btn').addEventListener('click', () => {
            if (this.currentTopicId) {
                const flashcards = this.storage.getFlashcardsByTopic(this.currentTopicId);
                if (flashcards.length === 0) {
                    this.ui.showNotification('no flashcards to study. create some first!', 'warning');
                    return;
                }

                // initialize study mode
                const studyMode = new StudyMode(this.ui);
                studyMode.startStudy(flashcards);
            }
        });

        // flashcards list click event delegation for edit/delete
        document.getElementById('flashcards-list').addEventListener('click', (e) => {
            const flashcardItem = e.target.closest('.flashcard-item');
            if (!flashcardItem) return;

            const flashcardId = flashcardItem.dataset.id;

            // check if edit button was clicked
            if (e.target.closest('.edit-flashcard-btn')) {
                const flashcard = this.getFlashcardById(flashcardId);
                if (flashcard) {
                    this.ui.openModal('flashcard', flashcard);
                }
            }

            // check if delete button was clicked
            if (e.target.closest('.delete-flashcard-btn')) {
                this.ui.openModal('confirm', {
                    title: 'delete flashcard',
                    message: 'are you sure you want to delete this flashcard?',
                    confirmText: 'delete',
                    onConfirm: () => {
                        this.deleteFlashcard(flashcardId);
                        this.ui.closeAllModals();
                    }
                });
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
    getFlashcardById(flashcardId) {
        const flashcards = this.storage.getFlashcards();
        return flashcards.find(flashcard => flashcard.id === flashcardId) || null;
    }

    /**
     * save a flashcard (new or edit)
     */
    saveFlashcard() {
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

        // get the id of the flashcard being edited (if any)
        let editFlashcardId = null;
        if (document.getElementById('flashcard-modal-title').textContent.startsWith('Edit')) {
            // find the id of the flashcard being edited
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
            // update existing flashcard
            const flashcard = this.getFlashcardById(editFlashcardId);
            if (flashcard) {
                flashcard.question = question;
                flashcard.answer = answer;
                flashcard.updatedAt = new Date();
                this.storage.saveFlashcard(flashcard);
                this.ui.showNotification('flashcard updated successfully', 'success');
            }
        } else {
            // create new flashcard
            const newFlashcard = new Flashcard(this.currentTopicId, question, answer);
            this.storage.saveFlashcard(newFlashcard);
            this.ui.showNotification('flashcard created successfully', 'success');
        }

        // close the modal and refresh flashcards
        this.ui.closeAllModals();

        // reload flashcards
        const topicsManager = new TopicsManager(this.storage, this.ui);
        topicsManager.selectTopic(this.currentTopicId);
    }

    /**
     * delete a flashcard
     * @param {string} flashcardId - id of the flashcard to delete
     */
    deleteFlashcard(flashcardId) {
        const success = this.storage.deleteFlashcard(flashcardId);

        if (success) {
            this.ui.showNotification('flashcard deleted successfully', 'success');

            // reload flashcards
            const flashcards = this.storage.getFlashcardsByTopic(this.currentTopicId);
            this.ui.renderFlashcardsList(flashcards);

            // update topic's flashcard count
            const topicsManager = new TopicsManager(this.storage, this.ui);
            const coursesManager = new CoursesManager(this.storage, this.ui);

            const topic = topicsManager.getTopicById(this.currentTopicId);
            if (topic) {
                this.ui.updateTopicFlashcardsCount(this.currentTopicId, flashcards.length);

                // also update in the course view
                const topics = this.storage.getTopicsByCourse(topic.courseId);
                topics.forEach(t => {
                    const count = this.storage.getFlashcardsByTopic(t.id).length;
                    this.ui.updateTopicFlashcardsCount(t.id, count);
                });
            }
        } else {
            this.ui.showNotification('failed to delete flashcard', 'error');
        }
    }

    /**
     * search flashcards by term
     * @param {string} term - the search term
     * @returns {array} matching flashcard objects
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
