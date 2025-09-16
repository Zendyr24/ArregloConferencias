import { isAuthenticated, updateUserInfo, redirectToLogin } from './auth-utils.js';

// Check authentication status when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
        redirectToLogin();
    } else {
        updateUserInfo();
        
        // Add logout functionality
        const logoutButton = document.querySelector('.btn-icon[title="Configuración"]');
        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('user');
                // para producción
                //window.location.href = './../login.html';
                // para desarrollo
                window.location.href = '/login.html';
            });
        }
    }
});
