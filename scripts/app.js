import { ThemeManager } from './theme.js';
import { initializeSidebar } from './sidebar.js';

document.addEventListener('DOMContentLoaded', () => {
  // Inicializa los componentes
  new ThemeManager();
  initializeSidebar();
});
