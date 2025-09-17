import { isAuthenticated, updateUserInfo, redirectToLogin } from './auth-utils.js';
import { initializeLogoutButton } from './logout-handler.js';

// Check authentication status when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
        redirectToLogin();
    } else {
        updateUserInfo();
        initializeLogoutButton();
    }
});
