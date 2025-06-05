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
            // Always show dashboard on page load/refresh
            console.log('Showing dashboard on page load');
            this.updateDashboardContent();
            window.uiManager.showDashboard();
        } catch (error) {
            console.error('Error determining initial view:', error);
            // Fallback to dashboard
            this.updateDashboardContent();
            window.uiManager.showDashboard();
        }
    }

    updateGreeting() {
        const greetingElement = document.getElementById('user-greeting');
        if (greetingElement && this.user) {
            const timeOfDay = this.getTimeOfDay();
            greetingElement.textContent = `${timeOfDay}, ${this.user.username}!`;
        }
    }

    // Renamed from updateWelcomeScreen to updateDashboardContent to match new dashboard system
    updateDashboardContent() {
        const dashboardTitle = document.getElementById('dashboard-title');
        const dashboardSubtitle = document.getElementById('dashboard-subtitle');
        
        // The HTML provides default titles. We can personalize them here if user is logged in.
        if (dashboardTitle && this.user) {
            // The dashboard title is now handled by the UI manager's updateDashboard method
            // which dynamically sets welcome messages based on user status
            // We don't need to override it here as the new system is more comprehensive
        }
        
        // The subtitle in HTML is generic. We can update it if there are no items.
        if (dashboardSubtitle && this.stats) {
            // The dashboard subtitle is now handled by the UI manager's updateDashboard method
            // which provides better new user vs returning user experience
            // This fallback is kept for compatibility but shouldn't normally be needed
            if (this.stats.topic_count === 0 && this.stats.course_count === 0 && this.stats.flashcard_count === 0) {
                dashboardSubtitle.textContent = 'Ready to start your learning journey? Create your first topic or course below.';
            } else {
                // If user has content, they won't see the dashboard typically, but this is a fallback.
                dashboardSubtitle.textContent = 'Ready to continue your learning adventure?';
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
                    if (currentView === 'dashboard' && (this.stats.topic_count > 0 || this.stats.course_count > 0)) {
                        window.uiManager.showTopicsOverview();
                    } else if (currentView === 'dashboard') {
                         this.updateDashboardContent(); // Refresh dashboard text if still on it
                    }
                    // If on topics overview and all topics/courses are deleted, potentially switch to dashboard
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

        // Disabled backdrop click for delete account modal for consistency
        // Users can only close modal using the X button or Cancel button
        /*
        const deleteAccountModal = document.getElementById('delete-account-modal');

        if (deleteAccountModal) {
            deleteAccountModal.addEventListener('click', (e) => {
                if (e.target === deleteAccountModal) {
                    this.closeModal('delete-account-modal');
                }
            });
        }
        */
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

        // Clear any previous errors
        this.hideFormError('edit-profile-form');

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
        
        // Clear any previous errors
        this.hideFormError('change-password-form');

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
        
        // Clear any previous errors
        this.hideFormError('delete-account-form');

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

        // Clear any previous errors
        this.hideFormError('edit-profile-form');

        // Validate inputs
        if (!username || !email) {
            this.showFormError('edit-profile-form', 'Please fill in all required fields');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showFormError('edit-profile-form', 'Please enter a valid email address');
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
                this.showFormError('edit-profile-form', result.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.showFormError('edit-profile-form', 'Network error occurred');
        }
    }

    async handleChangePassword(e) {
        e.preventDefault();

        const currentPassword = document.getElementById('current-password-change').value;
        const newPassword = document.getElementById('new-password-change').value;
        const confirmNewPassword = document.getElementById('confirm-new-password-change').value;

        // Clear any previous errors
        this.hideFormError('change-password-form');

        // Validate inputs
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            this.showFormError('change-password-form', 'Please fill in all password fields');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            this.showFormError('change-password-form', 'New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            this.showFormError('change-password-form', 'New password must be at least 6 characters long');
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
                this.showFormError('change-password-form', result.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Password change error:', error);
            this.showFormError('change-password-form', 'Network error occurred');
        }
    }

    async handleDeleteAccount(e) {
        e.preventDefault();

        const password = document.getElementById('delete-password').value;
        const confirmation = document.getElementById('delete-confirmation').value;

        // Clear any previous errors
        this.hideFormError('delete-account-form');

        // Validate inputs
        if (!password) {
            this.showFormError('delete-account-form', 'Please enter your password');
            return;
        }

        if (confirmation !== 'DELETE') {
            this.showFormError('delete-account-form', 'Please type "DELETE" to confirm');
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
                this.closeModal('delete-account-modal');
                this.showNotification('Account deleted successfully', 'success');
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                this.showFormError('delete-account-form', result.message || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Account deletion error:', error);
            this.showFormError('delete-account-form', 'Network error occurred');
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

    showFormError(formId, message) {
        // Use the existing form error system from UIManager if available
        if (window.uiManager && window.uiManager.showFormError) {
            window.uiManager.showFormError(formId, message);
        } else {
            // Fallback: show error in the form's error container
            const errorElement = document.getElementById(`${formId}-error`);
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.remove('hidden');
            } else {
                alert(message);
            }
        }
    }

    hideFormError(formId) {
        // Use the existing form error system from UIManager if available
        if (window.uiManager && window.uiManager.hideFormError) {
            window.uiManager.hideFormError(formId);
        } else {
            // Fallback: hide error in the form's error container
            const errorElement = document.getElementById(`${formId}-error`);
            if (errorElement) {
                errorElement.classList.add('hidden');
            }
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