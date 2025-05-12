/**
 * Main application script that initializes modules and handles animations
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the theme
    initTheme();
    
    // Initialize all modules
    const app = initializeApp();
    
    // Set up UI animations and interactions
    setupUIAnimations();
});

/**
 * Initializes the application by connecting all modules
 * @returns {Object} The application instance
 */
function initializeApp() {
    // Initialize the storage manager
    const storage = new StorageManager();
    
    // Initialize UI manager
    const ui = new UIManager();
    
    // Initialize managers with dependencies
    const coursesManager = new CoursesManager(storage, ui);
    const topicsManager = new TopicsManager(storage, ui);
    const flashcardsManager = new FlashcardsManager(storage, ui);
    const studyMode = new StudyMode(ui);
    
    // Set up manager references
    topicsManager.setCoursesManager(coursesManager);
    flashcardsManager.setTopicsManager(topicsManager);
    
    // Load initial data
    coursesManager.loadCourses();
    
    // Connect search functionality
    setupSearch(coursesManager, topicsManager, flashcardsManager);
    
    return {
        storage,
        ui,
        coursesManager,
        topicsManager,
        flashcardsManager,
        studyMode
    };
}

/**
 * Sets up theme switching functionality
 */
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme or use system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Toggle theme when button is clicked
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        
        // Add animation to the icon
        themeToggle.querySelector('i').classList.add('fa-spin');
        setTimeout(() => {
            themeToggle.querySelector('i').classList.remove('fa-spin');
        }, 300);
    });
}

/**
 * Sets up search functionality
 */
function setupSearch(coursesManager, topicsManager, flashcardsManager) {
    const searchInput = document.getElementById('search-input');
    
    searchInput.addEventListener('input', debounce(function() {
        const searchTerm = this.value.trim().toLowerCase();
        if (searchTerm.length >= 2) {
            const results = {
                courses: coursesManager.searchCourses(searchTerm),
                topics: topicsManager.searchTopics(searchTerm),
                flashcards: flashcardsManager.searchFlashcards(searchTerm)
            };
            
            // Highlight search results in the UI
            highlightSearchResults(results, searchTerm);
        } else {
            // Clear any search highlighting
            clearSearchHighlighting();
        }
    }, 300));
}

/**
 * Highlights search results in the UI
 */
function highlightSearchResults(results, searchTerm) {
    clearSearchHighlighting();
    
    // Highlight courses
    results.courses.forEach(course => {
        const courseElement = document.querySelector(`.course-item[data-id="${course.id}"]`);
        if (courseElement) {
            courseElement.classList.add('search-result');
            highlightText(courseElement.querySelector('.course-item-title'), searchTerm);
        }
    });
    
    // Highlight topics
    results.topics.forEach(topic => {
        const topicElement = document.querySelector(`.topic-card[data-id="${topic.id}"]`);
        if (topicElement) {
            topicElement.classList.add('search-result');
            highlightText(topicElement.querySelector('.topic-card-title'), searchTerm);
        }
    });
    
    // Highlight flashcards
    results.flashcards.forEach(flashcard => {
        const flashcardElement = document.querySelector(`.flashcard-item[data-id="${flashcard.id}"]`);
        if (flashcardElement) {
            flashcardElement.classList.add('search-result');
            highlightText(flashcardElement.querySelector('.flashcard-question'), searchTerm);
            highlightText(flashcardElement.querySelector('.flashcard-answer'), searchTerm);
        }
    });
}

/**
 * Highlights text within an element that matches a search term
 */
function highlightText(element, searchTerm) {
    if (!element) return;
    
    const originalText = element.textContent;
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    const highlightedText = originalText.replace(regex, '<span class="highlight">$1</span>');
    
    // Store the original text
    element.setAttribute('data-original-text', originalText);
    element.innerHTML = highlightedText;
}

/**
 * Clears search highlighting
 */
function clearSearchHighlighting() {
    // Remove search-result class from all elements
    document.querySelectorAll('.search-result').forEach(el => {
        el.classList.remove('search-result');
    });
    
    // Restore original text for highlighted elements
    document.querySelectorAll('[data-original-text]').forEach(el => {
        el.textContent = el.getAttribute('data-original-text');
        el.removeAttribute('data-original-text');
    });
}

/**
 * Sets up UI animations and interactions
 */
function setupUIAnimations() {
    // Add entrance animations to items when they appear
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe course items, topic cards, and flashcards for animation
    function observeElements() {
        document.querySelectorAll('.course-item, .topic-card, .flashcard-item').forEach(el => {
            if (!el.classList.contains('animated')) {
                fadeObserver.observe(el);
            }
        });
    }
    
    // Set up mutation observer to watch for new elements
    const contentObserver = new MutationObserver((mutations) => {
        let shouldObserve = false;
        
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                shouldObserve = true;
            }
        });
        
        if (shouldObserve) {
            setTimeout(observeElements, 100);
        }
    });
    
    // Start observing the content container
    contentObserver.observe(document.querySelector('.content-container'), {
        childList: true,
        subtree: true
    });
    
    // Initial observation
    setTimeout(observeElements, 500);
    
    // Add card hover effects
    document.addEventListener('mouseover', (e) => {
        // Topic card hover effect
        if (e.target.closest('.topic-card')) {
            const card = e.target.closest('.topic-card');
            const randomDeg = Math.random() * 2 - 1; // Random value between -1 and 1
            card.style.transform = `translateY(-4px) rotate(${randomDeg}deg)`;
        }
    }, true);
    
    document.addEventListener('mouseout', (e) => {
        // Reset topic card hover effect
        if (e.target.closest('.topic-card')) {
            const card = e.target.closest('.topic-card');
            card.style.transform = '';
        }
    }, true);
    
    // Add ripple effect to buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 2;
            
            // Create ripple element
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            ripple.style.width = `${size}px`;
            ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size/2}px`;
            ripple.style.top = `${e.clientY - rect.top - size/2}px`;
            
            this.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

/**
 * Helper function to debounce function calls
 */
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

/**
 * Helper function to escape regex special characters
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    .animated {
        animation: slideIn 0.5s ease-out forwards;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: rippleEffect 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes rippleEffect {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    .highlight {
        background-color: var(--accent-500);
        color: white;
        padding: 0 2px;
        border-radius: 2px;
    }
    
    .search-result {
        border-color: var(--accent-500) !important;
        box-shadow: 0 0 0 2px var(--accent-500) !important;
    }
    
    .course-item, .topic-card, .flashcard-item {
        opacity: 0;
        transform: translateX(20px);
    }
    
    button:not(.animated) {
        position: relative;
        overflow: hidden;
    }
`;

document.head.appendChild(style);