// study mode for reviewing flashcards

class StudyMode {
    constructor(ui) {
        this.ui = ui;
        this.flashcards = [];
        this.currentIndex = 0;
        this.initEventListeners();
    }

    // set up event listeners for buttons and keys
    initEventListeners() {
        document.getElementById('flip-card-btn').addEventListener('click', () => this.flipCard());
        document.getElementById('study-flashcard-container').addEventListener('click', () => this.flipCard());
        document.getElementById('next-card-btn').addEventListener('click', () => this.nextCard());
        document.getElementById('prev-card-btn').addEventListener('click', () => this.prevCard());
        document.getElementById('exit-study-btn').addEventListener('click', () => this.exitStudy());

        document.addEventListener('keydown', (e) => {
            if (document.getElementById('study-mode').classList.contains('hidden')) return;
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    this.flipCard();
                    break;
                case 'ArrowRight':
                    this.nextCard();
                    break;
                case 'ArrowLeft':
                    this.prevCard();
                    break;
                case 'Escape':
                    this.exitStudy();
                    break;
            }
        });
    }

    // start study session
    startStudy(flashcards) {
        this.flashcards = [...flashcards].sort(() => Math.random() - 0.5);
        this.currentIndex = 0;
        this.updateCardCount();
        this.displayCurrentCard();
        this.ui.showSection('study');
    }

    // show current flashcard
    displayCurrentCard() {
        if (!this.flashcards.length) return;

        const flashcard = this.flashcards[this.currentIndex];
        const cardElement = document.getElementById('study-flashcard');
        cardElement.classList.remove('flipped');

        document.getElementById('study-front-content').textContent = flashcard.question;
        document.getElementById('study-back-content').textContent = flashcard.answer;

        flashcard.review();

        this.updateCardCount();
        document.getElementById('prev-card-btn').disabled = this.currentIndex === 0;
        document.getElementById('next-card-btn').disabled = this.currentIndex === this.flashcards.length - 1;
    }

    // flip card
    flipCard() {
        document.getElementById('study-flashcard').classList.toggle('flipped');
    }

    // next card
    nextCard() {
        if (this.currentIndex < this.flashcards.length - 1) {
            this.currentIndex++;
            this.displayCurrentCard();
        }
    }

    // previous card
    prevCard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.displayCurrentCard();
        }
    }

    // update the card count display
    updateCardCount() {
        document.getElementById('current-card').textContent = this.currentIndex + 1;
        document.getElementById('total-cards').textContent = this.flashcards.length;
    }

    // exit study mode
    exitStudy() {
        this.ui.showSection('topic');
    }
}

// button and flashcard styles
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
        content: 'click to flip';
        position: absolute;
        bottom: 10px;
        right: 10px;
        font-size: 0.8rem;
        color: var(--text-tertiary);
        opacity: 0.7;
    }
`;
document.head.appendChild(studyModeStyle);
