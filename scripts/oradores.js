// Variables globales
let oradores = [];
let currentPage = 1;
const itemsPerPage = 10;

// Elementos del DOM
const tbody = document.querySelector('.data-table tbody');
const mobileTable = document.querySelector('.mobile-table');
const searchInput = document.getElementById('buscarOrador');
const paginationPrev = document.getElementById('pagination-prev');
const paginationNext = document.getElementById('pagination-next');
const paginationStart = document.getElementById('pagination-start');
const paginationEnd = document.getElementById('pagination-end');
const paginationTotal = document.getElementById('pagination-total');
const importExportPanel = document.getElementById('importExportPanel');
const toggleImportExport = document.getElementById('toggleImportExport');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos iniciales
    cargarOradores();
    
    // Configurar eventos
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda
    searchInput.addEventListener('input', () => {
        currentPage = 1;
        renderOradores();
    });
    
    // Paginación
    paginationPrev.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderOradores();
        }
    });
    
    paginationNext.addEventListener('click', () => {
        const totalPages = Math.ceil(getFiltredOradores().length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderOradores();
        }
    });
    
    // Importar/Exportar
    toggleImportExport.addEventListener('click', () => {
        importExportPanel.style.display = importExportPanel.style.display === 'none' ? 'block' : 'none';
    });
    
    // Cerrar el panel de importar/exportar al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!importExportPanel.contains(e.target) && e.target !== toggleImportExport) {
            importExportPanel.style.display = 'none';
        }
    });
}

// Cargar oradores desde la base de datos
async function cargarOradores() {
    try {
        // Aquí iría la llamada a Supabase
        // const { data, error } = await supabase.from('oradores').select('*');
        
        // Datos de ejemplo (eliminar cuando se implemente Supabase)
        oradores = [
            { id: 1, nombre: 'Juan Pérez', congregacion: 'Central', telefono: '555-123-4567', email: 'juan@example.com', disponibilidad: 'Disponible' },
            { id: 2, nombre: 'María García', congregacion: 'Norte', telefono: '555-987-6543', email: 'maria@example.com', disponibilidad: 'Ocupado' },
            // Agregar más datos de ejemplo según sea necesario
        ];
        
        renderOradores();
    } catch (error) {
        console.error('Error al cargar oradores:', error);
        mostrarMensaje('Error al cargar los oradores', 'error');
    }
}

// Filtrar oradores según la búsqueda
function getFiltredOradores() {
    const searchTerm = searchInput.value.toLowerCase();
    return oradores.filter(orador => 
        orador.nombre.toLowerCase().includes(searchTerm) ||
        orador.congregacion.toLowerCase().includes(searchTerm) ||
        orador.email.toLowerCase().includes(searchTerm)
    );
}

// Renderizar la tabla de oradores
function renderOradores() {
    const filteredOradores = getFiltredOradores();
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedOradores = filteredOradores.slice(start, end);
    
    // Limpiar tabla
    tbody.innerHTML = '';
    
    // Llenar tabla
    paginatedOradores.forEach(orador => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${orador.nombre}</td>
            <td>${orador.congregacion}</td>
            <td>${orador.telefono}</td>
            <td>${orador.email}</td>
            <td>
                <span class="badge ${getBadgeClass(orador.disponibilidad)}">
                    ${orador.disponibilidad}
                </span>
            </td>
            <td class="action-buttons">
                <button class="btn-icon" title="Editar" onclick="editarOrador(${orador.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon text-danger" title="Eliminar" onclick="eliminarOrador(${orador.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Actualizar paginación
    updatePagination(filteredOradores.length);
    
    // Actualizar tabla móvil
    updateMobileTable(paginatedOradores);
}

// Actualizar la tabla móvil
function updateMobileTable(oradores) {
    if (window.innerWidth > 768) return;
    
    let html = '<div class="mobile-cards">';
    
    oradores.forEach(orador => {
        html += `
            <div class="card">
                <div class="card-header">
                    <h4>${orador.nombre}</h4>
                    <span class="badge ${getBadgeClass(orador.disponibilidad)}">
                        ${orador.disponibilidad}
                    </span>
                </div>
                <div class="card-body">
                    <p><i class="fas fa-users"></i> ${orador.congregacion}</p>
                    <p><i class="fas fa-phone"></i> ${orador.telefono}</p>
                    <p><i class="fas fa-envelope"></i> ${orador.email}</p>
                </div>
                <div class="card-actions">
                    <button class="btn-icon" title="Editar" onclick="editarOrador(${orador.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon text-danger" title="Eliminar" onclick="eliminarOrador(${orador.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    mobileTable.innerHTML = html;
}

// Actualizar la paginación
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(start + itemsPerPage - 1, totalItems);
    
    paginationStart.textContent = start;
    paginationEnd.textContent = end;
    paginationTotal.textContent = totalItems;
    
    paginationPrev.disabled = currentPage === 1;
    paginationNext.disabled = currentPage === totalPages || totalPages === 0;
}

// Obtener clase CSS para el badge según la disponibilidad
function getBadgeClass(disponibilidad) {
    switch (disponibilidad.toLowerCase()) {
        case 'disponible':
            return 'bg-success';
        case 'ocupado':
            return 'bg-warning';
        case 'no disponible':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

// Mostrar modal para agregar/editar orador
function mostrarModalNuevoOrador(orador = null) {
    // Implementar lógica del modal
    console.log('Mostrar modal para:', orador ? 'editar' : 'nuevo', 'orador');
    // Aquí iría el código para mostrar el modal con el formulario
}

// Editar orador
function editarOrador(id) {
    const orador = oradores.find(o => o.id === id);
    if (orador) {
        mostrarModalNuevoOrador(orador);
    }
}

// Eliminar orador
async function eliminarOrador(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este orador?')) {
        try {
            // Aquí iría la llamada a Supabase para eliminar
            // await supabase.from('oradores').delete().eq('id', id);
            
            // Actualizar lista local
            oradores = oradores.filter(o => o.id !== id);
            renderOradores();
            mostrarMensaje('Orador eliminado correctamente', 'success');
        } catch (error) {
            console.error('Error al eliminar orador:', error);
            mostrarMensaje('Error al eliminar el orador', 'error');
        }
    }
}

// Mostrar mensaje de notificación
function mostrarMensaje(mensaje, tipo = 'info') {
    // Implementar lógica para mostrar notificaciones
    console.log(`${tipo.toUpperCase()}: ${mensaje}`);
    // Aquí podrías usar un sistema de notificaciones como SweetAlert2
}

// Exportar a Excel
function exportarAExcel() {
    // Implementar exportación a Excel
    console.log('Exportando a Excel...');
}

// Exportar a PDF
function exportarAPDF() {
    // Implementar exportación a PDF
    console.log('Exportando a PDF...');
}

// Eventos globales
window.mostrarModalNuevoOrador = mostrarModalNuevoOrador;
window.editarOrador = editarOrador;
window.eliminarOrador = eliminarOrador;

// Manejar redimensionamiento de la ventana
window.addEventListener('resize', () => {
    const filteredOradores = getFiltredOradores();
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedOradores = filteredOradores.slice(start, end);
    updateMobileTable(paginatedOradores);
});
