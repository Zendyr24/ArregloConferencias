/**
 * Generates a consistent HTML page structure
 * @param {Object} options - Page configuration options
 * @param {string} options.title - Page title
 * @param {string} options.activeNav - ID of the active navigation item
 * @param {string} options.content - Main content HTML
 * @param {Array} options.breadcrumbs - Array of {text, href} for breadcrumbs
 * @returns {string} Complete HTML page
 */
function generatePage({
  title = "Gestor de Arreglos en Conferencias",
  activeNav = "nav-home",
  content = "",
  breadcrumbs = [{ text: "Inicio", href: "index.html" }],
} = {}) {
  // Add current page to breadcrumbs if not already included
  if (
    breadcrumbs.length === 0 ||
    breadcrumbs[breadcrumbs.length - 1].text !== title
  ) {
    breadcrumbs.push({ text: title, href: "#" });
  }

  // Generate breadcrumb HTML
  const breadcrumbHTML = `
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
        ${breadcrumbs
          .map((item) =>
            item.href === "#"
              ? `<li class="breadcrumb-item active">${item.text}</li>`
              : `<li class="breadcrumb-item"><a href="${item.href}">${item.text}</a></li>`
          )
          .join("\n")}
      </ol>
    </nav>
  `;

  // Generate navigation menu items
  const navItems = [
    { id: "nav-home", icon: "home", text: "Inicio", href: "index.html" },
    {
      id: "nav-congregaciones",
      icon: "users",
      text: "Congregaciones",
      href: "congregaciones.html",
    },
    {
      id: "nav-oradores",
      icon: "user-tie",
      text: "Oradores",
      href: "oradores.html",
    },
    {
      id: "nav-bosquejos",
      icon: "book",
      text: "Bosquejos",
      href: "bosquejos.html",
    },
    {
      id: "nav-arreglos",
      icon: "calendar-alt",
      text: "Arreglos",
      href: "arreglos.html",
    },
    {
      id: "nav-asignaciones",
      icon: "tasks",
      text: "Asignaciones",
      href: "asignaciones.html",
    },
    {
      id: "nav-informes",
      icon: "chart-bar",
      text: "Informes",
      href: "informes.html",
    },
    { id: "nav-ajustes", icon: "cog", text: "Ajustes", href: "ajustes.html" },
  ];

  // Generate navigation menu HTML
  const navMenuHTML = navItems
    .map(
      (item) => `
    <li class="nav-item${activeNav === item.id ? " active" : ""}">
      <a href="${item.href}" class="nav-link" id="${item.id}">
        <i class="fas fa-${item.icon}"></i>
        <span>${item.text}</span>
      </a>
    </li>
  `
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title} - Gestor de Arreglos en Conferencias</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <link rel="stylesheet" href="../style.css" />
    </head>
    <body>
      <div class="dashboard">
        <!-- Header -->
        <header class="header">
          <div class="header-left">
            <button class="sidebar-toggle" id="sidebarToggle">
              <i class="fas fa-bars"></i>
            </button>
            <h1>${title}</h1>
          </div>
          <div class="header-right">
            <div class="user-info">
              <span class="user-name">Usuario</span>
              <span class="user-role">Administrador</span>
            </div>
            <div class="header-actions">
              <button class="btn-icon" title="Notificaciones">
                <i class="fas fa-bell"></i>
              </button>
              <button class="btn-icon" title="Configuración">
                <i class="fas fa-cog"></i>
              </button>
              <button class="btn-icon" title="Cerrar sesión">
                <i class="fas fa-sign-out-alt"></i>
              </button>
            </div>
          </div>
        </header>

        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
          <nav class="sidebar-nav">
            <ul>${navMenuHTML}</ul>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content" id="mainContent">
          <div class="page-header">
            <h2>${title}</h2>
            ${breadcrumbHTML}
          </div>

          ${content}
        </main>

        <!-- Footer -->
        <footer class="footer">
          <div class="footer-content">
            <p>© 2025 – Gestor de Arreglos en Conferencias</p>
            <p>Versión 1.0.0</p>
          </div>
        </footer>
      </div>

      <script type="module" src="../scripts/app.js"></script>
    </body>
  </html>
  `;
}

// Helper function to create a table section
function createTableSection(columns, data, options = {}) {
  const { title, addButtonText = "Agregar", search = true } = options;

  return `
    <div class="content-section">
      <div class="section-header">
        <h3>${title}</h3>
        <button class="btn btn-primary">
          <i class="fas fa-plus"></i> ${addButtonText}
        </button>
      </div>
      
      ${
        search
          ? `
      <div class="search-bar">
        <div class="search-input">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Buscar...">
        </div>
      </div>
      `
          : ""
      }
      
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>${columns.map((col) => `<th>${col}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row) => `
              <tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Export functions for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = { generatePage, createTableSection };
}
