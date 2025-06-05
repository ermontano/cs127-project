/**
 * main application script that initializes modules and handles animations
 */
document.addEventListener('DOMContentLoaded', () => {
    // initialize the theme
    initTheme();
    
    // The app initialization is now handled by individual managers
    // and the main auth system in index.html
    // initializeApp(); // DISABLED - conflicts with proper initialization
    
    // set up ui animations and interactions
    setupUIAnimations();
    
    // set up search functionality (will wait for global managers to be available)
    setupSearch();
});

/**
 * initializes the application by connecting all modules
 * DISABLED - This function conflicts with the proper initialization system
 * Each manager now initializes itself through DOMContentLoaded listeners
 */
async function initializeApp() {
    // DISABLED TO PREVENT CONFLICTS
    // The managers are now initialized by their own DOMContentLoaded listeners
    // which prevents duplicate instances and conflicting event listeners
    console.log('initializeApp disabled - using individual manager initialization');
    return;
    
    /* ORIGINAL CODE COMMENTED OUT
    try {
        // initialize the storage manager
        const storage = window.storageManager || new StorageManager();
        
        // initialize ui manager
        const ui = new UIManager();
        
        // initialize managers with dependencies
        const coursesManager = new CoursesManager(storage, ui);
        const topicsManager = new TopicsManager(storage, ui);
        const flashcardsManager = new FlashcardsManager(storage, ui);
        
        // set up manager references
        coursesManager.setTopicsManager(topicsManager);
        topicsManager.setCoursesManager(coursesManager);
        topicsManager.setFlashcardsManager(flashcardsManager);
        flashcardsManager.setTopicsManager(topicsManager);
        
        // Test database connectivity and load initial data
        ui.showNotification('Connecting to database...', 'info');
        
        try {
            await coursesManager.loadCourses();
            ui.showNotification('Connected to database successfully!', 'success');
        } catch (error) {
            console.error('Database connection failed:', error);
            ui.showNotification('Failed to connect to database. Please check your connection and try refreshing the page.', 'error');
            ui.showSection('dashboard');
        }
        
        // connect search functionality
        setupSearch(coursesManager, topicsManager, flashcardsManager);
        
        // store global reference for debugging
        window.app = {
            storage,
            ui,
            coursesManager,
            topicsManager,
            flashcardsManager
        };
        
        return window.app;
    } catch (error) {
        console.error('Failed to initialize app:', error);
        const ui = new UIManager();
        ui.showNotification('Failed to initialize application', 'error');
    }
    */
}

/**
 * sets up theme switching functionality
 */
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // check for saved theme or use system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // toggle theme when button is clicked
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        
        // add animation to the icon
        themeToggle.querySelector('i').classList.add('fa-spin');
        setTimeout(() => {
            themeToggle.querySelector('i').classList.remove('fa-spin');
        }, 300);
    });
}

/**
 * sets up search functionality
 */
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear');
    const searchContainer = searchInput?.parentElement;
    
    if (!searchInput || !searchClearBtn || !searchContainer) return;
    
    // Handle search input
    searchInput.addEventListener('input', debounce(async function() {
        const searchTerm = this.value.trim().toLowerCase();
        console.log('Search input:', searchTerm);
        
        // Toggle clear button visibility
        if (searchTerm.length > 0) {
            searchContainer.classList.add('has-text');
            searchClearBtn.classList.remove('hidden');
        } else {
            searchContainer.classList.remove('has-text');
            searchClearBtn.classList.add('hidden');
        }
        
        if (searchTerm.length >= 2) {
            try {
                // Use global managers if available
                const results = {};
                
                if (window.coursesManager) {
                    results.courses = await window.coursesManager.searchCourses(searchTerm);
                    console.log('Course search results:', results.courses);
                }
                if (window.topicsManager) {
                    results.topics = await window.topicsManager.searchTopics(searchTerm);
                    console.log('Topic search results:', results.topics);
                }
                if (window.flashcardsManager) {
                    results.flashcards = await window.flashcardsManager.searchFlashcards(searchTerm);
                    console.log('Flashcard search results:', results.flashcards);
                }
                
                console.log('All search results:', results);
                
                // highlight search results in the ui
                highlightSearchResults(results, searchTerm);
            } catch (error) {
                console.error('Search failed:', error);
            }
        } else {
            // clear any search highlighting
            clearSearchHighlighting();
        }
    }, 300));
    
    // Handle clear button click
    searchClearBtn.addEventListener('click', function() {
        searchInput.value = '';
        searchContainer.classList.remove('has-text');
        searchClearBtn.classList.add('hidden');
        clearSearchHighlighting();
        searchInput.focus(); // Keep focus on input after clearing
    });
}

/**
 * highlights search results in the ui
 */
function highlightSearchResults(results, searchTerm) {
    clearSearchHighlighting();
    
    // highlight courses (check both sidebar and management view selectors)
    results.courses?.forEach(course => {
        // Try sidebar view first (.course-item)
        let courseElement = document.querySelector(`.course-item[data-id="${course.id}"]`);
        let titleSelector = '.course-item-title';
        
        // If not found, try management view (.course-item-card)
        if (!courseElement) {
            courseElement = document.querySelector(`.course-item-card[data-id="${course.id}"]`);
            titleSelector = '.course-item-title'; // Same title selector for both views
        }
        
        if (courseElement) {
            courseElement.classList.add('search-result');
            const titleElement = courseElement.querySelector(titleSelector);
            if (titleElement) {
                highlightText(titleElement, searchTerm);
            }
        }
    });
    
    // highlight topics
    results.topics?.forEach(topic => {
        const topicElement = document.querySelector(`.topic-card[data-id="${topic.id}"]`);
        if (topicElement) {
            topicElement.classList.add('search-result');
            const titleElement = topicElement.querySelector('.topic-card-title');
            if (titleElement) {
                highlightText(titleElement, searchTerm);
            }
        }
    });
    
    // highlight flashcards
    results.flashcards?.forEach(flashcard => {
        const flashcardElement = document.querySelector(`.flashcard-item[data-id="${flashcard.id}"]`);
        if (flashcardElement) {
            flashcardElement.classList.add('search-result');
            const questionElement = flashcardElement.querySelector('.flashcard-question');
            const answerElement = flashcardElement.querySelector('.flashcard-answer');
            if (questionElement) {
                highlightText(questionElement, searchTerm);
            }
            if (answerElement) {
                highlightText(answerElement, searchTerm);
            }
        }
    });
}

/**
 * highlights text within an element that matches a search term
 */
function highlightText(element, searchTerm) {
    if (!element) return;
    
    const originalText = element.textContent;
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    const highlightedText = originalText.replace(regex, '<span class="highlight">$1</span>');
    
    // store the original text
    element.setAttribute('data-original-text', originalText);
    element.innerHTML = highlightedText;
}

/**
 * clears search highlighting
 */
function clearSearchHighlighting() {
    // remove search-result class from all elements
    document.querySelectorAll('.search-result').forEach(el => {
        el.classList.remove('search-result');
    });
    
    // restore original text for highlighted elements
    document.querySelectorAll('[data-original-text]').forEach(el => {
        el.textContent = el.getAttribute('data-original-text');
        el.removeAttribute('data-original-text');
    });
}

/**
 * sets up ui animations and interactions
 */
function setupUIAnimations() {
    // add entrance animations to items when they appear
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
    
    // observe course items, topic cards, and flashcards for animation
    function observeElements() {
        document.querySelectorAll('.course-item, .topic-card, .flashcard-item').forEach(el => {
            if (!el.classList.contains('animated')) {
                fadeObserver.observe(el);
            }
        });
    }
    
    // set up mutation observer to watch for new elements
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
    
    // start observing the content container
    contentObserver.observe(document.querySelector('.content-container'), {
        childList: true,
        subtree: true
    });
    
    // initial observation
    setTimeout(observeElements, 500);
    
    // add card hover effects
    document.addEventListener('mouseover', (e) => {
        // Skip if we're in study mode to prevent conflicts
        if (document.getElementById('study-mode') && !document.getElementById('study-mode').classList.contains('hidden')) {
            return;
        }
        
        // topic card hover effect
        if (e.target.closest('.topic-card')) {
            const card = e.target.closest('.topic-card');
            const randomDeg = Math.random() * 2 - 1; // random value between -1 and 1
            card.style.transform = `translateY(-4px) rotate(${randomDeg}deg)`;
        }
    }, true);
    
    document.addEventListener('mouseout', (e) => {
        // Skip if we're in study mode to prevent conflicts
        if (document.getElementById('study-mode') && !document.getElementById('study-mode').classList.contains('hidden')) {
            return;
        }
        
        // reset topic card hover effect
        if (e.target.closest('.topic-card')) {
            const card = e.target.closest('.topic-card');
            card.style.transform = '';
        }
    }, true);
    
    // add ripple effect to buttons
    function addRippleToButton(button) {
        // Skip ripple effect for modal-related buttons and study mode buttons to prevent conflicts
        if (button.classList.contains('edit-flashcard-btn') || 
            button.classList.contains('delete-flashcard-btn') ||
            button.classList.contains('close-button') ||
            button.classList.contains('icon-button') ||
            button.classList.contains('action-menu-trigger') ||
            button.classList.contains('action-menu-item') ||
            button.id.includes('modal') ||
            button.closest('.modal') ||
            button.closest('.flashcard-actions') ||
            button.closest('.action-menu') ||
            button.closest('.study-mode') ||  // Exclude study mode buttons
            button.id.includes('flip-card') ||
            button.id.includes('next-card') ||
            button.id.includes('prev-card') ||
            button.id.includes('exit-study')) {
            return;
        }
        
        button.addEventListener('click', function(e) {            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 2;
            
            // create ripple element
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            ripple.style.width = `${size}px`;
            ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size/2}px`;
            ripple.style.top = `${e.clientY - rect.top - size/2}px`;
            
            this.appendChild(ripple);
            
            // remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }
    
    // Apply to existing buttons
    document.querySelectorAll('button').forEach(addRippleToButton);
    
    // Watch for new buttons being added
    const buttonObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    if (node.tagName === 'BUTTON') {
                        addRippleToButton(node);
                    }
                    // Also check for buttons within added elements
                    node.querySelectorAll && node.querySelectorAll('button').forEach(addRippleToButton);
                }
            });
        });
    });
    
    buttonObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * helper function to debounce function calls
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
 * helper function to escape regex special characters
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// add css for animations
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
