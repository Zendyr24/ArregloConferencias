// scripts/congregaciones.js
import { db } from './db.js';

// XLSX will be loaded from CDN in the HTML file

// Elementos del DOM
const tablaCongregaciones = document.querySelector('.data-table tbody');
const paginationStart = document.getElementById('pagination-start');
const paginationEnd = document.getElementById('pagination-end');
const paginationTotal = document.getElementById('pagination-total');
const paginationPrev = document.getElementById('pagination-prev');
const paginationNext = document.getElementById('pagination-next');
const btnNuevaCongregacion = document.querySelector('.btn-primary');
const inputBusqueda = document.getElementById('buscarCongregacion');
const btnLimpiarBusqueda = document.getElementById('limpiarBusqueda');
const modalCongregacion = document.getElementById('modalCongregacion');
const formCongregacion = document.getElementById('formCongregacion');
const modalTitle = document.querySelector('.modal-title');
const btnCerrarModal = document.querySelector('.btn-close');
const btnCancelar = document.querySelector('.btn-secondary');
const nombreInput = document.getElementById('nombre');
const circuitoInput = document.getElementById('circuito');
const direccionInput = document.getElementById('direccion');
const horarioInput = document.getElementById('horario');
const congregacionIdInput = document.getElementById('congregacionId');

// Variables de estado
let editando = false;
let currentPage = 1;
const itemsPerPage = 50;
let totalCongregaciones = 0;
let allCongregaciones = [];
let allCongregacionesFiltradas = [];

// Inicializar la lista filtrada con todas las congregaciones
allCongregacionesFiltradas = [...allCongregaciones];

// Función para cargar las congregaciones desde la base de datos
async function cargarCongregaciones() {
  try {
    mostrarCarga(true);
    const { data: congregaciones, error } = await db.obtenerTodos('congregacion');
    
    if (error) throw error;
    
    allCongregaciones = congregaciones;
    allCongregacionesFiltradas = [...congregaciones];
    totalCongregaciones = allCongregaciones.length;
    
    // Actualizar la tabla y controles de paginación
    actualizarTabla();
    actualizarControlesPaginacion();
    
    // Agregar manejadores de eventos después de cargar los datos
    agregarEventListenersBotones();
    
    return allCongregaciones;
  } catch (error) {
    console.error('Error al cargar las congregaciones:', error);
    mostrarAlerta('Error al cargar las congregaciones. Por favor, intente de nuevo.', 'error');
    return [];
  } finally {
    mostrarCarga(false);
  }
}

// Función para mostrar/ocultar indicador de carga
function mostrarCarga(mostrar) {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = mostrar ? 'flex' : 'none';
  }
}

// Función para actualizar la tabla con las congregaciones de la página actual
function actualizarTabla() {
  // Usar las congregaciones filtradas si existen, de lo contrario usar todas
  const congregacionesAMostrar = allCongregacionesFiltradas.length > 0 ? allCongregacionesFiltradas : allCongregaciones;
  totalCongregaciones = congregacionesAMostrar.length;
  
  // Calcular índices de los elementos a mostrar
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const congregacionesPaginadas = congregacionesAMostrar.slice(startIndex, endIndex);
  
  // Limpiar tablas existentes
  if (tablaCongregaciones) {
    tablaCongregaciones.innerHTML = '';
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
  if (tablaCongregaciones) {
    if (congregacionesPaginadas.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="5" class="text-center py-4">
          No se encontraron congregaciones. ¡Crea tu primera congregación!
        </td>
      `;
      tablaCongregaciones.appendChild(tr);
    } else {
      congregacionesPaginadas.forEach(congregacion => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="col-nombre">${congregacion.nombre || ''}</td>
          <td class="col-circuito">${congregacion.circuito || ''}</td>
          <td class="col-direccion">${congregacion.direccion || ''}</td>
          <td class="col-horario">${congregacion.horario || ''}</td>
          <td class="col-acciones text-center">
            <button class="btn-icon" data-action="edit" data-id="${congregacion.id}" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon text-danger" data-action="delete" data-id="${congregacion.id}" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        tablaCongregaciones.appendChild(tr);
      });
    }
  }
  
  // Actualizar la vista móvil
  if (congregacionesPaginadas.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'mobile-table-row text-center py-4';
    emptyMessage.textContent = 'No se encontraron congregaciones. ¡Crea tu primera congregación!';
    mobileTableContainer.innerHTML = '';
    mobileTableContainer.appendChild(emptyMessage);
  } else {
    mobileTableContainer.innerHTML = '';
    
    congregacionesPaginadas.forEach(congregacion => {
      const card = document.createElement('div');
      card.className = 'mobile-table-row';
      card.innerHTML = `
        <div class="mobile-table-cell">
          <span class="label">Nombre:</span>
          <span class="value">${congregacion.nombre || 'Sin nombre'}</span>
        </div>
        <div class="mobile-table-cell">
          <span class="label">Circuito:</span>
          <span class="value">${congregacion.circuito || 'No especificado'}</span>
        </div>
        <div class="mobile-table-cell">
          <span class="label">Dirección:</span>
          <span class="value">${congregacion.direccion || 'No especificada'}</span>
        </div>
        <div class="mobile-table-cell">
          <span class="label">Horario:</span>
          <span class="value">${congregacion.horario || 'No especificado'}</span>
        </div>
        <div class="mobile-table-actions">
          <button class="btn-action" data-action="edit" data-id="${congregacion.id}" title="Editar">
            <i class="fas fa-edit"></i>
            <span>Editar</span>
          </button>
          <button class="btn-action text-danger" data-action="delete" data-id="${congregacion.id}" title="Eliminar">
            <i class="fas fa-trash"></i>
            <span>Eliminar</span>
          </button>
        </div>
      `;
      mobileTableContainer.appendChild(card);
    });
  }
  
  // Actualizar la vista móvil
  if (congregacionesPaginadas.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'mobile-table-row text-center py-4';
    emptyMessage.textContent = 'No se encontraron congregaciones. ¡Crea tu primera congregación!';
    mobileTableContainer.innerHTML = '';
    mobileTableContainer.appendChild(emptyMessage);
  } else {
    mobileTableContainer.innerHTML = '';
    
    congregacionesPaginadas.forEach(congregacion => {
      const card = document.createElement('div');
      card.className = 'mobile-table-row';
      card.innerHTML = `
        <div class="mobile-table-cell">
          <span class="label">Nombre:</span>
          <span class="value">${congregacion.nombre || 'Sin nombre'}</span>
        </div>
        <div class="mobile-table-cell">
          <span class="label">Circuito:</span>
          <span class="value">${congregacion.circuito || 'No especificado'}</span>
        </div>
        <div class="mobile-table-cell">
          <span class="label">Dirección:</span>
          <span class="value">${congregacion.direccion || 'No especificada'}</span>
        </div>
        <div class="mobile-table-cell">
          <span class="label">Horario:</span>
          <span class="value">${congregacion.horario || 'No especificado'}</span>
        </div>
        <div class="mobile-table-actions">
          <button class="btn-action" data-action="edit" data-id="${congregacion.id}" title="Editar">
            <i class="fas fa-edit"></i>
            <span>Editar</span>
          </button>
          <button class="btn-action text-danger" data-action="delete" data-id="${congregacion.id}" title="Eliminar">
            <i class="fas fa-trash"></i>
            <span>Eliminar</span>
          </button>
        </div>
      `;
      mobileTableContainer.appendChild(card);
    });
  }
  
  // Actualizar controles de paginación
  actualizarControlesPaginacion();
  
  // Agregar manejadores de eventos a los botones
  agregarEventListenersBotones();
}

// Función para actualizar los controles de paginación
function actualizarControlesPaginacion() {
  if (!paginationStart || !paginationEnd || !paginationTotal) return;
  
  const totalPages = Math.ceil(totalCongregaciones / itemsPerPage);
  const startItem = totalCongregaciones > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalCongregaciones);
  
  paginationStart.textContent = startItem;
  paginationEnd.textContent = endItem;
  paginationTotal.textContent = totalCongregaciones;
  
  if (paginationPrev) {
    paginationPrev.disabled = currentPage === 1;
    paginationPrev.classList.toggle('disabled', currentPage === 1);
  }
  
  if (paginationNext) {
    paginationNext.disabled = currentPage >= totalPages || totalCongregaciones === 0;
    paginationNext.classList.toggle('disabled', currentPage >= totalPages || totalCongregaciones === 0);
  }
}

// Función para cambiar de página
function cambiarPagina(direccion) {
  const totalPages = Math.ceil(totalCongregaciones / itemsPerPage);
  
  if (direccion === 'prev' && currentPage > 1) {
    currentPage--;
    actualizarTabla();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (direccion === 'next' && currentPage < totalPages) {
    currentPage++;
    actualizarTabla();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (typeof direccion === 'number' && direccion >= 1 && direccion <= totalPages) {
    currentPage = direccion;
    actualizarTabla();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
// Función para agregar manejadores de eventos a los botones
function agregarEventListenersBotones() {
  // Botones de acción (Editar/Eliminar) en la tabla de escritorio
  document.querySelectorAll('[data-action]').forEach(button => {
    // Remover cualquier manejador de eventos existente para evitar duplicados
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    const action = newButton.getAttribute('data-action');
    const id = parseInt(newButton.getAttribute('data-id'));
    
    // Variable para controlar si ya se está procesando un clic
    let procesando = false;
    
    newButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Si ya se está procesando un clic, no hacer nada
      if (procesando) return;
      
      try {
        procesando = true;
        
        switch (action) {
          case 'edit':
            await editarCongregacion(id);
            break;
            
          case 'delete':
            if (confirm('¿Estás seguro de que deseas eliminar esta congregación?')) {
              await eliminarCongregacion(id);
            }
            break;
        }
      } catch (error) {
        console.error('Error en el manejador de eventos:', error);
      } finally {
        // Restablecer el estado de procesamiento después de un pequeño retraso
        setTimeout(() => {
          procesando = false;
        }, 500);
      }
    });
  });

  // Botón Nueva Congregación
  if (btnNuevaCongregacion) {
    btnNuevaCongregacion.removeEventListener('click', mostrarModalNuevaCongregacion);
    btnNuevaCongregacion.addEventListener('click', mostrarModalNuevaCongregacion);
  }

  // Botones de paginación
  if (paginationPrev) {
    paginationPrev.removeEventListener('click', () => cambiarPagina('prev'));
    paginationPrev.addEventListener('click', () => cambiarPagina('prev'));
  }
  
  if (paginationNext) {
    paginationNext.removeEventListener('click', () => cambiarPagina('next'));
    paginationNext.addEventListener('click', () => cambiarPagina('next'));
  }
  
  // Buscador
  if (inputBusqueda) {
    inputBusqueda.removeEventListener('input', manejarBusqueda);
    inputBusqueda.addEventListener('input', manejarBusqueda);
  }
  
  // Botón limpiar búsqueda
  if (btnLimpiarBusqueda) {
    btnLimpiarBusqueda.removeEventListener('click', limpiarBusqueda);
    btnLimpiarBusqueda.addEventListener('click', limpiarBusqueda);
  }
}

// Función para manejar la búsqueda
function manejarBusqueda(e) {
  const termino = e.target.value.trim().toLowerCase();
  
  if (termino === '') {
    allCongregacionesFiltradas = [...allCongregaciones];
  } else {
    allCongregacionesFiltradas = allCongregaciones.filter(congregacion => {
      return (
        (congregacion.nombre && congregacion.nombre.toLowerCase().includes(termino)) ||
        (congregacion.circuito && congregacion.circuito.toLowerCase().includes(termino)) ||
        (congregacion.direccion && congregacion.direccion.toLowerCase().includes(termino)) ||
        (congregacion.horario && congregacion.horario.toLowerCase().includes(termino))
      );
    });
  }
  
  // Reiniciar a la primera página al buscar
  currentPage = 1;
  actualizarTabla();
  
  // Mostrar/ocultar botón de limpiar búsqueda
  if (btnLimpiarBusqueda) {
    btnLimpiarBusqueda.style.display = termino ? 'block' : 'none';
  }
}

// Función para limpiar la búsqueda
function limpiarBusqueda() {
  if (inputBusqueda) {
    inputBusqueda.value = '';
    allCongregacionesFiltradas = [...allCongregaciones];
    currentPage = 1;
    actualizarTabla();
    
    if (btnLimpiarBusqueda) {
      btnLimpiarBusqueda.style.display = 'none';
    }
  }
}

// Función para manejar el envío del formulario
async function manejarEnvioFormulario(e) {
  e.preventDefault();
  
  // Validar el formulario
  if (!formCongregacion.checkValidity()) {
    formCongregacion.classList.add('was-validated');
    return;
  }
  
  try {
    mostrarCarga(true);
    
    const datosCongregacion = {
      nombre: nombreInput ? nombreInput.value.trim() : '',
      circuito: circuitoInput ? circuitoInput.value.trim() : '',
      direccion: direccionInput ? direccionInput.value.trim() : '',
      horario: horarioInput ? horarioInput.value.trim() : ''
    };
    
    // Validar que el nombre no esté vacío
    if (!datosCongregacion.nombre) {
      throw new Error('El nombre de la congregación es obligatorio');
    }
    
    let resultado;
    
    if (editando && congregacionIdInput && congregacionIdInput.value) {
      // Actualizar congregación existente
      const id = parseInt(congregacionIdInput.value);
      const { data, error } = await db.actualizar('congregacion', id, datosCongregacion);
      
      if (error) throw error;
      
      resultado = data;
      mostrarAlerta('Congregación actualizada correctamente', 'success');
    } else {
      // Crear nueva congregación
      const { data, error } = await db.insertar('congregacion', datosCongregacion);
      
      if (error) throw error;
      
      resultado = data;
      mostrarAlerta('Congregación creada correctamente', 'success');
    }
    
    // Cerrar el modal y actualizar la tabla
    ocultarModal();
    await cargarCongregaciones();
    
    return resultado;
  } catch (error) {
    console.error('Error al guardar la congregación:', error);
    const mensajeError = error.message || 'Error al guardar la congregación. Por favor, intente de nuevo.';
    mostrarAlerta(mensajeError, 'error');
    return null;
  } finally {
    mostrarCarga(false);
  }
}

// Función para mostrar el modal
function mostrarModal() {
  if (!modalCongregacion) return;
  
  // Mostrar el modal
  modalCongregacion.style.display = 'block';
  modalCongregacion.removeAttribute('aria-hidden');
  modalCongregacion.setAttribute('aria-modal', 'true');
  modalCongregacion.classList.add('show');
  
  // Bloquear el scroll del body
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = '15px'; // Compensar el scrollbar
  
  // Guardar el elemento que tenía el foco antes de abrir el modal
  modalCongregacion._focusedElementBeforeModal = document.activeElement;
  
  // Enfocar el primer elemento interactivo del modal
  const focusableElements = modalCongregacion.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const firstFocusableElement = focusableElements[0];
  
  if (firstFocusableElement) {
    setTimeout(() => firstFocusableElement.focus(), 100);
  }
  
  // Agregar manejador de eventos para la tecla Tab
  modalCongregacion._handleTabKey = (e) => {
    if (e.key === 'Tab') {
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }
      
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  };
    
  // Agregar manejador de eventos para la tecla Escape
  modalCongregacion._handleEscape = (e) => {
    if (e.key === 'Escape') {
      ocultarModal();
    }
  };
  
  // Agregar manejador de clic fuera del modal
  modalCongregacion._handleOutsideClick = (e) => {
    if (e.target === modalCongregacion) {
      ocultarModal();
    }
  };
  
  // Agregar manejadores de eventos
  document.addEventListener('keydown', modalCongregacion._handleTabKey);
  document.addEventListener('keydown', modalCongregacion._handleEscape);
  modalCongregacion.addEventListener('click', modalCongregacion._handleOutsideClick);
  
  // Agregar clase al body para estilos específicos del modal
  document.body.classList.add('modal-open');
  
  // Desplazar el foco al modal
  modalCongregacion.setAttribute('tabindex', '-1');
  modalCongregacion.focus();
}

// Función para ocultar el modal
function ocultarModal() {
  if (!modalCongregacion) return;
  
  // Restaurar el scroll del body
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  
  // Ocultar el modal
  modalCongregacion.style.display = 'none';
  modalCongregacion.setAttribute('aria-hidden', 'true');
  modalCongregacion.removeAttribute('aria-modal');
  modalCongregacion.classList.remove('show');
  
  // Eliminar manejadores de eventos
  if (modalCongregacion._handleTabKey) {
    document.removeEventListener('keydown', modalCongregacion._handleTabKey);
  }
  
  if (modalCongregacion._handleEscape) {
    document.removeEventListener('keydown', modalCongregacion._handleEscape);
  }
  
  if (modalCongregacion._handleOutsideClick) {
    modalCongregacion.removeEventListener('click', modalCongregacion._handleOutsideClick);
  }
  
  // Restaurar el foco al elemento que lo tenía antes de abrir el modal
  if (modalCongregacion._focusedElementBeforeModal && 
      'focus' in modalCongregacion._focusedElementBeforeModal) {
    modalCongregacion._focusedElementBeforeModal.focus();
  }
  
  // Eliminar propiedades personalizadas
  delete modalCongregacion._focusedElementBeforeModal;
  delete modalCongregacion._handleTabKey;
  delete modalCongregacion._handleEscape;
  delete modalCongregacion._handleOutsideClick;
  
  // Eliminar clase del body
  document.body.classList.remove('modal-open');
  
  // Limpiar el formulario
  if (formCongregacion) {
    formCongregacion.reset();
    formCongregacion.classList.remove('was-validated');
  }
}

// Función para mostrar el modal de nueva congregación
function mostrarModalNuevaCongregacion() {
  editando = false;
  modalTitle.textContent = 'Nueva Congregación';
  
  // Limpiar el formulario
  if (formCongregacion) {
    formCongregacion.reset();
    formCongregacion.classList.remove('was-validated');
    
    // Limpiar el ID para asegurar que es una nueva entrada
    if (congregacionIdInput) {
      congregacionIdInput.value = '';
    }
  }
  
  // Mostrar el modal
  mostrarModal();
  
  // Establecer foco en el primer campo del formulario
  if (nombreInput) {
    setTimeout(() => nombreInput.focus(), 100);
  }
}

// Función para editar una congregación existente
async function editarCongregacion(id) {
  try {
    if (!id) {
      console.error('ID de congregación no proporcionado');
      return;
    }

    // Buscar la congregación por ID
    const { data: congregacion, error } = await db.obtenerPorId('congregacion', id);
    
    if (error) throw error;
    if (!congregacion) {
      console.error('No se encontró la congregación con ID:', id);
      mostrarAlerta('No se encontró la congregación seleccionada', 'error');
      return;
    }

    // Configurar el formulario con los datos de la congregación
    editando = true;
    modalTitle.textContent = 'Editar Congregación';
    
    // Limpiar el formulario primero
    if (formCongregacion) {
      formCongregacion.reset();
      formCongregacion.classList.remove('was-validated');
      
      // Establecer los valores en los campos del formulario
      if (congregacionIdInput) congregacionIdInput.value = id;
      if (nombreInput) nombreInput.value = congregacion.nombre || '';
      if (circuitoInput) circuitoInput.value = congregacion.circuito || '';
      if (direccionInput) direccionInput.value = congregacion.direccion || '';
      if (horarioInput) horarioInput.value = congregacion.horario || '';
    }
    
    // Mostrar el modal
    mostrarModal();
    
    // Establecer foco en el primer campo del formulario
    if (nombreInput) {
      setTimeout(() => nombreInput.focus(), 100);
    }
    
  } catch (error) {
    console.error('Error al cargar la congregación para editar:', error);
    mostrarAlerta('Error al cargar la congregación: ' + (error.message || 'Error desconocido'), 'error');
  }
}

// Función para eliminar una congregación
async function eliminarCongregacion(id) {
  try {
    if (!id) {
      console.error('ID de congregación no proporcionado');
      return;
    }

    // Mostrar indicador de carga
    mostrarCarga(true);

    // Eliminar la congregación de la base de datos
    const { error } = await db.eliminar('congregacion', id);
    
    if (error) throw error;
    
    // Mostrar mensaje de éxito
    mostrarAlerta('Congregación eliminada correctamente', 'success');
    
    // Recargar la lista de congregaciones
    await cargarCongregaciones();
    
  } catch (error) {
    console.error('Error al eliminar la congregación:', error);
    mostrarAlerta('Error al eliminar la congregación: ' + (error.message || 'Error desconocido'), 'error');
  } finally {
    // Ocultar indicador de carga
    mostrarCarga(false);
  }
}

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo = 'info') {
  // Implementar lógica para mostrar alertas (puedes usar un sistema de notificaciones existente)
  alert(`${tipo.toUpperCase()}: ${mensaje}`);
}

// Función para buscar en todos los registros
function buscarEnTodosLosRegistros(termino) {
  if (!termino || termino.trim() === '') {
    // Si no hay término de búsqueda, mostrar todos los registros
    allCongregacionesFiltradas = [...allCongregaciones];
    currentPage = 1;
    actualizarTabla();
    return;
  }

  const terminoLower = termino.toLowerCase();
  
  // Filtrar todos los registros
  allCongregacionesFiltradas = allCongregaciones.filter(congregacion => {
    const textoCompleto = `${congregacion.nombre || ''} ${congregacion.circuito || ''} ${congregacion.direccion || ''}`.toLowerCase();
    return textoCompleto.includes(terminoLower);
  });
  
  currentPage = 1; // Volver a la primera página con los resultados
  totalCongregaciones = allCongregacionesFiltradas.length;
  actualizarTabla();
}

// Función para manejar cambios en el tamaño de la ventana
function manejarCambioTamanoVentana() {
  const mobileTableContainer = document.querySelector('.mobile-table');
  const tableParent = document.querySelector('.table-responsive');
  
  if (window.innerWidth < 768) {
    // Si estamos en móvil, asegurarse de que el contenedor móvil exista
    if (!mobileTableContainer && tableParent) {
      const newMobileContainer = document.createElement('div');
      newMobileContainer.className = 'mobile-table d-md-none';
      tableParent.insertBefore(newMobileContainer, tableParent.firstChild);
      actualizarTabla(); // Vuelve a renderizar para asegurar que se muestre la vista móvil
    }
  } else {
    // Si estamos en escritorio, eliminar el contenedor móvil si existe
    if (mobileTableContainer && mobileTableContainer.parentNode) {
      mobileTableContainer.parentNode.removeChild(mobileTableContainer);
    }
  }
}

// Función para exportar a Excel
async function exportToExcel() {
  try {
    // Obtener todas las congregaciones
    const { data: congregaciones, error } = await db.obtenerTodos('congregacion');
    
    if (error) throw error;
    
    // Preparar los datos para la exportación (sin ID ni fecha de creación)
    const datosExportar = congregaciones.map(congregacion => ({
      'Nombre': congregacion.nombre || '',
      'Circuito': congregacion.circuito || '',
      'Dirección': congregacion.direccion || '',
      'Horario': congregacion.horario || ''
    }));
    
    // Crear un nuevo libro de trabajo
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExportar);
    
    // Ajustar el ancho de las columnas
    const columnWidths = [
      { wch: 30 }, // Nombre
      { wch: 25 }, // Circuito
      { wch: 50 }, // Dirección
      { wch: 20 }  // Horario
    ];
    ws['!cols'] = columnWidths;
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Congregaciones');
    
    // Generar el archivo Excel y descargarlo
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `congregaciones_${fecha}.xlsx`);
    
    mostrarAlerta('Exportación completada con éxito', 'success');
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    mostrarAlerta('Error al exportar a Excel: ' + (error.message || 'Error desconocido'), 'error');
  }
}

// Función para importar desde Excel
async function importFromExcel(event) {
  try {
    const file = event.target.files[0];
    if (!file) return;
    
    // Verificar la extensión del archivo
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      mostrarAlerta('Por favor, sube un archivo de Excel válido (.xlsx o .xls)', 'advertencia');
      return;
    }
    
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    if (jsonData.length === 0) {
      mostrarAlerta('El archivo está vacío', 'advertencia');
      return;
    }
    
    // Mostrar indicador de carga
    mostrarCarga(true);
    
    // Obtener los nombres de las congregaciones existentes para validar duplicados
    const { data: congregacionesExistentes } = await db.obtenerTodos('congregacion');
    const nombresExistentes = new Set(congregacionesExistentes.map(c => c.nombre?.toLowerCase().trim()));
    
    // Mapear y validar los datos del Excel
    const congregaciones = [];
    const duplicados = [];
    
    jsonData.forEach((row, index) => {
      const nombre = (row['Nombre'] || '').trim();
      
      // Validar que el nombre no esté vacío
      if (!nombre) {
        console.warn(`Fila ${index + 2}: Se omitió una congregación sin nombre`);
        return;
      }
      
      // Verificar si ya existe una congregación con el mismo nombre
      if (nombresExistentes.has(nombre.toLowerCase())) {
        duplicados.push(nombre);
        return;
      }
      
      // Agregar a la lista de congregaciones a importar
      congregaciones.push({
        nombre,
        circuito: (row['Circuito'] || '').trim(),
        direccion: (row['Dirección'] || row['Direccion'] || '').trim(),
        horario: (row['Horario'] || '').trim()
      });
      
      // Agregar el nombre al conjunto para detectar duplicados dentro del mismo archivo
      nombresExistentes.add(nombre.toLowerCase());
    });
    
    // Mostrar advertencia si hay duplicados
    if (duplicados.length > 0) {
      mostrarAlerta(
        `Se omitieron ${duplicados.length} congregaciones que ya existen en la base de datos.`,
        'advertencia'
      );
    }
    
    // Si no hay congregaciones válidas para importar
    if (congregaciones.length === 0) {
      mostrarAlerta('No hay congregaciones nuevas para importar', 'información');
      return;
    }
    
    // Insertar las congregaciones una por una
    let successCount = 0;
    const errors = [];
    
    for (const congregacion of congregaciones) {
      try {
        const { error } = await db.insertar('congregacion', congregacion);
        if (error) {
          console.error(`Error al insertar la congregación ${congregacion.nombre}:`, error);
          errors.push(`- ${congregacion.nombre}: ${error.message || 'Error desconocido'}`);
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`Error al insertar la congregación ${congregacion.nombre}:`, err);
        errors.push(`- ${congregacion.nombre}: ${err.message || 'Error al procesar'}`);
      }
    }
    
    if (errors.length > 0) {
      console.warn('Errores durante la importación:', errors);
    }
    
    // Recargar la lista de congregaciones
    await cargarCongregaciones();
    
    let mensaje = `Se importaron ${successCount} de ${congregaciones.length} congregaciones correctamente.`;
    
    if (duplicados.length > 0) {
      mensaje += `\nSe omitieron ${duplicados.length} duplicados.`;
    }
    
    if (errors.length > 0) {
      mensaje += `\nOcurrieron ${errors.length} errores durante la importación.`;
      console.error('Errores de importación:', errors);
    }
    
    mostrarAlerta(mensaje, errors.length > 0 ? 'advertencia' : 'éxito');
    
  } catch (error) {
    console.error('Error al importar desde Excel:', error);
    mostrarAlerta('Error al importar desde Excel: ' + (error.message || 'Error desconocido'), 'error');
  } finally {
    // Limpiar el input de archivo
    event.target.value = '';
  }
}

// Función para exportar a PDF
async function exportToPDF() {
  try {
    // Mostrar indicador de carga
    mostrarCarga(true);
    
    // Obtener todas las congregaciones
    const { data: congregaciones, error } = await db.obtenerTodos('congregacion');
    
    if (error) throw error;
    
    // Crear un nuevo documento PDF en orientación horizontal
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Título del documento
    const title = 'Lista de Congregaciones';
    const date = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Configuración de estilos
    const styles = {
      header: {
        fontSize: 18,
        bold: true,
        color: '#2c3e50',
        margin: { top: 20, left: 20, right: 20, bottom: 10 }
      },
      subheader: {
        fontSize: 12,
        color: '#7f8c8d',
        margin: { bottom: 20 }
      },
      tableHeader: {
        fillColor: '#3498db',
        textColor: '#ffffff',
        fontStyle: 'bold',
        fontSize: 11
      },
      tableBody: {
        textColor: '#2c3e50',
        fontSize: 10
      },
      tableAlternate: {
        fillColor: '#f8f9fa'
      }
    };
    
    // Agregar título y fecha
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(styles.header.fontSize);
    doc.setTextColor(styles.header.color);
    doc.text(title, 14, 20);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(styles.subheader.fontSize);
    doc.setTextColor(styles.subheader.color);
    doc.text(`Generado el: ${date}`, 14, 28);
    
    // Preparar los datos para la tabla
    const tableColumn = ['Nombre', 'Circuito', 'Dirección', 'Horario'];
    const tableRows = [];
    
    congregaciones.forEach(congregacion => {
      const congregacionData = [
        congregacion.nombre || 'N/A',
        congregacion.circuito || 'N/A',
        congregacion.direccion || 'N/A',
        congregacion.horario || 'N/A'
      ];
      tableRows.push(congregacionData);
    });
    
    // Configuración de la tabla
    const tableConfig = {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      headStyles: styles.tableHeader,
      bodyStyles: styles.tableBody,
      alternateRowStyles: styles.tableAlternate,
      margin: { top: 20, left: 10, right: 10 },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: '#e0e0e0',
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' }
      },
      didDrawPage: function(data) {
        // Pie de página
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.setFontSize(10);
        doc.setTextColor(150);
        
        // Número de página
        const pageCount = doc.internal.getNumberOfPages();
        const currentPage = data.pageNumber;
        
        doc.text(
          `Página ${currentPage} de ${pageCount}`,
          pageSize.width / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
    };
    
    // Generar la tabla
    doc.autoTable(tableConfig);
    
    // Guardar el PDF
    const fileName = `congregaciones_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    mostrarAlerta('El archivo PDF se ha generado correctamente', 'éxito');
    
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    mostrarAlerta('Error al generar el PDF: ' + (error.message || 'Error desconocido'), 'error');
  } finally {
    mostrarCarga(false);
  }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Cargar las congregaciones al iniciar
  cargarCongregaciones();
  
  // Función para alternar el panel de importación/exportación
  function toggleImportExportPanel() {
    const toggleBtn = document.getElementById('toggleImportExport');
    const panel = document.getElementById('importExportPanel');
    
    if (!panel || !toggleBtn) return;
    
    // Alternar visibilidad
    const isVisible = panel.style.display !== 'none';
    
    if (isVisible) {
      panel.style.display = 'none';
      panel.classList.remove('visible');
      toggleBtn.setAttribute('aria-expanded', 'false');
    } else {
      panel.style.display = 'block';
      panel.classList.add('visible');
      toggleBtn.setAttribute('aria-expanded', 'true');
    }
    
    // Actualizar ícono
    const icon = toggleBtn.querySelector('i');
    if (icon) {
      icon.className = isVisible ? 'fas fa-chevron-down ms-2' : 'fas fa-chevron-up ms-2';
    }
  }
  
  // Configurar event listener para cambios de tamaño de ventana
  window.addEventListener('resize', manejarCambioTamanoVentana);
  
  // Asegurarse de que la vista correcta se muestre en la carga inicial
  manejarCambioTamanoVentana();
  
  // Configurar event listeners de paginación
  if (paginationPrev) {
    paginationPrev.addEventListener('click', () => cambiarPagina('prev'));
  }
  
  if (paginationNext) {
    paginationNext.addEventListener('click', () => cambiarPagina('next'));
  }
  
  // Configurar event listeners de los botones
  if (btnNuevaCongregacion) {
    btnNuevaCongregacion.addEventListener('click', mostrarModalNuevaCongregacion);
  }
  
  // Configurar event listeners para importar/exportar
  const btnExportar = document.getElementById('btnExportar');
  const btnImportar = document.getElementById('btnImportar');
  const btnExportarPDF = document.getElementById('btnExportarPDF');
  const toggleImportExport = document.getElementById('toggleImportExport');
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.xlsx, .xls';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  
  // Configurar el toggle del panel de importar/exportar
  if (toggleImportExport) {
    toggleImportExport.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleImportExportPanel();
    });
    
    // Inicializar como colapsado
    const panel = document.getElementById('importExportPanel');
    if (panel) {
      panel.style.display = 'none';
      // Usar setTimeout para permitir que se apliquen los estilos iniciales
      setTimeout(() => {
        panel.style.display = '';
      }, 10);
    }
  }
  
  // Cerrar el panel al hacer clic fuera de él
  document.addEventListener('click', (e) => {
    const panel = document.getElementById('importExportPanel');
    const toggleBtn = document.getElementById('toggleImportExport');
    
    if (!panel || !toggleBtn) return;
    
    // Verificar si el clic fue fuera del panel y del botón de toggle
    if (!panel.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
      // Usar el mismo método para ocultar que en la función toggle
      if (panel.style.display !== 'none') {
        panel.style.display = 'none';
        panel.classList.remove('visible');
        toggleBtn.setAttribute('aria-expanded', 'false');
        const icon = toggleBtn.querySelector('i');
        if (icon) {
          icon.className = 'fas fa-chevron-down ms-2';
        }
      }
    }
  });
  
  if (btnExportar) {
    btnExportar.addEventListener('click', exportToExcel);
  }
  
  if (btnImportar) {
    btnImportar.addEventListener('click', () => fileInput.click());
  }
  
  if (btnExportarPDF) {
    btnExportarPDF.addEventListener('click', exportToPDF);
  }
  
  fileInput.addEventListener('change', importFromExcel);
  
  // Formulario
  if (formCongregacion) {
    formCongregacion.addEventListener('submit', manejarEnvioFormulario);
  }
  
  // Botones del modal
  if (btnCerrarModal) btnCerrarModal.addEventListener('click', ocultarModal);
  if (btnCancelar) btnCancelar.addEventListener('click', ocultarModal);
  
  // Cerrar modal al hacer clic fuera del contenido
  modalCongregacion.addEventListener('click', (e) => {
    if (e.target === modalCongregacion) {
      ocultarModal();
    }
  });
  
  // Configurar búsqueda
  if (inputBusqueda) {
    // Asegurarse de que el contenedor de búsqueda tenga la clase correcta
    const searchContainer = inputBusqueda.closest('.search-input');
    if (searchContainer) {
      searchContainer.classList.add('search-container');
      
      // Crear y configurar el botón de limpiar
      const btnLimpiarBusqueda = document.createElement('button');
      btnLimpiarBusqueda.type = 'button';
      btnLimpiarBusqueda.className = 'btn-clear-search';
      btnLimpiarBusqueda.innerHTML = '<i class="fas fa-times"></i>';
      btnLimpiarBusqueda.title = 'Limpiar búsqueda';
      btnLimpiarBusqueda.style.display = 'none';
      
      // Insertar el botón después del input de búsqueda
      searchContainer.appendChild(btnLimpiarBusqueda);
      
      // Evento para la búsqueda con debounce
      let timeoutBusqueda = null;
      inputBusqueda.addEventListener('input', (e) => {
        const termino = e.target.value.trim();
        
        // Mostrar/ocultar botón de limpiar
        if (termino !== '') {
          btnLimpiarBusqueda.style.display = 'flex';
        } else {
          btnLimpiarBusqueda.style.display = 'none';
        }
        
        // Limpiar timeout anterior
        clearTimeout(timeoutBusqueda);
        
        // Establecer un nuevo timeout para la búsqueda
        timeoutBusqueda = setTimeout(() => {
          buscarEnTodosLosRegistros(termino);
        }, 300);
      });
      
      // Limpiar la búsqueda al hacer clic en el botón
      btnLimpiarBusqueda.addEventListener('click', () => {
        inputBusqueda.value = '';
        btnLimpiarBusqueda.style.display = 'none';
        buscarEnTodosLosRegistros('');
        inputBusqueda.focus();
      });
    }
  }
  
  // Cargar los datos iniciales
  cargarCongregaciones();
});

// Hacer las funciones disponibles globalmente
window.cargarCongregaciones = cargarCongregaciones;
window.mostrarModalNuevaCongregacion = mostrarModalNuevaCongregacion;
window.editarCongregacion = editarCongregacion;
