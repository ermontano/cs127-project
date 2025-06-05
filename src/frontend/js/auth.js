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

        // Edit Profile button
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                userDropdown.classList.add('hidden'); // Close dropdown
                this.openEditProfileModal();
            });
        }

        // Change Password button
        const changePasswordBtn = document.getElementById('change-password-btn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                userDropdown.classList.add('hidden'); // Close dropdown
                this.openChangePasswordModal();
            });
        }

        // Delete Account button
        const deleteAccountBtn = document.getElementById('delete-account-btn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => {
                userDropdown.classList.add('hidden'); // Close dropdown
                this.openDeleteAccountModal();
            });
        }

        // Edit Profile form
        const editProfileForm = document.getElementById('edit-profile-form');
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', this.handleEditProfile.bind(this));
        }

        // Change Password form
        const changePasswordForm = document.getElementById('change-password-form');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', this.handleChangePassword.bind(this));
        }

        // Delete Account form
        const deleteAccountForm = document.getElementById('delete-account-form');
        if (deleteAccountForm) {
            deleteAccountForm.addEventListener('submit', this.handleDeleteAccount.bind(this));
        }

        // Modal close buttons
        this.setupModalCloseHandlers();
        
        // Setup password toggles
        this.setupPasswordToggles();
    }

    setupPasswordToggles() {
        // Add event listeners for all password toggle buttons
        const passwordToggles = document.querySelectorAll('.password-toggle');
        
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent form submission
                
                const targetId = toggle.getAttribute('data-target');
                const passwordInput = document.getElementById(targetId);
                const icon = toggle.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
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

    // Account management methods
    setupModalCloseHandlers() {
        // Close buttons for account management modals
        const editProfileCloseBtn = document.getElementById('close-edit-profile-modal');
        const changePasswordCloseBtn = document.getElementById('close-change-password-modal');
        const deleteAccountCloseBtn = document.getElementById('close-delete-account-modal');
        const cancelEditProfileBtn = document.getElementById('cancel-edit-profile-btn');
        const cancelChangePasswordBtn = document.getElementById('cancel-change-password-btn');
        const cancelDeleteAccountBtn = document.getElementById('cancel-delete-account-btn');

        if (editProfileCloseBtn) {
            editProfileCloseBtn.addEventListener('click', () => this.closeModal('edit-profile-modal'));
        }
        if (changePasswordCloseBtn) {
            changePasswordCloseBtn.addEventListener('click', () => this.closeModal('change-password-modal'));
        }
        if (deleteAccountCloseBtn) {
            deleteAccountCloseBtn.addEventListener('click', () => this.closeModal('delete-account-modal'));
        }
        if (cancelEditProfileBtn) {
            cancelEditProfileBtn.addEventListener('click', () => this.closeModal('edit-profile-modal'));
        }
        if (cancelChangePasswordBtn) {
            cancelChangePasswordBtn.addEventListener('click', () => this.closeModal('change-password-modal'));
        }
        if (cancelDeleteAccountBtn) {
            cancelDeleteAccountBtn.addEventListener('click', () => this.closeModal('delete-account-modal'));
        }

        // Close modals when clicking backdrop - only for delete account modal
        const deleteAccountModal = document.getElementById('delete-account-modal');

        if (deleteAccountModal) {
            deleteAccountModal.addEventListener('click', (e) => {
                if (e.target === deleteAccountModal) {
                    this.closeModal('delete-account-modal');
                }
            });
        }
    }

    openEditProfileModal() {
        const modal = document.getElementById('edit-profile-modal');
        const usernameInput = document.getElementById('edit-username');
        const emailInput = document.getElementById('edit-email');

        // Pre-fill current user data
        if (this.user) {
            usernameInput.value = this.user.username;
            emailInput.value = this.user.email;
        }

        // Show modal
        modal.classList.add('show');
        setTimeout(() => { 
            modal.style.opacity = '1'; 
            usernameInput.focus();
        }, 10);
    }

    openChangePasswordModal() {
        const modal = document.getElementById('change-password-modal');
        const currentPasswordInput = document.getElementById('current-password-change');
        const newPasswordInput = document.getElementById('new-password-change');
        const confirmNewPasswordInput = document.getElementById('confirm-new-password-change');
        const passwordRequirements = document.getElementById('password-requirements');

        // Clear all password fields
        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmNewPasswordInput.value = '';
        passwordRequirements.classList.add('hidden');

        // Show password requirements when user starts typing
        newPasswordInput.addEventListener('input', () => {
            if (newPasswordInput.value.length > 0) {
                passwordRequirements.classList.remove('hidden');
                if (newPasswordInput.value.length >= 6) {
                    passwordRequirements.style.color = 'var(--success-500)';
                    passwordRequirements.textContent = '✓ Password meets requirements';
                } else {
                    passwordRequirements.style.color = 'var(--warning-500)';
                    passwordRequirements.textContent = 'Password must be at least 6 characters long';
                }
            } else {
                passwordRequirements.classList.add('hidden');
            }
        });

        // Show modal
        modal.classList.add('show');
        setTimeout(() => { 
            modal.style.opacity = '1';
            currentPasswordInput.focus();
        }, 10);
    }

    openDeleteAccountModal() {
        const modal = document.getElementById('delete-account-modal');
        const passwordInput = document.getElementById('delete-password');
        const confirmationInput = document.getElementById('delete-confirmation');

        // Clear form
        passwordInput.value = '';
        confirmationInput.value = '';

        // Show modal
        modal.classList.add('show');
        setTimeout(() => { 
            modal.style.opacity = '1';
            passwordInput.focus();
        }, 10);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => { 
                modal.classList.remove('show'); 
            }, 300);
        }
    }

    async handleEditProfile(e) {
        e.preventDefault();

        const username = document.getElementById('edit-username').value.trim();
        const email = document.getElementById('edit-email').value.trim();

        // Validate inputs
        if (!username || !email) {
            // Show error in form or page alert
            window.uiManager?.showPageAlert('Please fill in all required fields', 'error') || alert('Please fill in all required fields');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            window.uiManager?.showPageAlert('Please enter a valid email address', 'error') || alert('Please enter a valid email address');
            return;
        }

        try {
            const response = await fetch('/api/auth/update-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email
                })
            });

            const result = await response.json();

            if (result.success) {
                this.user = result.user;
                this.updateGreeting();
                this.closeModal('edit-profile-modal');
                window.uiManager?.showToast('Profile updated successfully!', 'success') || alert('Profile updated successfully!');
            } else {
                this.showNotification(result.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.showNotification('Network error occurred', 'error');
        }
    }

    async handleChangePassword(e) {
        e.preventDefault();

        const currentPassword = document.getElementById('current-password-change').value;
        const newPassword = document.getElementById('new-password-change').value;
        const confirmNewPassword = document.getElementById('confirm-new-password-change').value;

        // Validate inputs
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            this.showNotification('Please fill in all password fields', 'error');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            this.showNotification('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showNotification('New password must be at least 6 characters long', 'error');
            return;
        }

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const result = await response.json();

            if (result.success) {
                this.closeModal('change-password-modal');
                this.showNotification('Password changed successfully!', 'success');
            } else {
                this.showNotification(result.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('Password change error:', error);
            this.showNotification('Network error occurred', 'error');
        }
    }

    async handleDeleteAccount(e) {
        e.preventDefault();

        const password = document.getElementById('delete-password').value;
        const confirmation = document.getElementById('delete-confirmation').value;

        // Validate inputs
        if (!password) {
            this.showNotification('Please enter your password', 'error');
            return;
        }

        if (confirmation !== 'DELETE') {
            this.showNotification('Please type "DELETE" to confirm', 'error');
            return;
        }

        try {
            const response = await fetch('/api/auth/delete-account', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Account deleted successfully', 'success');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                this.showNotification(result.message || 'Failed to delete account', 'error');
            }
        } catch (error) {
            console.error('Account deletion error:', error);
            this.showNotification('Network error occurred', 'error');
        }
    }

    showNotification(message, type) {
        // Use the existing notification system from UIManager if available
        if (window.uiManager && window.uiManager.showNotification) {
            window.uiManager.showNotification(message, type);
        } else {
            // Fallback: simple alert
            alert(message);
        }
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