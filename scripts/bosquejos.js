// scripts/bosquejos.js
import { db } from './db.js';

// Elementos del DOM
const tablaBosquejos = document.querySelector('.data-table tbody');
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

// Variables de estado
let editando = false;

// Cargar bosquejos al iniciar la página
document.addEventListener('DOMContentLoaded', cargarBosquejos);

// Función para cargar los bosquejos desde Supabase
async function cargarBosquejos() {
  try {
    const { data: bosquejos, error } = await db.obtenerTodos('bosquejos');
    
    if (error) throw error;
    
    // Limpiar tabla
    tablaBosquejos.innerHTML = '';
    
    // Verificar si hay bosquejos
    if (bosquejos && bosquejos.length > 0) {
      // Ordenar bosquejos por número
      bosquejos.sort((a, b) => a.numero - b.numero);
      
      // Llenar la tabla con los bosquejos
      bosquejos.forEach(bosquejo => {
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
            <button class="btn-icon" title="Eliminar" data-id="${bosquejo.id}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        tablaBosquejos.appendChild(fila);
      });
      
      // Agregar event listeners a los botones
      agregarEventListenersBotones();
    } else {
      // Mostrar mensaje si no hay bosquejos
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td colspan="3" class="text-center">
          No hay bosquejos disponibles. Haz clic en "Nuevo Bosquejo" para agregar uno.
        </td>
      `;
      tablaBosquejos.appendChild(fila);
    }
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
  modalBosquejo.classList.add('show');
  document.body.style.overflow = 'hidden';
  
  // Enfocar el primer campo del formulario
  if (!editando) {
    setTimeout(() => numeroInput.focus(), 100);
  } else {
    setTimeout(() => tituloInput.focus(), 100);
  }
}

// Ocultar el modal
function ocultarModal() {
  modalBosquejo.classList.remove('show');
  document.body.style.overflow = '';
  formBosquejo.reset();
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

// Event Listeners
btnNuevoBosquejo.addEventListener('click', mostrarModalNuevoBosquejo);
formBosquejo.addEventListener('submit', manejarEnvioFormulario);
btnCerrarModal.addEventListener('click', ocultarModal);
btnCancelar.addEventListener('click', ocultarModal);

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

// Evento para la búsqueda
inputBusqueda.addEventListener('input', (e) => {
  const busqueda = e.target.value.toLowerCase();
  const filas = document.querySelectorAll('.data-table tbody tr');
  
  filas.forEach(fila => {
    const textoFila = fila.textContent.toLowerCase();
    if (textoFila.includes(busqueda)) {
      fila.style.display = '';
    } else {
      fila.style.display = 'none';
    }
  });
});
