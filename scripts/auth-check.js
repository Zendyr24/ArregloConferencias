// Verificar si el usuario está autenticado
export function checkAuth() {
  // Obtener datos del usuario
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Verificar si hay un usuario logueado y si la sesión es reciente (menos de 24 horas)
  if (userData && userData.timestamp) {
    const sessionAge = Date.now() - userData.timestamp;
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 horas
    
    if (sessionAge < maxSessionAge) {
      return true;
    }
  }
  
  return false;
}

// Función para obtener los datos del usuario actual
export function getCurrentUser() {
  return JSON.parse(localStorage.getItem('user') || '{}');
}

// Función para cerrar sesión
export function logout() {
  localStorage.removeItem('user');
  const currentPath = window.location.pathname;
  const basePath = currentPath.includes('pages/') ? '..' : '.';
  window.location.href = `${basePath}/login.html`;
}

// Función para redirigir al login con la URL de retorno
export function redirectToLogin() {
  // Obtener la ruta actual sin el dominio
  const currentPath = window.location.pathname;
  // Determinar la ruta base dependiendo de la ubicación actual
  const basePath = currentPath.includes('pages/') ? '..' : '.';
  // Codificar la URL de retorno
  const returnUrl = encodeURIComponent(currentPath);
  // Redirigir al login con la URL de retorno
  window.location.href = `${basePath}/login.html?redirect=${returnUrl}`;
}
