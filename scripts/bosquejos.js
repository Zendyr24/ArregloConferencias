// scripts/bosquejos.js
import { db } from './db.js';

// Elementos del DOM
const tablaBosquejos = document.querySelector('.data-table tbody');
const paginationStart = document.getElementById('pagination-start');
const paginationEnd = document.getElementById('pagination-end');
const paginationTotal = document.getElementById('pagination-total');
const paginationPrev = document.getElementById('pagination-prev');
const paginationNext = document.getElementById('pagination-next');
const btnNuevoBosquejo = document.querySelector('.btn-primary');
const inputBusqueda = document.querySelector('.search-input input');
const modalBosquejo = document.getElementById('modalBosquejo');
const formBosquejo = document.getElementById('formBosquejo');
const modalTitle = document.querySelector('.modal-title');
const btnCerrarModal = document.querySelector('.btn-close');
const btnCancelar = document.querySelector('.btn-secondary');
const numeroInput = document.getElementById('numero');
const tituloInput = document.getElementById('titulo');
const bosquejoIdInput = document.getElementById('bosquejoId');
const btnExportar = document.getElementById('btnExportar');

// Variables de estado
let editando = false;
let currentPage = 1;
const itemsPerPage = 50;
let totalBosquejos = 0;
let allBosquejos = [];

// Cargar bosquejos al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
  // Configurar event listeners una sola vez
  if (paginationPrev) {
    paginationPrev.addEventListener('click', () => cambiarPagina('prev'));
  }
  if (paginationNext) {
    paginationNext.addEventListener('click', () => cambiarPagina('next'));
  }
  
  // Cargar los datos iniciales
  cargarBosquejos();
});

// Función para actualizar la tabla con los bosquejos de la página actual
function actualizarTabla() {
  // Calcular índices de los elementos a mostrar
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const bosquejosPaginados = allBosquejos.slice(startIndex, endIndex);
  
  // Limpiar tablas existentes
  if (tablaBosquejos) {
    tablaBosquejos.innerHTML = '';
  }
  
  // Obtener o crear el contenedor de la tabla móvil
  let mobileTableContainer = document.querySelector('.mobile-table');
  if (!mobileTableContainer) {
    mobileTableContainer = document.createElement('div');
    mobileTableContainer.className = 'mobile-table';
    const tableParent = document.querySelector('.table-responsive');
    if (tableParent) {
      tableParent.insertBefore(mobileTableContainer, tableParent.firstChild);
    }
  } else {
    mobileTableContainer.innerHTML = '';
  }
  
  // Actualizar la tabla de escritorio
  if (tablaBosquejos) {
    if (bosquejosPaginados.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="3" class="text-center py-4">
          No se encontraron bosquejos. ¡Crea tu primer bosquejo!
        </td>
      `;
      tablaBosquejos.appendChild(tr);
    } else {
      bosquejosPaginados.forEach(bosquejo => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="col-numero">${bosquejo.numero}</td>
          <td class="col-titulo">${bosquejo.titulo || ''}</td>
          <td class="col-acciones text-center">
            <button class="btn-icon" onclick="verBosquejo(${bosquejo.id})" title="Ver">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn-icon" onclick="editarBosquejo(${bosquejo.id})" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon text-danger" onclick="eliminarBosquejo(${bosquejo.id})" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        tablaBosquejos.appendChild(tr);
      });
    }
  }
  
  // Actualizar la vista móvil
  if (bosquejosPaginados.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'mobile-table-row text-center py-4';
    emptyMessage.textContent = 'No se encontraron bosquejos. ¡Crea tu primer bosquejo!';
    mobileTableContainer.appendChild(emptyMessage);
  } else {
    bosquejosPaginados.forEach(bosquejo => {
      const card = document.createElement('div');
      card.className = 'mobile-table-row';
      card.innerHTML = `
        <div class="mobile-table-cell">
          <span class="label">Número:</span>
          <span class="value">${bosquejo.numero}</span>
        </div>
        <div class="mobile-table-cell">
          <span class="label">Título:</span>
          <span class="value">${bosquejo.titulo || 'Sin título'}</span>
        </div>
        <div class="mobile-table-actions">
          <button class="btn btn-sm btn-outline" onclick="verBosquejo(${bosquejo.id})" title="Ver">
            <i class="fas fa-eye"></i> Ver
          </button>
          <button class="btn btn-sm btn-outline" onclick="editarBosquejo(${bosquejo.id})" title="Editar">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn btn-sm btn-outline text-danger" onclick="eliminarBosquejo(${bosquejo.id})" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      mobileTableContainer.appendChild(card);
    });
  }
  
  // Mostrar/ocultar tablas según el ancho de la pantalla
  const isMobile = window.innerWidth < 768;
  document.querySelectorAll('table.data-table').forEach(el => {
    el.style.display = isMobile ? 'none' : 'table';
  });
  if (mobileTableContainer) {
    mobileTableContainer.style.display = isMobile ? 'block' : 'none';
  }
  
  // Limpiar tabla
  tablaBosquejos.innerHTML = '';
  
  // Llenar la tabla con los bosquejos de la página actual
  if (bosquejosPaginados.length > 0) {
    bosquejosPaginados.forEach(bosquejo => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${bosquejo.numero || ''}</td>
        <td>${bosquejo.titulo || ''}</td>
        <td class="text-center">
          <button class="btn-icon" title="Ver" data-id="${bosquejo.id}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-icon" title="Editar" data-id="${bosquejo.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon text-danger" title="Eliminar" data-id="${bosquejo.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tablaBosquejos.appendChild(fila);
    });
  } else {
    // Mostrar mensaje cuando no hay datos
    const fila = document.createElement('tr');
    fila.innerHTML = '<td colspan="3" class="text-center">No se encontraron bosquejos</td>';
    tablaBosquejos.appendChild(fila);
  }
  
  // Actualizar controles de paginación
  actualizarControlesPaginacion();
}

// Función para actualizar los controles de paginación
function actualizarControlesPaginacion() {
  const totalPages = Math.ceil(totalBosquejos / itemsPerPage);
  const startItem = totalBosquejos > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalBosquejos);
  
  // Actualizar información de paginación
  if (paginationStart) paginationStart.textContent = startItem;
  if (paginationEnd) paginationEnd.textContent = endItem;
  if (paginationTotal) paginationTotal.textContent = totalBosquejos;
  
  // Actualizar estado de los botones
  if (paginationPrev) {
    paginationPrev.disabled = currentPage === 1;
  }
  if (paginationNext) {
    paginationNext.disabled = currentPage >= totalPages || totalBosquejos === 0;
  }
}

// Función para cambiar de página
function cambiarPagina(direccion) {
  const totalPages = Math.ceil(totalBosquejos / itemsPerPage);
  
  if (direccion === 'prev' && currentPage > 1) {
    currentPage--;
  } else if (direccion === 'next' && currentPage < totalPages) {
    currentPage++;
  } else if (typeof direccion === 'number' && direccion > 0 && direccion <= totalPages) {
    currentPage = direccion;
  }
  
  actualizarTabla();
}

async function cargarBosquejos() {
  try {
    const { data: bosquejos, error } = await db.obtenerTodos('bosquejos');
    
    if (error) throw error;
    
    // Guardar y ordenar los bosquejos
    allBosquejos = Array.isArray(bosquejos) ? bosquejos : [];
    allBosquejos.sort((a, b) => (a.numero || 0) - (b.numero || 0));
    totalBosquejos = allBosquejos.length;
    
    // Actualizar la tabla con la primera página
    currentPage = 1;
    actualizarTabla();
    
  } catch (error) {
    console.error('Error al cargar los bosquejos:', error);
    // Mostrar mensaje de error
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td colspan="3" class="text-center text-danger">
        Error al cargar los bosquejos. Por favor, intente de nuevo más tarde.
      </td>
    `;
    tablaBosquejos.appendChild(fila);
  }
  
  // Asegurarse de que los botones de acción tengan sus event listeners
  agregarEventListenersBotones();
}

// Función para agregar event listeners a los botones de acción
function agregarEventListenersBotones() {
  // Botón Ver
  document.querySelectorAll('.btn-icon .fa-eye').forEach(btn => {
    btn.closest('button').addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      verBosquejo(id);
    });
  });
  
  // Botón Editar
  document.querySelectorAll('.btn-icon .fa-edit').forEach(btn => {
    btn.closest('button').addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      mostrarModalEditarBosquejo(id);
    });
  });
  
  // Botón Eliminar
  document.querySelectorAll('.btn-icon .fa-trash').forEach(btn => {
    btn.closest('button').addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      eliminarBosquejo(id);
    });
  });
}

// Función para ver los detalles de un bosquejo
function verBosquejo(id) {
  console.log('Ver bosquejo:', id);
  // Implementar lógica para ver los detalles del bosquejo
  alert(`Ver bosquejo con ID: ${id}`);
}

// Función para editar un bosquejo (mantenida por compatibilidad)
function editarBosquejo(id) {
  mostrarModalEditarBosquejo(id);
}

// Función para eliminar un bosquejo
async function eliminarBosquejo(id) {
  if (confirm('¿Estás seguro de que deseas eliminar este bosquejo?')) {
    try {
      const { error } = await db.eliminar('bosquejos', id);
      
      if (error) throw error;
      
      // Recargar la lista de bosquejos
      cargarBosquejos();
      
      // Mostrar mensaje de éxito
      alert('Bosquejo eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar el bosquejo:', error);
      alert('Error al eliminar el bosquejo. Por favor, intente de nuevo.');
    }
  }
}

// Mostrar modal para nuevo bosquejo
function mostrarModalNuevoBosquejo() {
  editando = false;
  modalTitle.textContent = 'Nuevo Bosquejo';
  formBosquejo.reset();
  bosquejoIdInput.value = '';
  numeroInput.removeAttribute('disabled');
  mostrarModal();
}

// Mostrar modal para editar bosquejo
async function mostrarModalEditarBosquejo(id) {
  try {
    editando = true;
    modalTitle.textContent = 'Editar Bosquejo';
    formBosquejo.reset();
    
    // Obtener los datos del bosquejo
    const { data: bosquejo, error } = await db.obtenerPorId('bosquejos', id);
    
    if (error) throw error;
    
    // Llenar el formulario con los datos del bosquejo
    bosquejoIdInput.value = bosquejo.id;
    numeroInput.value = bosquejo.numero;
    tituloInput.value = bosquejo.titulo || '';
    
    // Deshabilitar el campo de número al editar
    numeroInput.setAttribute('disabled', 'disabled');
    
    mostrarModal();
  } catch (error) {
    console.error('Error al cargar el bosquejo:', error);
    mostrarAlerta('Error al cargar el bosquejo. Por favor, intente de nuevo.', 'error');
  }
}

// Mostrar el modal
function mostrarModal() {
  // Hacer el modal accesible antes de mostrarlo
  modalBosquejo.removeAttribute('aria-hidden');
  modalBosquejo.setAttribute('aria-modal', 'true');
  
  // Mostrar el modal
  modalBosquejo.classList.add('show');
  document.body.style.overflow = 'hidden';
  
  // Guardar el elemento que tenía el foco antes de abrir el modal
  modalBosquejo._focusedElementBeforeModal = document.activeElement;
  
  // Enfocar el primer campo del formulario
  const focusTarget = editando ? tituloInput : numeroInput;
  
  // Usar requestAnimationFrame para asegurar que el foco se establezca en el siguiente ciclo de renderizado
  requestAnimationFrame(() => {
    focusTarget.focus();
    
    // Agregar manejador para atrapar el foco dentro del modal
    modalBosquejo._handleKeyDown = function(e) {
      // Cerrar con la tecla Escape
      if (e.key === 'Escape') {
        ocultarModal();
        return;
      }
      
      // Atrapar el foco dentro del modal
      if (e.key === 'Tab') {
        const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusable = [...modalBosquejo.querySelectorAll(focusableElements)]
          .filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
        
        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];
        
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    modalBosquejo.addEventListener('keydown', modalBosquejo._handleKeyDown);
  });
}

// Ocultar el modal
function ocultarModal() {
  // Limpiar el manejador de eventos del teclado
  if (modalBosquejo._handleKeyDown) {
    modalBosquejo.removeEventListener('keydown', modalBosquejo._handleKeyDown);
    delete modalBosquejo._handleKeyDown;
  }
  
  // Restaurar el foco al elemento que lo tenía antes de abrir el modal
  requestAnimationFrame(() => {
    if (modalBosquejo._focusedElementBeforeModal && 
        'focus' in modalBosquejo._focusedElementBeforeModal) {
      modalBosquejo._focusedElementBeforeModal.focus();
    }
    delete modalBosquejo._focusedElementBeforeModal;
    
    // Ocultar el modal
    modalBosquejo.classList.remove('show');
    modalBosquejo.setAttribute('aria-hidden', 'true');
    modalBosquejo.removeAttribute('aria-modal');
    document.body.style.overflow = '';
    
    // Limpiar el formulario
    formBosquejo.reset();
    formBosquejo.classList.remove('was-validated');
  });
}

// Manejar el envío del formulario
async function manejarEnvioFormulario(e) {
  e.preventDefault();
  
  // Validar el formulario
  if (!formBosquejo.checkValidity()) {
    formBosquejo.classList.add('was-validated');
    return;
  }
  
  const datos = {
    numero: parseInt(numeroInput.value, 10),
    titulo: tituloInput.value.trim()
  };
  
  try {
    if (editando) {
      // Actualizar bosquejo existente
      const { data, error } = await db.actualizar('bosquejos', bosquejoIdInput.value, datos);
      
      if (error) throw error;
      
      mostrarAlerta('Bosquejo actualizado correctamente', 'success');
    } else {
      // Crear nuevo bosquejo
      const { data, error } = await db.insertar('bosquejos', datos);
      
      if (error) throw error;
      
      mostrarAlerta('Bosquejo creado correctamente', 'success');
    }
    
    // Recargar la lista de bosquejos
    cargarBosquejos();
    ocultarModal();
  } catch (error) {
    console.error('Error al guardar el bosquejo:', error);
    const mensaje = error.message.includes('duplicate key value') 
      ? 'Ya existe un bosquejo con este número' 
      : 'Error al guardar el bosquejo. Por favor, intente de nuevo.';
    mostrarAlerta(mensaje, 'error');
  }
}

// Mostrar alerta
function mostrarAlerta(mensaje, tipo = 'info') {
  // Implementar lógica para mostrar alertas (puedes usar un sistema de notificaciones existente)
  alert(`${tipo.toUpperCase()}: ${mensaje}`);
}

// Función para exportar a PDF
async function exportToPDF() {
  try {
    // Mostrar indicador de carga
    const originalButtonText = btnExportarPDF.innerHTML;
    btnExportarPDF.disabled = true;
    btnExportarPDF.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando PDF...';
    
    // Obtener los datos ordenados
    const bosquejos = [...allBosquejos].sort((a, b) => a.numero - b.numero);
    
    // Crear un nuevo documento PDF
    const doc = new window.jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Agregar título
    doc.setFontSize(18);
    doc.text('Lista de Bosquejos', 14, 22);
    
    // Agregar fecha de generación
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Configurar la tabla
    const headers = [['Número', 'Título']];
    const data = bosquejos.map(bosquejo => [
      bosquejo.numero.toString(),
      bosquejo.titulo || ''
    ]);
    
    // Agregar tabla al documento
    doc.autoTable({
      head: headers,
      body: data,
      startY: 40,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: 'linebreak',
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 40 }
    });
    
    // Guardar el PDF
    doc.save(`bosquejos_${new Date().toISOString().split('T')[0]}.pdf`);
    
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    mostrarAlerta('Error al generar el PDF: ' + error.message, 'error');
  } finally {
    // Restaurar el botón
    if (btnExportarPDF) {
      btnExportarPDF.disabled = false;
      btnExportarPDF.innerHTML = '<i class="fas fa-file-pdf"></i> Exportar PDF';
    }
  }
}

// Función para manejar el cambio de tamaño de la ventana
function handleWindowResize() {
  const isMobile = window.innerWidth < 768;
  const desktopTable = document.querySelector('table.data-table');
  const mobileTable = document.querySelector('.mobile-table');
  
  if (desktopTable) {
    desktopTable.style.display = isMobile ? 'none' : 'table';
  }
  
  if (mobileTable) {
    mobileTable.style.display = isMobile ? 'block' : 'none';
  }
}

// Función para alternar el panel de importación/exportación
function toggleImportExportPanel() {
  const panel = document.getElementById('importExportPanel');
  const toggleButton = document.getElementById('toggleImportExport');
  
  if (panel && toggleButton) {
    panel.classList.toggle('visible');
    toggleButton.classList.toggle('collapsed');
    
    // Cambiar el ícono
    const icon = toggleButton.querySelector('i');
    if (icon) {
      icon.className = panel.classList.contains('visible') ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
    }
  }
}

// Event Listeners
window.addEventListener('resize', handleWindowResize);

document.addEventListener('DOMContentLoaded', () => {
  // Botones del modal
  if (btnNuevoBosquejo) btnNuevoBosquejo.addEventListener('click', mostrarModalNuevoBosquejo);
  if (btnExportarPDF) btnExportarPDF.addEventListener('click', exportToPDF);
  
  // Toggle del panel de importación/exportación
  const toggleButton = document.getElementById('toggleImportExport');
  if (toggleButton) {
    toggleButton.addEventListener('click', toggleImportExportPanel);
    // Inicializar como colapsado
    toggleButton.classList.add('collapsed');
    // Asegurarse de que el panel esté oculto al cargar
    const panel = document.getElementById('importExportPanel');
    if (panel) {
      panel.style.display = 'none';
      // Usar setTimeout para permitir que se apliquen los estilos iniciales
      setTimeout(() => {
        panel.style.display = '';
      }, 10);
    }
  }
  if (formBosquejo) formBosquejo.addEventListener('submit', manejarEnvioFormulario);
  if (btnCerrarModal) btnCerrarModal.addEventListener('click', ocultarModal);
  if (btnCancelar) btnCancelar.addEventListener('click', ocultarModal);
  
  // Botones de importar/exportar
  const btnExportar = document.getElementById('btnExportar');
  const btnImportar = document.getElementById('btnImportar');
  const fileInput = document.getElementById('inputArchivo');
  
  if (btnExportar) {
    btnExportar.addEventListener('click', exportToExcel);
  }
  
  if (btnImportar && fileInput) {
    btnImportar.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      const originalState = {
        html: btnImportar.innerHTML,
        disabled: btnImportar.disabled
      };
      
      try {
        // Mostrar indicador de carga
        btnImportar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importando...';
        btnImportar.disabled = true;
        
        // Leer el archivo
        const fileContent = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (error) => reject(error);
          reader.readAsBinaryString(file);
        });
        
        // Procesar el archivo Excel
        const workbook = XLSX.read(fileContent, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        if (!data || data.length === 0) {
          throw new Error('El archivo está vacío o no contiene datos válidos');
        }
        
        // Validar y procesar los datos
        const bosquejos = data.map((row, index) => {
          const numero = parseInt(row['Número'] || row['numero'] || row['Nº']);
          const titulo = String(row['Título'] || row['titulo'] || '').trim();
          
          if (isNaN(numero) || !titulo) {
            throw new Error(`Fila ${index + 2}: Número y título son campos requeridos`);
          }
          
          return { numero, titulo };
        });
        
        // Verificar duplicados en el archivo
        const numeros = new Set();
        for (const b of bosquejos) {
          if (numeros.has(b.numero)) {
            throw new Error(`El número ${b.numero} está duplicado en el archivo`);
          }
          numeros.add(b.numero);
        }
        
        // Obtener bosquejos existentes para verificar duplicados
        const { data: bosquejosExistentes, error: errorBusqueda } = await db.obtenerTodos('bosquejos');
        if (errorBusqueda) throw errorBusqueda;
        
        // Verificar duplicados con la base de datos
        const numerosExistentes = new Set(bosquejosExistentes.map(b => b.numero));
        const duplicados = bosquejos.filter(b => numerosExistentes.has(b.numero));
        
        if (duplicados.length > 0) {
          const confirmar = confirm(`Se encontraron ${duplicados.length} bosquejos existentes. ¿Desea actualizarlos?`);
          if (!confirmar) return;
        }
        
        // Procesar la importación
        let exitosos = 0;
        let actualizados = 0;
        const errores = [];
        
        for (const bosquejo of bosquejos) {
          try {
            const existente = bosquejosExistentes.find(b => b.numero === bosquejo.numero);
            
            if (existente) {
              // Actualizar existente si el título es diferente
              if (existente.titulo !== bosquejo.titulo) {
                const { error } = await db.actualizar('bosquejos', existente.id, bosquejo);
                if (error) throw error;
                actualizados++;
              }
            } else {
              // Insertar nuevo
              const { error } = await db.insertar('bosquejos', bosquejo);
              if (error) throw error;
              exitosos++;
            }
          } catch (error) {
            console.error(`Error al procesar bosquejo ${bosquejo.numero}:`, error);
            errores.push(`Error en bosquejo ${bosquejo.numero}: ${error.message}`);
          }
        }
        
        // Mostrar resumen
        let mensaje = `Importación completada: ${exitosos} nuevos, ${actualizados} actualizados`;
        if (errores.length > 0) {
          mensaje += `, ${errores.length} errores`;
          console.error('Errores durante la importación:', errores);
        }
        
        mostrarAlerta(mensaje, errores.length > 0 ? 'warning' : 'success');
        
        // Recargar la lista
        await cargarBosquejos();
        
      } catch (error) {
        console.error('Error al importar desde Excel:', error);
        mostrarAlerta(`Error al importar: ${error.message}`, 'error');
      } finally {
        // Restaurar el estado del botón
        btnImportar.innerHTML = originalState.html;
        btnImportar.disabled = originalState.disabled;
        
        // Limpiar el input de archivo
        event.target.value = '';
      }
    });
  }
  
  // Event listeners for the import button are already set up above
});

// Cerrar modal al hacer clic fuera del contenido
modalBosquejo.addEventListener('click', (e) => {
  if (e.target === modalBosquejo) {
    ocultarModal();
  }
});

// Cerrar modal con la tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalBosquejo.classList.contains('show')) {
    ocultarModal();
  }
});

// Función para filtrar la tabla
function filtrarTabla(terminoBusqueda) {
  const filas = document.querySelectorAll('.data-table tbody tr:not(#mensajeSinResultados)');
  let resultadosEncontrados = 0;
  const tbody = document.querySelector('.data-table tbody');
  
  // Mostrar todas las filas primero (excepto el mensaje)
  filas.forEach(fila => {
    fila.style.display = '';
  });
  
  // Si hay término de búsqueda, aplicar el filtro
  if (terminoBusqueda) {
    filas.forEach(fila => {
      // Obtener el texto de las celdas de número y título
      const celdaNumero = fila.cells[0]?.textContent?.trim() || '';
      const celdaTitulo = fila.cells[1]?.textContent?.trim() || '';
      const textoCompleto = `${celdaNumero} ${celdaTitulo}`.toLowerCase();
      
      if (textoCompleto.includes(terminoBusqueda.toLowerCase())) {
        resultadosEncontrados++;
      } else {
        fila.style.display = 'none';
      }
    });
  } else {
    // Si no hay término de búsqueda, mostrar todo
    resultadosEncontrados = filas.length;
  }
  
  // Manejar el mensaje de "sin resultados"
  const mensajeSinResultados = document.getElementById('mensajeSinResultados');
  
  // Eliminar mensaje anterior si existe
  if (mensajeSinResultados) {
    mensajeSinResultados.remove();
  }
  
  // Mostrar mensaje si no hay resultados y hay término de búsqueda
  if (resultadosEncontrados === 0 && terminoBusqueda) {
    const filaMensaje = document.createElement('tr');
    filaMensaje.id = 'mensajeSinResultados';
    filaMensaje.innerHTML = `
      <td colspan="3" class="text-center py-4">
        <i class="fas fa-search mb-2" style="font-size: 1.5rem; opacity: 0.5;"></i>
        <p class="mb-0">No se encontraron resultados para "${terminoBusqueda}"</p>
      </td>
    `;
    tbody.appendChild(filaMensaje);
  }
}

// Evento para la búsqueda con debounce
let timeoutBusqueda = null;
inputBusqueda.addEventListener('input', (e) => {
  const termino = e.target.value.trim();
  
  // Limpiar el timeout anterior
  clearTimeout(timeoutBusqueda);
  
  // Establecer un nuevo timeout
  timeoutBusqueda = setTimeout(() => {
    filtrarTabla(termino);
  }, 300); // 300ms de retraso
});

// Limpiar la búsqueda al hacer clic en la X
const btnLimpiarBusqueda = document.createElement('button');
btnLimpiarBusqueda.type = 'button';
btnLimpiarBusqueda.className = 'btn-clear-search';
btnLimpiarBusqueda.innerHTML = '<i class="fas fa-times"></i>';
btnLimpiarBusqueda.title = 'Limpiar búsqueda';
btnLimpiarBusqueda.style.display = 'none';

// Insertar el botón después del input de búsqueda
inputBusqueda.parentNode.insertBefore(btnLimpiarBusqueda, inputBusqueda.nextSibling);

// Mostrar/ocultar el botón de limpiar según si hay texto
inputBusqueda.addEventListener('input', (e) => {
  if (e.target.value.trim() !== '') {
    btnLimpiarBusqueda.style.display = 'flex';
  } else {
    btnLimpiarBusqueda.style.display = 'none';
    // Si se limpia el input, mostrar todos los resultados
    filtrarTabla('');
  }
});

// Limpiar la búsqueda al hacer clic en el botón
btnLimpiarBusqueda.addEventListener('click', () => {
  inputBusqueda.value = '';
  btnLimpiarBusqueda.style.display = 'none';
  filtrarTabla('');
  inputBusqueda.focus();
});

// Función para exportar a Excel
async function exportToExcel() {
  const btnExportar = document.getElementById('btnExportar');
  if (!btnExportar) return;
  
  const originalState = {
    html: btnExportar.innerHTML,
    disabled: btnExportar.disabled
  };
  
  try {
    // Mostrar indicador de carga
    btnExportar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exportando...';
    btnExportar.disabled = true;
    
    // Obtener los datos actuales de la tabla
    const { data: bosquejos, error } = await db.obtenerTodos('bosquejos');
    
    if (error) throw error;
    
    // Ordenar los bosquejos por número
    const bosquejosOrdenados = [...bosquejos].sort((a, b) => a.numero - b.numero);
    
    // Crear libro de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(bosquejosOrdenados.map(b => ({
      'Número': b.numero,
      'Título': b.titulo
    })));
    
    XLSX.utils.book_append_sheet(wb, ws, 'Bosquejos');
    
    // Generar archivo
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `bosquejos_${fecha}.xlsx`);
    
    mostrarAlerta('Exportación completada con éxito', 'success');
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    mostrarAlerta('Error al exportar a Excel. Por favor, intente de nuevo.', 'error');
  } finally {
    // Restaurar el estado del botón
    btnExportar.innerHTML = originalState.html;
    btnExportar.disabled = originalState.disabled;
  }
}

// Eliminando el manejador de eventos duplicado ya que ahora está en DOMContentLoaded
