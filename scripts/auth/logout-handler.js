// Función para inicializar el botón de cierre de sesión
export function initializeLogoutButton() {
    // Crear el botón de cierre de sesión
    const logoutButton = document.createElement('button');
    logoutButton.id = 'app-logout-button';
    logoutButton.className = 'btn-icon';
    logoutButton.title = 'Cerrar sesión';
    logoutButton.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
    
    // Agregar manejador de eventos
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        // Redirigir a la página de inicio de sesión
        window.location.href = '../../login.html';
    });
    
    // Buscar el contenedor de acciones del encabezado
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
        // Verificar si ya existe un botón de cierre de sesión
        const existingButton = document.getElementById('app-logout-button');
        if (!existingButton) {
            headerActions.appendChild(logoutButton);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initializeLogoutButton();
});
