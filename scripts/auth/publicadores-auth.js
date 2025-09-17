import { isAuthenticated, updateUserInfo, redirectToLogin } from './auth-utils.js';

// Check authentication status when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
        redirectToLogin();
    } else {
        updateUserInfo();
        
        // Add logout functionality
        const logoutButton = document.querySelector('.btn-icon[title="Cerrar sesión"]');
        if (!logoutButton) {
            const headerActions = document.querySelector('.header-actions');
            if (headerActions) {
                const newLogoutButton = document.createElement('button');
                newLogoutButton.className = 'btn-icon';
                newLogoutButton.title = 'Cerrar sesión';
                newLogoutButton.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
                newLogoutButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('user');
                    // para producción
                    window.location.href = './../login.html';
                    // para desarrollo
                    //window.location.href = '/login.html';
                });
                headerActions.appendChild(newLogoutButton);
            }
        }
    }
});
