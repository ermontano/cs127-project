// study mode for reviewing flashcards

class StudyMode {
    constructor() {
        this.flashcards = [];
        this.currentIndex = 0;
        this.currentTopicId = null;
        this.isInitialized = false;
    }

    // Initialize event listeners (called once)
    initEventListeners() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        // Flip card button
        const flipCardBtn = document.getElementById('flip-card-btn');
        if (flipCardBtn) {
            flipCardBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.flipCard();
            });
        }

        // Card click functionality removed - use button or keyboard shortcuts only

        // Navigation buttons
        const nextBtn = document.getElementById('next-card-btn');
        const prevBtn = document.getElementById('prev-card-btn');

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.nextCard();
            });
        }
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.prevCard();
            });
        }

        // Keyboard shortcuts
        this.keyboardHandler = (e) => {
            if (!this.isStudyModeActive()) return;
            
            switch (e.key) {
                case ' ': // Spacebar to flip
                    e.preventDefault();
                    e.stopPropagation();
                    this.flipCard();
                    break;
                case 'ArrowRight': // Right arrow for next
                case 'n': // N key for next
                    e.preventDefault();
                    e.stopPropagation();
                    this.nextCard();
                    break;
                case 'ArrowLeft': // Left arrow for previous
                case 'p': // P key for previous
                    e.preventDefault();
                    e.stopPropagation();
                    this.prevCard();
                    break;
                case 'Escape': // Escape to exit
                    e.preventDefault();
                    e.stopPropagation();
                    this.exitStudy();
                    break;
            }
        };

        document.addEventListener('keydown', this.keyboardHandler);
    }

    // Check if study mode is currently active
    isStudyModeActive() {
        const studyModeSection = document.getElementById('study-mode');
        return studyModeSection && !studyModeSection.classList.contains('hidden');
    }

    // Debug method to check current card state
    checkCardState() {
        const cardElement = document.getElementById('study-flashcard');
        const frontContent = document.getElementById('study-front-content');
        const backContent = document.getElementById('study-back-content');
        
        return {
            isFlipped: cardElement?.classList.contains('flipped'),
            frontText: frontContent?.textContent,
            backText: backContent?.textContent,
            frontVisible: frontContent ? window.getComputedStyle(frontContent).display !== 'none' : false,
            backVisible: backContent ? window.getComputedStyle(backContent).display !== 'none' : false,
            cardTransform: cardElement ? window.getComputedStyle(cardElement).transform : 'none'
        };
    }

    // Start study session with flashcards and topic ID
    start(flashcards, topicId) {
        console.log('Starting study mode with flashcards:', flashcards, 'for topic:', topicId);
        
        // Clear any existing flashcards first
        this.flashcards = [];
        this.currentIndex = 0;
        this.currentTopicId = topicId;
        
        if (!flashcards || flashcards.length === 0) {
            console.log('No flashcards found for topic:', topicId);
            if (window.uiManager) {
                window.uiManager.showPageAlert('No flashcards to study in this topic! Create some flashcards first to start studying.', 'warning');
                // Return to topic view immediately, don't show study mode at all
                if (window.topicsManager) {
                    const topic = window.topicsManager.allTopicsCache?.find(t => t.id === topicId);
                    if (topic && topic.courseId) {
                        window.uiManager.showTopicView(topicId, topic.courseId);
                    } else {
                        window.uiManager.showTopicView(topicId);
                    }
                } else {
                    window.uiManager.showTopicsOverview();
                }
            }
            return;
        }

        this.flashcards = [...flashcards].sort(() => Math.random() - 0.5); // Shuffle
        console.log('Shuffled flashcards for study:', this.flashcards.length, 'cards');
        
        // Initialize event listeners if not done yet
        this.initEventListeners();
        
        // Show study mode section
        if (window.uiManager) {
            window.uiManager.showSection('study');
        }
        
        // Display the first card
        this.displayCurrentCard();
        this.updateCardCount();
        this.updateNavigationButtons();
    }

    // Alternative method name for compatibility
    startStudy(topicId) {
        console.log('startStudy called for topicId:', topicId);
        
        // Clean up any previous study session first
        this.cleanup();
        
        // Load flashcards for the topic
        if (window.flashcardsManager && window.flashcardsManager.storage) {
            console.log('Fetching flashcards for topic:', topicId);
            window.flashcardsManager.storage.getFlashcardsByTopic(topicId)
                .then(flashcards => {
                    console.log('=== STUDY MODE DEBUG ===');
                    console.log('Expected topic ID:', topicId, 'type:', typeof topicId);
                    console.log('Retrieved flashcards from storage:', flashcards);
                    console.log('Flashcards count:', flashcards ? flashcards.length : 0);
                    
                    if (flashcards && flashcards.length > 0) {
                        // Log all flashcard topic IDs for debugging
                        console.log('All flashcard topic IDs:', flashcards.map(card => ({
                            id: card.id,
                            topicId: card.topicId,
                            topic_id: card.topic_id,
                            topicIdType: typeof card.topicId,
                            topic_id_type: typeof card.topic_id,
                            question: card.question?.substring(0, 30)
                        })));
                        
                        // Log the complete first flashcard to see its structure
                        console.log('Complete first flashcard object:', flashcards[0]);
                        
                        // Check if flashcards have topicId property (try both naming conventions)
                        const flashcardsWithTopicId = flashcards.filter(card => {
                            const hasTopicId = card.topicId !== undefined && card.topicId !== null;
                            const hasTopicIdSnakeCase = card.topic_id !== undefined && card.topic_id !== null;
                            return hasTopicId || hasTopicIdSnakeCase;
                        });
                        console.log(`Flashcards with valid topicId: ${flashcardsWithTopicId.length} out of ${flashcards.length}`);
                        
                        if (flashcardsWithTopicId.length === 0) {
                            console.error('API BUG: All flashcards have undefined/null topicId - this is a backend issue');
                            console.log('Since API filtered by topicId, assuming these flashcards belong to the requested topic');
                            // If API filtering worked (we got flashcards) but topicId is undefined, 
                            // it's a backend issue - trust the API filtering
                            this.start(flashcards, topicId);
                            return;
                        }
                        
                        // Validate that flashcards actually belong to this topic (check both naming conventions)
                        const validFlashcards = flashcards.filter(card => {
                            // Get the topic ID from either naming convention
                            const cardTopicId = card.topicId !== undefined ? card.topicId : card.topic_id;
                            
                            if (cardTopicId === undefined || cardTopicId === null) {
                                console.warn(`Flashcard ${card.id} has undefined/null topicId in both naming conventions`);
                                return false;
                            }
                            
                            const cardTopicIdStr = String(cardTopicId);
                            const expectedTopicIdStr = String(topicId);
                            const isValid = cardTopicIdStr === expectedTopicIdStr;
                            
                            if (!isValid) {
                                console.warn(`Flashcard ${card.id} has wrong topic ID: ${cardTopicId} (expected: ${topicId})`);
                            }
                            
                            return isValid;
                        });
                        
                        console.log(`Valid flashcards for topic ${topicId}:`, validFlashcards.length, 'out of', flashcards.length);
                        
                        if (validFlashcards.length > 0) {
                            console.log('Starting study with valid flashcards');
                            this.start(validFlashcards, topicId);
                        } else {
                            console.log('No valid flashcards found - checking if this is a backend issue');
                            this.start([], topicId);
                        }
                    } else {
                        console.log('No flashcards found for topic:', topicId);
                        this.start([], topicId);
                    }
                    console.log('=== END STUDY MODE DEBUG ===');
                })
                .catch(error => {
                    console.error('Error loading flashcards for study:', error);
                    // Clean up and return to topic view on error
                    this.cleanup();
                    if (window.uiManager) {
                        window.uiManager.showPageAlert('Failed to load flashcards for study. Please try again.', 'error', true);
                        // Return to topic view after error
                        if (window.topicsManager) {
                            const topic = window.topicsManager.allTopicsCache?.find(t => t.id === topicId);
                            if (topic && topic.courseId) {
                                window.uiManager.showTopicView(topicId, topic.courseId);
                            } else {
                                window.uiManager.showTopicView(topicId);
                            }
                        } else {
                            window.uiManager.showTopicsOverview();
                        }
                    }
                });
        } else {
            console.error('FlashcardsManager or storage not available');
            if (window.uiManager) {
                window.uiManager.showPageAlert('Unable to access flashcards storage. Please refresh the page and try again.', 'error', true);
            }
        }
    }

    // Display current flashcard
    displayCurrentCard() {
        if (!this.flashcards.length) return;

        const flashcard = this.flashcards[this.currentIndex];
        const cardElement = document.getElementById('study-flashcard');
        
        if (!cardElement) {
            console.error('Study flashcard element not found');
            return;
        }

        // Reset card to front side
        cardElement.classList.remove('flipped');
        console.log('Card reset to front side for new flashcard');

        // Update content
        const frontContent = document.getElementById('study-front-content');
        const backContent = document.getElementById('study-back-content');
        
        if (frontContent) {
            frontContent.textContent = flashcard.question || 'No question available';
            console.log('Front content set to:', frontContent.textContent);
        }
        if (backContent) {
            backContent.textContent = flashcard.answer || 'No answer available';
            console.log('Back content set to:', backContent.textContent);
        }

        console.log('Displaying card:', flashcard.question, '/', flashcard.answer);
        
        // Update UI elements
        this.updateCardCount();
        this.updateNavigationButtons();
        
        // Mark as reviewed if we have a method for it
        if (flashcard.review && typeof flashcard.review === 'function') {
            flashcard.review();
        }
        
        // Log current state for debugging
        setTimeout(() => {
            console.log('Card state after display:', {
                isFlipped: cardElement.classList.contains('flipped'),
                frontText: frontContent?.textContent,
                backText: backContent?.textContent,
                cardClasses: Array.from(cardElement.classList)
            });
        }, 100);
    }

    // Flip the current card
    flipCard() {
        const cardElement = document.getElementById('study-flashcard');
        if (cardElement) {
            const wasFlipped = cardElement.classList.contains('flipped');
            cardElement.classList.toggle('flipped');
            console.log('Card flipped from:', wasFlipped ? 'back' : 'front', 'to:', cardElement.classList.contains('flipped') ? 'back' : 'front');
        }
    }

    // Navigate to next card
    nextCard() {
        if (this.currentIndex < this.flashcards.length - 1) {
            this.currentIndex++;
            this.displayCurrentCard();
        } else {
            // At the end, show completion overlay
            if (window.uiManager) {
                window.uiManager.showSuccessOverlay(
                    'Study Session Complete! 🎉',
                    'Great job! You\'ve completed all flashcards in this topic.',
                    () => {
                        // Return to topic view after completion
                        if (window.topicsManager) {
                            const topic = window.topicsManager.allTopicsCache?.find(t => t.id === this.currentTopicId);
                            if (topic && topic.courseId) {
                                window.uiManager.showTopicView(this.currentTopicId, topic.courseId);
                            } else {
                                window.uiManager.showTopicView(this.currentTopicId);
                            }
                        } else {
                            window.uiManager.showTopicsOverview();
                        }
                    }
                );
            }
        }
    }

    // Navigate to previous card
    prevCard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.displayCurrentCard();
        }
    }

    // Update the card count display
    updateCardCount() {
        const currentCardElement = document.getElementById('current-card');
        const totalCardsElement = document.getElementById('total-cards');
        
        if (currentCardElement) {
            currentCardElement.textContent = this.currentIndex + 1;
        }
        if (totalCardsElement) {
            totalCardsElement.textContent = this.flashcards.length;
        }
    }

    // Update navigation button states
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-card-btn');
        const nextBtn = document.getElementById('next-card-btn');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentIndex === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentIndex === this.flashcards.length - 1;
        }
    }

    // Exit study mode
    exitStudy() {
        console.log('Exiting study mode, currentTopicId:', this.currentTopicId);
        
        // Save the topic ID before cleanup clears it
        const topicIdToReturnTo = this.currentTopicId;
        
        // Clean up event listeners
        this.cleanup();
        
        if (window.uiManager) {
            // Return to topic view if we have a valid topic ID
            if (topicIdToReturnTo !== null && topicIdToReturnTo !== undefined && window.topicsManager) {
                console.log('Attempting to return to topic view for topicId:', topicIdToReturnTo);
                
                // Validate topic exists in cache before attempting to show it
                const topic = window.topicsManager.allTopicsCache?.find(t => t.id == topicIdToReturnTo);
                if (topic) {
                    console.log('Found topic in cache:', topic);
                    if (topic.courseId) {
                        window.uiManager.showTopicView(topicIdToReturnTo, topic.courseId);
                    } else {
                        window.uiManager.showTopicView(topicIdToReturnTo);
                    }
                } else {
                    console.log('Topic not found in cache, falling back to topics overview');
                    window.uiManager.showTopicsOverview();
                }
            } else {
                console.log('No valid currentTopicId, showing topics overview');
                // Fallback to topics overview
                window.uiManager.showTopicsOverview();
            }
        }
    }

    // Clean up event listeners to prevent conflicts
    cleanup() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
        }
        
        // Reset any card animations
        const cardElement = document.getElementById('study-flashcard');
        if (cardElement) {
            cardElement.classList.remove('flipped');
            cardElement.style.transform = '';
        }
        
        // Clear current state
        this.flashcards = [];
        this.currentIndex = 0;
        this.currentTopicId = null;
    }
}

// Create global instance
window.studyModeManager = new StudyMode();

// Add CSS for study mode enhancements
const studyModeStyle = document.createElement('style');
studyModeStyle.textContent = `
    #prev-card-btn:disabled,
    #next-card-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .study-flashcard {
        user-select: none;
        /* Allow the normal flip transition from main CSS */
        transition: transform 0.6s;
        /* Remove cursor pointer since card is not clickable */
        cursor: default;
        /* Disable all hover effects to prevent flip interference */
        pointer-events: auto;
    }

    /* Remove all hover effects - they were causing flip state conflicts */
    .study-flashcard:hover,
    .study-flashcard.flipped:hover,
    .study-flashcard:not(.flipped):hover {
        /* No hover effects to prevent interference with flip animation */
    }

    /* Prevent other elements from interfering with clicks */
    .study-controls,
    .study-header {
        pointer-events: auto;
    }

    .study-controls button {
        pointer-events: auto;
        cursor: pointer;
    }

    /* Remove click-to-flip instructions since card is not clickable */
    /* Keyboard shortcuts info */
    .study-header::after {
        content: 'Shortcuts: Space=Flip, ←→=Navigate, Esc=Exit';
        position: absolute;
        bottom: -20px;
        left: 0;
        font-size: 0.75rem;
        color: var(--text-tertiary);
        opacity: 0.8;
        pointer-events: none;
    }

    .study-header {
        position: relative;
        margin-bottom: var(--spacing-6);
    }

    /* Ensure study mode container doesn't interfere */
    .study-mode {
        pointer-events: auto;
    }

    /* Prevent flashcard container from capturing clicks outside the actual card */
    .flashcard-container {
        pointer-events: none;
    }

    .flashcard-container .study-flashcard {
        pointer-events: auto;
    }

    /* Allow text selection since card is not clickable */
    .flashcard-front .flashcard-content,
    .flashcard-back .flashcard-content {
        pointer-events: auto;
        user-select: text;
    }
`;
document.head.appendChild(studyModeStyle);
