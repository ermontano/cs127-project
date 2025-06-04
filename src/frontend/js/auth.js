// Authentication manager for the main app
class AuthManager {
    constructor() {
        this.user = null;
        this.stats = null;
        this.init();
    }

    async init() {
        await this.loadUserData();
        this.setupEventListeners();
        this.updateUI();
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
        if (!this.user) return;

        // Update greeting
        this.updateGreeting();
        
        // Update welcome screen
        this.updateWelcomeScreen();
        
        // Update stats
        this.updateStats();
    }

    updateGreeting() {
        const greetingElement = document.getElementById('user-greeting');
        if (greetingElement && this.user) {
            const timeOfDay = this.getTimeOfDay();
            greetingElement.textContent = `${timeOfDay}, ${this.user.username}!`;
        }
    }

    updateWelcomeScreen() {
        const welcomeTitle = document.getElementById('welcome-title');
        const welcomeSubtitle = document.getElementById('welcome-subtitle');
        
        if (welcomeTitle && this.user) {
            welcomeTitle.textContent = `Welcome back, ${this.user.username}!`;
        }
        
        if (welcomeSubtitle && this.stats) {
            if (this.stats.coursesCount > 0) {
                welcomeSubtitle.textContent = `You have ${this.stats.coursesCount} course${this.stats.coursesCount !== 1 ? 's' : ''}, ${this.stats.topicsCount} topic${this.stats.topicsCount !== 1 ? 's' : ''}, and ${this.stats.flashcardsCount} flashcard${this.stats.flashcardsCount !== 1 ? 's' : ''}.`;
            } else {
                welcomeSubtitle.textContent = 'Ready to create your first course and start studying?';
            }
        }
    }

    updateStats() {
        if (!this.stats) return;

        const coursesCount = document.getElementById('courses-count');
        const topicsCount = document.getElementById('topics-count');
        const flashcardsCount = document.getElementById('flashcards-count');

        if (coursesCount) coursesCount.textContent = this.stats.coursesCount || 0;
        if (topicsCount) topicsCount.textContent = this.stats.topicsCount || 0;
        if (flashcardsCount) flashcardsCount.textContent = this.stats.flashcardsCount || 0;
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
                this.updateStats();
                this.updateWelcomeScreen();
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
    window.authManager = new AuthManager();
}); 