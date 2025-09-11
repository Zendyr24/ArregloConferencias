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

// Plantilla para el menú de navegación
const navTemplate = `
<li class="nav-item">
  <a href="../index.html" class="nav-link" id="nav-home">
    <i class="fas fa-home"></i>
    <span>Inicio</span>
  </a>
</li>
<li class="nav-item">
  <a href="congregaciones.html" class="nav-link" id="nav-congregaciones">
    <i class="fas fa-users"></i>
    <span>Congregaciones</span>
  </a>
</li>
<li class="nav-item">
  <a href="oradores.html" class="nav-link" id="nav-oradores">
    <i class="fas fa-user-tie"></i>
    <span>Oradores</span>
  </a>
</li>
<li class="nav-item">
  <a href="bosquejos.html" class="nav-link" id="nav-bosquejos">
    <i class="fas fa-book"></i>
    <span>Bosquejos</span>
  </a>
</li>
<li class="nav-item">
  <a href="arreglos.html" class="nav-link" id="nav-arreglos">
    <i class="fas fa-calendar-alt"></i>
    <span>Arreglos</span>
  </a>
</li>
<li class="nav-item">
  <a href="asignaciones.html" class="nav-link" id="nav-asignaciones">
    <i class="fas fa-tasks"></i>
    <span>Asignaciones</span>
  </a>
</li>
<li class="nav-item">
  <a href="informes.html" class="nav-link" id="nav-informes">
    <i class="fas fa-chart-bar"></i>
    <span>Informes</span>
  </a>
</li>
<li class="nav-item">
  <a href="ajustes.html" class="nav-link" id="nav-ajustes">
    <i class="fas fa-cog"></i>
    <span>Ajustes</span>
  </a>
</li>`;

// Función para actualizar los enlaces en una página
function updatePageLinks(pageName) {
  const filePath = path.join(__dirname, 'pages', pageName);
  
  // Leer el contenido del archivo
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Actualizar el menú de navegación
  const navRegex = /<ul>[\s\S]*?<\/ul>/;
  content = content.replace(navRegex, `<ul>\n${navTemplate}\n          </ul>`);
  
  // Actualizar el breadcrumb
  const pageTitle = getPageTitle(pageName);
  const breadcrumb = `
              <li class="breadcrumb-item"><a href="../index.html">Inicio</a></li>
              <li class="breadcrumb-item active">${pageTitle}</li>`;
  
  const breadcrumbRegex = /<ol class="breadcrumb">[\s\S]*?<\/ol>/;
  content = content.replace(breadcrumbRegex, `<ol class="breadcrumb">${breadcrumb}\n            </ol>`);
  
  // Escribir los cambios en el archivo
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Actualizado: ${pageName}`);
}

// Función auxiliar para obtener el título de la página
function getPageTitle(pageName) {
  const titles = {
    'congregaciones.html': 'Congregaciones',
    'oradores.html': 'Oradores',
    'bosquejos.html': 'Bosquejos',
    'arreglos.html': 'Arreglos',
    'asignaciones.html': 'Asignaciones',
    'informes.html': 'Informes',
    'ajustes.html': 'Ajustes'
  };
  return titles[pageName] || 'Página';
}

// Actualizar todas las páginas
pages.forEach(page => {
  try {
    updatePageLinks(page);
  } catch (error) {
    console.error(`Error al actualizar ${page}:`, error.message);
  }
});

console.log('Proceso de actualización completado.');
