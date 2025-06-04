// Authentication manager for the main app
class AuthManager {
    constructor() {
        this.user = null;
        this.stats = null;
        this.init();
    }

    async init() {
        // Check if auth check is already in progress from the main script
        if (window.authCheckInProgress) {
            return; // Skip initialization, main script will handle auth
        }
        
        await this.loadUserData();
        // Initialize UIManager here if not already done by the main script
        // This ensures uiManager is available before updateUI is called.
        if (!window.uiManager && this.isAuthenticated()) {
            window.uiManager = new UIManager();
        }
        this.setupEventListeners();
        this.updateUI(); // This will now decide the initial view
    }

    async loadUserData() {
        try {
            const response = await fetch('/api/auth/me');
            const result = await response.json();

            if (result.success) {
                this.user = result.user;
                this.stats = result.stats;
            } else {
                // If user data loading fails, redirect to auth
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
            window.location.href = '/';
        }
    }

    setupEventListeners() {
        // User menu toggle
        const userMenuToggle = document.getElementById('user-menu-toggle');
        const userDropdown = document.getElementById('user-dropdown');

        if (userMenuToggle) {
            userMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                userDropdown.classList.add('hidden');
            }
        });

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.logout.bind(this));
        }
    }

    updateUI() {
        if (!this.user || !window.uiManager) {
            // If user is null (e.g. failed loadUserData or not authenticated), 
            // or uiManager is not ready, do nothing here. 
            // Redirection or showing auth page is handled by loadUserData or the main index.html script.
            return;
        }

        // Update greeting, user menu stats etc.
        this.updateGreeting();
        this.updateStats(); // Populates the user dropdown stats

        // Decide initial view based on existing content
        // First, let's wait a bit to ensure managers are initialized
        setTimeout(() => {
            this.determineInitialView();
        }, 500);
    }

    async determineInitialView() {
        if (!window.uiManager) return;

        try {
            // Check if user has any content
            let hasContent = false;
            
            if (this.stats && (this.stats.topic_count > 0 || this.stats.course_count > 0)) {
                hasContent = true;
            } else {
                // If stats don't show content, double-check by directly querying
                if (window.storageManager) {
                    const [courses, topics] = await Promise.all([
                        window.storageManager.getCourses().catch(() => []),
                        window.storageManager.getAllTopics().catch(() => [])
                    ]);
                    
                    if (courses.length > 0 || topics.length > 0) {
                        hasContent = true;
                        // Update stats since they might be outdated
                        await this.refreshStats();
                    }
                }
            }

            if (hasContent) {
                console.log('User has content, showing topics overview');
                window.uiManager.showTopicsOverview();
            } else {
                console.log('User has no content, showing welcome screen');
                this.updateWelcomeScreenContent();
                window.uiManager.showWelcomeScreen();
            }
        } catch (error) {
            console.error('Error determining initial view:', error);
            // Fallback to welcome screen
            this.updateWelcomeScreenContent();
            window.uiManager.showWelcomeScreen();
        }
    }

    updateGreeting() {
        const greetingElement = document.getElementById('user-greeting');
        if (greetingElement && this.user) {
            const timeOfDay = this.getTimeOfDay();
            greetingElement.textContent = `${timeOfDay}, ${this.user.username}!`;
        }
    }

    // Renamed from updateWelcomeScreen to updateWelcomeScreenContent to avoid confusion
    updateWelcomeScreenContent() {
        const welcomeTitle = document.getElementById('welcome-title');
        const welcomeSubtitle = document.getElementById('welcome-subtitle');
        
        // The HTML provides default titles. We can personalize them here if user is logged in.
        if (welcomeTitle && this.user) {
            // Prepend to existing generic title, or replace. For now, let's prepend.
            // welcomeTitle.textContent = `Hello, ${this.user.username}! Organize Your Knowledge`; 
            // Or, if there's a dedicated spot for username:
            // const userSpecificGreeting = document.getElementById('user-specific-greeting-on-welcome');
            // if(userSpecificGreeting) userSpecificGreeting.textContent = `Welcome back, ${this.user.username}!`;
            // For now, let's keep the generic titles from HTML if they are better suited for the new design
            // and only update if there are specific dynamic parts needed from auth.js
        }
        
        // The subtitle in HTML is generic. We can update it if there are no items.
        if (welcomeSubtitle && this.stats) {
            if (this.stats.topic_count === 0 && this.stats.course_count === 0 && this.stats.flashcard_count === 0) {
                welcomeSubtitle.textContent = 'Ready to create your first topic or course and start learning?';
            } else {
                // If user has content, they won't see the welcome screen typically, but this is a fallback.
                welcomeSubtitle.textContent = 'Continue your learning journey by exploring your topics and courses.';
            }
        }
    }

    updateStats() {
        if (!this.stats) return;

        const coursesCount = document.getElementById('courses-count');
        const topicsCount = document.getElementById('topics-count');
        const flashcardsCount = document.getElementById('flashcards-count');

        // Backend returns snake_case field names
        if (coursesCount) coursesCount.textContent = this.stats.course_count || 0;
        if (topicsCount) topicsCount.textContent = this.stats.topic_count || 0;
        if (flashcardsCount) flashcardsCount.textContent = this.stats.flashcard_count || 0;
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        
        if (hour < 12) {
            return 'Good morning';
        } else if (hour < 18) {
            return 'Good afternoon';
        } else {
            return 'Good evening';
        }
    }

    async logout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST'
            });

            const result = await response.json();
            
            if (result.success) {
                // Redirect to auth page
                window.location.href = '/';
            } else {
                console.error('Logout failed:', result.message);
                // Force redirect anyway
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect anyway
            window.location.href = '/';
        }
    }

    // Method to refresh stats after course/topic/flashcard operations
    async refreshStats() {
        try {
            const response = await fetch('/api/auth/me');
            const result = await response.json();

            if (result.success) {
                this.stats = result.stats;
                this.updateStats(); // Updates user menu stats
                // After refreshing stats, we might need to update the current view if it depends on these stats
                // For example, if on welcome screen and stats now show items, switch to topics overview
                if (window.uiManager) {
                    const currentView = window.uiManager.getCurrentView(); // Assumes uiManager has such a method
                    if (currentView === 'welcome' && (this.stats.topic_count > 0 || this.stats.course_count > 0)) {
                        window.uiManager.showTopicsOverview();
                    } else if (currentView === 'welcome') {
                         this.updateWelcomeScreenContent(); // Refresh welcome screen text if still on it
                    }
                    // If on topics overview and all topics/courses are deleted, potentially switch to welcome screen
                    // This needs careful handling to avoid unexpected view changes.
                }
            }
        } catch (error) {
            console.error('Failed to refresh stats:', error);
        }
    }

    // Getter methods for other parts of the app
    getUser() {
        return this.user;
    }

    getStats() {
        return this.stats;
    }

    isAuthenticated() {
        return this.user !== null;
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only auto-initialize if no auth check is in progress by index.html
    if (!window.authCheckInProgress && !window.authManager) {
        window.authManager = new AuthManager();
    }
    // The UIManager initialization is now more tightly coupled with AuthManager's init 
    // or the main script block in index.html after successful auth check.
}); 