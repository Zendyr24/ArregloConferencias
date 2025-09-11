const fs = require('fs');
const path = require('path');

// Lista de páginas a actualizar
const pages = [
  'congregaciones.html',
  'oradores.html',
  'bosquejos.html',
  'arreglos.html',
  'asignaciones.html',
  'informes.html',
  'ajustes.html'
];

// Función para actualizar el encabezado con el botón de tema
function updateHeader(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Patrón para encontrar el div de header-actions
  const headerActionsRegex = /<div class="header-actions">[\s\S]*?<\/div>/;
  const newHeaderActions = `
            <button class="btn-icon" title="Notificaciones">
              <i class="fas fa-bell"></i>
            </button>
            <button id="themeToggle" class="btn-icon" title="Cambiar tema">
              <i class="fas fa-moon"></i>
            </button>
            <button class="btn-icon" title="Configuración">
              <i class="fas fa-cog"></i>
            </button>`;
  
  // Reemplazar el contenido de header-actions
  content = content.replace(headerActionsRegex, 
    `<div class="header-actions">${newHeaderActions}
          </div>`);
  
  // Asegurarse de que el script del tema esté incluido
  if (!content.includes('theme.js')) {
    content = content.replace(
      '</body>',
      '    <script src="../scripts/theme.js"></script>\n  </body>'
    );
  }
  
  // Escribir los cambios en el archivo
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Actualizado: ${path.basename(filePath)}`);
}

// Actualizar todas las páginas
pages.forEach(page => {
  const filePath = path.join(__dirname, 'pages', page);
  if (fs.existsSync(filePath)) {
    updateHeader(filePath);
  } else {
    console.log(`Archivo no encontrado: ${filePath}`);
  }
});

console.log('Proceso de actualización de temas completado.');
