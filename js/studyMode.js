/**
 * StudyMode class
 * Manages the flashcard study mode
 */
class StudyMode {
    /**
     * Create a StudyMode instance
     * @param {UIManager} ui - UIManager instance
     */
    constructor(ui) {
        this.ui = ui;
        this.flashcards = [];
        this.currentIndex = 0;
        
        // Initialize event listeners
        this.initEventListeners();
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Flip card button
        document.getElementById('flip-card-btn').addEventListener('click', () => {
            this.flipCard();
        });
        
        // Study flashcard container click to flip
        document.getElementById('study-flashcard-container').addEventListener('click', () => {
            this.flipCard();
        });
        
        // Next card button
        document.getElementById('next-card-btn').addEventListener('click', () => {
            this.nextCard();
        });
        
        // Previous card button
        document.getElementById('prev-card-btn').addEventListener('click', () => {
            this.prevCard();
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Only handle keys when in study mode
            if (document.getElementById('study-mode').classList.contains('hidden')) {
                return;
            }
            
            switch (e.key) {
                case ' ':
                    // Space to flip card
                    e.preventDefault();
                    this.flipCard();
                    break;
                case 'ArrowRight':
                    // Right arrow for next card
                    this.nextCard();
                    break;
                case 'ArrowLeft':
                    // Left arrow for previous card
                    this.prevCard();
                    break;
                case 'Escape':
                    // Escape to exit study mode
                    this.exitStudy();
                    break;
            }
        });
        
        // Exit study button
        document.getElementById('exit-study-btn').addEventListener('click', () => {
            this.exitStudy();
        });
    }

    /**
     * Start the study mode with a set of flashcards
     * @param {Array} flashcards - Array of flashcard objects
     */
    startStudy(flashcards) {
        // Make a copy and shuffle the flashcards
        this.flashcards = [...flashcards].sort(() => Math.random() - 0.5);
        this.currentIndex = 0;
        
        // Update UI
        this.updateCardCount();
        this.displayCurrentCard();
        
        // Show the study mode
        this.ui.showSection('study');
    }

    /**
     * Display the current flashcard
     */
    displayCurrentCard() {
        if (!this.flashcards.length) return;
        
        const flashcard = this.flashcards[this.currentIndex];
        
        // Reset card to front side
        const cardElement = document.getElementById('study-flashcard');
        cardElement.classList.remove('flipped');
        
        // Update content
        document.getElementById('study-front-content').textContent = flashcard.question;
        document.getElementById('study-back-content').textContent = flashcard.answer;
        
        // Mark as reviewed
        flashcard.review();
        
        // Update card count
        this.updateCardCount();
        
        // Update button states
        document.getElementById('prev-card-btn').disabled = this.currentIndex === 0;
        document.getElementById('next-card-btn').disabled = this.currentIndex === this.flashcards.length - 1;
    }

    /**
     * Flip the current flashcard
     */
    flipCard() {
        const cardElement = document.getElementById('study-flashcard');
        cardElement.classList.toggle('flipped');
    }

    /**
     * Move to the next flashcard
     */
    nextCard() {
        if (this.currentIndex < this.flashcards.length - 1) {
            this.currentIndex++;
            this.displayCurrentCard();
        }
    }

    /**
     * Move to the previous flashcard
     */
    prevCard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.displayCurrentCard();
        }
    }

    /**
     * Update the card count display
     */
    updateCardCount() {
        document.getElementById('current-card').textContent = this.currentIndex + 1;
        document.getElementById('total-cards').textContent = this.flashcards.length;
    }

    /**
     * Exit study mode
     */
    exitStudy() {
        this.ui.showSection('topic');
    }
}

// Add CSS for the study mode button states
const studyModeStyle = document.createElement('style');
studyModeStyle.textContent = `
    #prev-card-btn:disabled,
    #next-card-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .study-flashcard {
        cursor: pointer;
    }
    
    .flashcard-front::after {
        content: 'Click to flip';
        position: absolute;
        bottom: 10px;
        right: 10px;
        font-size: 0.8rem;
        color: var(--text-tertiary);
        opacity: 0.7;
    }
`;

document.head.appendChild(studyModeStyle);