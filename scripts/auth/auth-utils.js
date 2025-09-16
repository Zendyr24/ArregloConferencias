// Utility functions for authentication
export function getCurrentUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
}

export function isAuthenticated() {
    const user = getCurrentUser();
    if (!user) return false;
    
    // Check if session is expired (24 hours)
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const now = new Date().getTime();
    return (now - user.timestamp) < sessionDuration;
}

export function updateUserInfo() {
    const user = getCurrentUser();
    const userEmailElement = document.querySelector('.user-name');
    const userRoleElement = document.querySelector('.user-role');
    
    if (userEmailElement && user) {
        userEmailElement.textContent = user.email || 'Usuario';
    }
    if (userRoleElement && user) {
        userRoleElement.textContent = user.rol || 'Administrador';
    }
}

export function redirectToLogin() {
    // para producción
    //window.location.href = './../login.html';
    // para desarrollo
    window.location.href = './login.html';
}
