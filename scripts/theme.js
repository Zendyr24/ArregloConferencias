// Función para aplicar el tema sin destello
function applyThemeWithoutFlash() {
  // Aplicar tema oscuro por defecto mientras se carga la página
  document.documentElement.style.visibility = 'hidden';
  document.documentElement.style.opacity = '0';
  
  // Obtener preferencia de tema
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
  
  // Aplicar el tema
  document.documentElement.setAttribute('data-theme', theme);
  
  // Forzar renderizado síncrono
  document.documentElement.offsetHeight;
  
  // Mostrar la página con el tema ya aplicado
  document.documentElement.style.visibility = '';
  document.documentElement.style.opacity = '1';
  
  // Agregar clase para transiciones suaves después de cargar
  setTimeout(() => {
    document.documentElement.classList.add('theme-loaded');
  }, 10);
}

// Aplicar el tema inmediatamente
document.addEventListener('DOMContentLoaded', applyThemeWithoutFlash, false);

// Asegurar que el tema se aplique incluso si el DOM ya está cargado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyThemeWithoutFlash);
} else {
  applyThemeWithoutFlash();
}

// Theme management
class ThemeManager {
  constructor() {
    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
      this.themeToggle = document.getElementById('themeToggle');
      this.init();
    });
  }

  // Initialize theme
  init() {
    // Check for saved user preference, if any, on load of the website
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    this.setTheme(savedTheme);
    
    // Add event listener for theme toggle button if it exists
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => this.toggleTheme());
      this.updateToggleIcon(savedTheme);
    }
    
    // Listen for system color scheme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // Set the theme
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.updateToggleIcon(theme);
  }

  // Toggle between light and dark theme
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  // Update the theme toggle icon
  updateToggleIcon(theme) {
    if (!this.themeToggle) return;
    
    const icon = this.themeToggle.querySelector('i');
    if (theme === 'dark') {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
      this.themeToggle.setAttribute('title', 'Cambiar a modo claro');
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
      this.themeToggle.setAttribute('title', 'Cambiar a modo oscuro');
    }
  }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ThemeManager();
});
