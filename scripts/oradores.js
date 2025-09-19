// Variables globales
let oradores = [];
let currentPage = 1;
const itemsPerPage = 10;
let oradoresFiltrados = [];

// Elementos del DOM
const tbody = document.querySelector('.data-table tbody');
const mobileTable = document.querySelector('.mobile-table');
const searchInput = document.getElementById('buscarOrador');
const limpiarBusqueda = document.getElementById('limpiarBusqueda');
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
    
    // Inicializar búsqueda
    inicializarBusqueda();
});

// Configurar event listeners
function setupEventListeners() {
    // La búsqueda ahora se maneja en inicializarBusqueda()
    
    // Paginación
    if (paginationPrev) {
        paginationPrev.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderOradores();
            }
        });
    }
    
    if (paginationNext) {
        paginationNext.addEventListener('click', () => {
            const totalPages = Math.ceil(getFiltredOradores().length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderOradores();
            }
        });
    }
    
    // Configurar botones de importar/exportar
    const btnImportar = document.getElementById('btnImportar');
    const btnExportar = document.getElementById('btnExportar');
    const btnExportarPDF = document.getElementById('btnExportarPDF');
    
    if (toggleImportExport) {
        toggleImportExport.addEventListener('click', toggleImportExportPanel);
    }
    
    if (btnImportar) {
        btnImportar.addEventListener('click', importarDesdeExcel);
    }
    
    if (btnExportar) {
        btnExportar.addEventListener('click', exportarAExcel);
    }
    
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener('click', exportarAPDF);
    }
    
    // Configurar el listener para cerrar el panel al hacer clic fuera
    setupClickOutsideListener();
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
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    if (!searchTerm) {
        oradoresFiltrados = [...oradores];
        return oradoresFiltrados;
    }
    
    oradoresFiltrados = oradores.filter(orador => 
        orador.nombre.toLowerCase().includes(searchTerm) ||
        (orador.congregacion && orador.congregacion.nombre && orador.congregacion.nombre.toLowerCase().includes(searchTerm)) ||
        (orador.congregacion && typeof orador.congregacion === 'string' && orador.congregacion.toLowerCase().includes(searchTerm))
    );
    
    return oradoresFiltrados;
}

// Inicializar la búsqueda
function inicializarBusqueda() {
    const buscarInput = document.getElementById('buscarOrador');
    const btnLimpiar = document.createElement('button');
    btnLimpiar.className = 'btn-clear-search';
    btnLimpiar.innerHTML = '<i class="fas fa-times"></i>';
    btnLimpiar.style.display = 'none';
    btnLimpiar.type = 'button';
    
    if (buscarInput) {
        // Insertar el botón de limpiar después del input
        buscarInput.parentNode.insertBefore(btnLimpiar, buscarInput.nextSibling);
        
        // Mostrar/ocultar el botón de limpiar
        buscarInput.addEventListener('input', () => {
            btnLimpiar.style.display = buscarInput.value ? 'flex' : 'none';
            currentPage = 1;
            renderOradores();
        });
        
        // Limpiar la búsqueda
        btnLimpiar.addEventListener('click', () => {
            buscarInput.value = '';
            btnLimpiar.style.display = 'none';
            currentPage = 1;
            renderOradores();
        });
        
        // Buscar al presionar Enter
        buscarInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                currentPage = 1;
                renderOradores();
            }
        });
    }
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

// Toggle del panel de importación/exportación
function toggleImportExportPanel(e) {
    // Prevenir el cierre inmediato al hacer clic en el botón
    if (e) {
        e.stopPropagation();
        e.preventDefault();
    }
    
    const panel = document.getElementById('importExportPanel');
    const toggleBtn = document.getElementById('toggleImportExport');
    
    if (!panel || !toggleBtn) return;
    
    const icon = toggleBtn.querySelector('i');
    const isVisible = panel.classList.contains('visible');
    
    // Cerrar cualquier otro panel abierto
    document.querySelectorAll('.import-export-panel.visible').forEach(p => {
        if (p !== panel) {
            p.classList.remove('visible');
        }
    });
    
    // Alternar la clase visible
    if (isVisible) {
        panel.classList.remove('visible');
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    } else {
        panel.classList.add('visible');
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    }
    
    // Prevenir que el clic se propague al documento
    return false;
}

// Cerrar el panel de importación/exportación al hacer clic fuera o presionar Escape
function setupClickOutsideListener() {
    const toggleBtn = document.getElementById('toggleImportExport');
    const panel = document.getElementById('importExportPanel');
    
    if (!toggleBtn || !panel) return;
    
    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (panel.classList.contains('visible') && 
            !panel.contains(e.target) && 
            !toggleBtn.contains(e.target)) {
            toggleImportExportPanel(e);
        }
    }, true); // Usar captura para asegurar que se ejecute primero
    
    // Cerrar con la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.classList.contains('visible')) {
            toggleImportExportPanel(e);
        }
    });
    
    // Prevenir que los clics dentro del panel cierren el panel
    panel.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// Exportar a Excel
async function exportarAExcel() {
    try {
        // Verificar si hay datos para exportar
        if (oradores.length === 0) {
            mostrarMensaje('No hay datos para exportar', 'warning');
            return;
        }

        // Crear un libro de trabajo de ExcelJS
        const ExcelJS = window.ExcelJS;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Oradores');

        // Definir las columnas
        worksheet.columns = [
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'Congregación', key: 'congregacion', width: 25 },
            { header: 'Teléfono', key: 'telefono', width: 20 },
            { header: 'Correo Electrónico', key: 'email', width: 30 },
            { header: 'Disponibilidad', key: 'disponibilidad', width: 20 }
        ];

        // Agregar los datos
        oradores.forEach(orador => {
            worksheet.addRow({
                nombre: orador.nombre || '',
                congregacion: typeof orador.congregacion === 'object' ? orador.congregacion.nombre : orador.congregacion || '',
                telefono: orador.telefono || '',
                email: orador.email || '',
                disponibilidad: orador.disponibilidad || ''
            });
        });

        // Estilizar el encabezado
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' }
        };

        // Generar el archivo Excel
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `oradores_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        mostrarMensaje('Exportación a Excel completada con éxito', 'success');
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        mostrarMensaje('Error al exportar a Excel', 'error');
    }
}

// Exportar a PDF
async function exportarAPDF() {
    try {
        // Verificar si hay datos para exportar
        if (oradores.length === 0) {
            mostrarMensaje('No hay datos para exportar', 'warning');
            return;
        }

        // Crear un nuevo documento PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Título del documento
        doc.setFontSize(18);
        doc.text('Lista de Oradores', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        
        // Fecha de generación
        doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);
        
        // Configuración de la tabla
        const columns = [
            { title: 'Nombre', dataKey: 'nombre' },
            { title: 'Congregación', dataKey: 'congregacion' },
            { title: 'Teléfono', dataKey: 'telefono' },
            { title: 'Correo', dataKey: 'email' },
            { title: 'Disponibilidad', dataKey: 'disponibilidad' }
        ];
        
        // Preparar los datos
        const rows = oradores.map(orador => ({
            nombre: orador.nombre || '',
            congregacion: typeof orador.congregacion === 'object' ? orador.congregacion.nombre : orador.congregacion || '',
            telefono: orador.telefono || '',
            email: orador.email || '',
            disponibilidad: orador.disponibilidad || ''
        }));
        
        // Agregar la tabla al PDF
        doc.autoTable({
            head: [columns.map(col => col.title)],
            body: rows.map(row => columns.map(col => row[col.dataKey])),
            startY: 40,
            styles: { 
                fontSize: 9,
                cellPadding: 3,
                overflow: 'linebreak',
                lineWidth: 0.1,
                lineColor: [0, 0, 0]
            },
            headStyles: {
                fillColor: [211, 211, 211],
                textColor: 0,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            }
        });
        
        // Guardar el PDF
        doc.save(`oradores_${new Date().toISOString().split('T')[0]}.pdf`);
        
        mostrarMensaje('Exportación a PDF completada con éxito', 'success');
    } catch (error) {
        console.error('Error al exportar a PDF:', error);
        mostrarMensaje('Error al exportar a PDF', 'error');
    }
}

// Importar desde Excel
async function importarDesdeExcel() {
    try {
        // Crear un input de tipo archivo
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                // Mostrar indicador de carga
                mostrarMensaje('Procesando archivo, por favor espere...', 'info');
                
                // Leer el archivo Excel
                const buffer = await file.arrayBuffer();
                const ExcelJS = window.ExcelJS;
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(buffer);
                
                // Obtener la primera hoja
                const worksheet = workbook.worksheets[0];
                if (!worksheet) {
                    throw new Error('El archivo no contiene hojas válidas');
                }
                
                // Obtener los datos
                const data = [];
                const headers = [];
                
                // Leer la primera fila como encabezados
                const headerRow = worksheet.getRow(1);
                headerRow.eachCell((cell, colNumber) => {
                    headers[colNumber] = cell.value?.toString().toLowerCase() || '';
                });
                
                // Validar encabezados requeridos
                const requiredHeaders = ['nombre'];
                const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
                
                if (missingHeaders.length > 0) {
                    throw new Error(`Faltan encabezados requeridos: ${missingHeaders.join(', ')}`);
                }
                
                // Leer las filas de datos
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; // Saltar la fila de encabezado
                    
                    const rowData = {};
                    row.eachCell((cell, colNumber) => {
                        const header = headers[colNumber];
                        if (header) {
                            rowData[header] = cell.value;
                        }
                    });
                    
                    if (Object.keys(rowData).length > 0) {
                        data.push(rowData);
                    }
                });
                
                if (data.length === 0) {
                    throw new Error('No se encontraron datos para importar');
                }
                
                // Aquí iría la lógica para guardar los datos en Supabase
                // Por ahora, solo mostramos un mensaje con la cantidad de registros
                mostrarMensaje(`Se importaron ${data.length} oradores correctamente`, 'success');
                
                // Recargar la lista de oradores
                cargarOradores();
                
            } catch (error) {
                console.error('Error al procesar el archivo:', error);
                mostrarMensaje(`Error al importar: ${error.message}`, 'error');
            }
        };
        
        // Disparar el diálogo de selección de archivo
        input.click();
        
    } catch (error) {
        console.error('Error en la importación:', error);
        mostrarMensaje(`Error al importar: ${error.message}`, 'error');
    }
}

// Eventos globales
window.mostrarModalNuevoOrador = mostrarModalNuevoOrador;
window.editarOrador = editarOrador;
window.eliminarOrador = eliminarOrador;
window.exportarAExcel = exportarAExcel;
window.exportarAPDF = exportarAPDF;

// Manejar redimensionamiento de la ventana
window.addEventListener('resize', () => {
    const filteredOradores = getFiltredOradores();
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedOradores = filteredOradores.slice(start, end);
    updateMobileTable(paginatedOradores);
});
