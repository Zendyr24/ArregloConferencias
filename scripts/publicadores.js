import { supabase } from './supabase.js';
import { getCurrentUser } from './auth/auth-utils.js';

export async function cargarPublicadores() {
  try {
    console.log('Iniciando carga de publicadores...');
    
    // Obtener el usuario actual del localStorage
    const user = getCurrentUser();
    
    if (!user) {
      console.error('No se pudo obtener la información del usuario');
      return;
    }
    
    console.log('Usuario autenticado:', user.id);

    // Obtener la información del usuario actual incluyendo la organización
    const { data: usuario, error: userInfoError } = await supabase
      .from('users')
      .select('organizacion_id')
      .eq('id', user.id)
      .single();

    if (userInfoError || !usuario) {
      console.error('Error al obtener información del usuario:', userInfoError);
      // Mostrar mensaje al usuario
      const tbody = document.querySelector('#tablaPublicadores tbody');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center">
              Error al cargar los datos. Por favor, recarga la página o contacta al administrador.
            </td>
          </tr>
        `;
      }
      return;
    }

    console.log('Obteniendo publicadores para la organización:', usuario.organizacion_id);
    
    // Obtener los publicadores de la organización del usuario
    const { data: publicadores, error, status } = await supabase
      .from('publicadores')
      .select(`
        id,
        nombre,
        edad,
        bautizado,
        privilegio_servicio,
        responsabilidad,
        congregacion_id,
        congregacion:congregacion_id (nombre)
      `)
      .eq('organizacion_id', usuario.organizacion_id);
      
    console.log('Respuesta de Supabase - Estado:', status);
    console.log('Publicadores obtenidos:', publicadores);
    console.log('Error (si lo hay):', error);

    if (error) throw error;

    // Actualizar la tabla con los datos
    const tbody = document.querySelector('#tablaPublicadores tbody');
    const mobileTable = document.querySelector('.mobile-table');
    
    if (!tbody || !mobileTable) return;

    tbody.innerHTML = ''; // Limpiar la tabla
    mobileTable.innerHTML = ''; // Limpiar la vista móvil

    if (!publicadores || publicadores.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">No hay publicadores registrados</td>
        </tr>
      `;
      mobileTable.innerHTML = `
        <div class="mobile-empty">No hay publicadores registrados</div>
      `;
      return;
    }

    // Actualizar información de paginación
    document.getElementById('pagination-total').textContent = publicadores.length;
    document.getElementById('pagination-start').textContent = 1;
    document.getElementById('pagination-end').textContent = Math.min(publicadores.length, 10);

    // Llenar la tabla con los datos
    publicadores.forEach(publicador => {
      // Versión de escritorio
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="col-nombre">${publicador.nombre || ''}</td>
        <td class="col-congregacion">${publicador.congregacion?.nombre || 'Sin asignar'}</td>
        <td class="col-edad text-center">${publicador.edad || ''}</td>
        <td class="col-bautizado text-center">
          ${publicador.bautizado ? 'Sí' : 'No'}
        </td>
        <td>${publicador.privilegio_servicio || ''}</td>
        <td class="col-acciones text-center">
          <div class="acciones-botones">
            <button class="btn-icon text-primary" data-action="view" data-id="${publicador.id}" title="Ver">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn-icon" data-action="edit" data-id="${publicador.id}" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon text-danger" data-action="delete" data-id="${publicador.id}" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);

      // Versión móvil
      const mobileCard = document.createElement('div');
      mobileCard.className = 'mobile-table-row';
      mobileCard.innerHTML = `
        <div class="mobile-table-cell">
          <span class="label">Nombre:</span>
          <span class="value">${publicador.nombre || 'Sin nombre'}</span>
        </div>
        <div class="mobile-table-cell">
          <span class="label">Congregación:</span>
          <span class="value">${publicador.congregacion?.nombre || 'Sin asignar'}</span>
        </div>
        <div class="mobile-table-cell">
          <span class="label">Edad:</span>
          <span class="value">${publicador.edad || 'No especificada'}</span>
        </div>
        <div class="mobile-table-cell">
          <span class="label">Bautizado:</span>
          <span class="value">
            <span class="badge ${publicador.bautizado ? 'bg-success' : 'bg-secondary'}">
              ${publicador.bautizado ? 'Sí' : 'No'}
            </span>
          </span>
        </div>
        <div class="mobile-table-cell">
          <span class="label">Privilegio:</span>
          <span class="value">${publicador.privilegio_servicio || 'Ninguno'}</span>
        </div>
        <div class="mobile-table-actions">
          <button class="btn-action" data-action="view" data-id="${publicador.id}" title="Ver">
            <i class="fas fa-eye"></i>
            <span>Ver</span>
          </button>
          <button class="btn-action" data-action="edit" data-id="${publicador.id}" title="Editar">
            <i class="fas fa-edit"></i>
            <span>Editar</span>
          </button>
          <button class="btn-action text-danger" data-action="delete" data-id="${publicador.id}" title="Eliminar">
            <i class="fas fa-trash"></i>
            <span>Eliminar</span>
          </button>
        </div>
      `;
      mobileTable.appendChild(mobileCard);
    });

    // Configurar la paginación
    configurarPaginacion(publicadores);
    
    // Agregar event listeners a los botones usando delegación de eventos
    document.addEventListener('click', (e) => {
      // Manejar clic en botones de editar/eliminar
      const button = e.target.closest('[data-action]');
      if (!button) return;
      
      const action = button.dataset.action;
      const id = button.dataset.id;
      
      if (action === 'edit') {
        editarPublicador(id);
      } else if (action === 'delete') {
        eliminarPublicador(id);
      }
    });

  } catch (error) {
    console.error('Error al cargar los publicadores:', error);
    const tbody = document.querySelector('#tablaPublicadores tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-danger">
            Error al cargar los publicadores. Intente recargar la página.
          </td>
        </tr>
      `;
    }
  }
}

// Función para inicializar la página de publicadores
export function inicializarPaginaPublicadores() {
  // Cargar los publicadores al iniciar la página
  document.addEventListener('DOMContentLoaded', () => {
    cargarPublicadores();
    inicializarBusqueda();
    configurarEventListeners();
  });
}

// Función para alternar el panel de importación/exportación
function toggleImportExportPanel() {
  const panel = document.getElementById('importExportPanel');
  const toggleBtn = document.getElementById('toggleImportExport');
  
  if (!panel || !toggleBtn) return;
  
  const icon = toggleBtn.querySelector('i');
  
  // Alternar la clase visible
  panel.classList.toggle('visible');
  
  // Alternar los iconos
  if (panel.classList.contains('visible')) {
    icon.classList.remove('fa-chevron-down');
    icon.classList.add('fa-chevron-up');
  } else {
    icon.classList.remove('fa-chevron-up');
    icon.classList.add('fa-chevron-down');
  }
}

// Función para configurar los event listeners
function configurarEventListeners() {
  // Delegación de eventos para los botones de la tabla
  document.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    
    const action = button.getAttribute('data-action');
    const id = button.getAttribute('data-id');
    
    switch (action) {
      case 'view':
        verPublicador(id);
        break;
      case 'edit':
        editarPublicador(id);
        break;
      case 'delete':
        eliminarPublicador(id);
        break;
    }
  });

  // Botón de agregar publicador
  const btnAgregar = document.querySelector('#btnAgregarPublicador');
  if (btnAgregar) {
    btnAgregar.addEventListener('click', () => {
      // Lógica para mostrar el formulario de agregar
      console.log('Mostrar formulario para agregar publicador');
    });
  }

  // Configurar el botón de importar/exportar
  const toggleImportExport = document.getElementById('toggleImportExport');
  if (toggleImportExport) {
    toggleImportExport.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleImportExportPanel();
    });
    
    // Cerrar el panel al hacer clic fuera de él
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('importExportPanel');
      if (panel && panel.classList.contains('visible') && 
          !panel.contains(e.target) && 
          !toggleImportExport.contains(e.target)) {
        toggleImportExportPanel();
      }
    });
    
    // Cerrar con la tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const panel = document.getElementById('importExportPanel');
        if (panel && panel.classList.contains('visible')) {
          toggleImportExportPanel();
        }
      }
    });
  }

  // Botones de importar/exportar
  document.getElementById('btnImportar')?.addEventListener('click', importarDatos);
  document.getElementById('btnExportar')?.addEventListener('click', exportarAExcel);
  document.getElementById('btnExportarPDF')?.addEventListener('click', exportarAPDF);
}

// Función para inicializar la búsqueda
function inicializarBusqueda() {
  const buscarInput = document.getElementById('buscarPublicador');
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
      buscarPublicadores(buscarInput.value);
    });
    
    // Limpiar la búsqueda
    btnLimpiar.addEventListener('click', () => {
      buscarInput.value = '';
      btnLimpiar.style.display = 'none';
      buscarPublicadores('');
    });
    
    // Buscar al presionar Enter
    buscarInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        buscarPublicadores(buscarInput.value);
      }
    });
  }
}

// Función para buscar publicadores
function buscarPublicadores(termino) {
  const filas = document.querySelectorAll('#tablaPublicadores tbody tr');
  const itemsMoviles = document.querySelectorAll('.mobile-item');
  
  if (!termino || termino === '') {
    // Mostrar todos los elementos si no hay término de búsqueda
    filas.forEach(fila => fila.style.display = '');
    itemsMoviles.forEach(item => item.style.display = '');
    return;
  }
  
  const terminoMinuscula = termino.toLowerCase();
  
  // Buscar en la versión de escritorio
  filas.forEach(fila => {
    const textoFila = fila.textContent.toLowerCase();
    fila.style.display = textoFila.includes(terminoMinuscula) ? '' : 'none';
  });
  
  // Buscar en la versión móvil
  itemsMoviles.forEach(item => {
    const textoItem = item.textContent.toLowerCase();
    item.style.display = textoItem.includes(terminoMinuscula) ? '' : 'none';
  });
}

// Función para exportar a Excel
async function exportarAExcel() {
  try {
    // Obtener el usuario actual del localStorage
    const user = getCurrentUser();
    if (!user) {
      console.error('No se pudo obtener la información del usuario');
      return;
    }

    // Obtener la información del usuario actual incluyendo la organización
    const { data: usuario, error: userInfoError } = await supabase
      .from('users')
      .select('organizacion_id')
      .eq('id', user.id)
      .single();

    if (userInfoError || !usuario) {
      console.error('Error al obtener información del usuario:', userInfoError);
      alert('Error al obtener información del usuario');
      return;
    }

    // Obtener los publicadores de la organización
    const { data: publicadores, error } = await supabase
      .from('publicadores')
      .select(`
        id,
        nombre,
        edad,
        bautizado,
        privilegio_servicio,
        responsabilidad,
        congregacion:congregacion_id (nombre)
      `)
      .eq('organizacion_id', usuario.organizacion_id);

    if (error) throw error;

    // Formatear los datos para Excel
    const datosFormateados = publicadores.map(publicador => ({
      'ID': publicador.id,
      'Nombre': publicador.nombre || '',
      'Edad': publicador.edad || '',
      'Bautizado': publicador.bautizado ? 'Sí' : 'No',
      'Privilegio de Servicio': publicador.privilegio_servicio || '',
      'Responsabilidad': publicador.responsabilidad || '',
      'Congregación': publicador.congregacion?.nombre || 'Sin asignar'
    }));

    // Crear un libro de trabajo de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosFormateados);
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Publicadores');
    
    // Generar el archivo Excel
    XLSX.writeFile(wb, `publicadores_${new Date().toISOString().split('T')[0]}.xlsx`);
    
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    alert('Error al exportar los datos a Excel');
  }
}

// Función para importar desde Excel
async function importarDatos() {
  try {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls, .csv';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Leer el archivo
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Obtener la primera hoja
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        alert('El archivo está vacío');
        return;
      }
      
      // Obtener el usuario actual
      const user = getCurrentUser();
      if (!user) {
        alert('No se pudo obtener la información del usuario');
        return;
      }
      
      // Mostrar confirmación
      if (!confirm(`¿Desea importar ${jsonData.length} registros?`)) {
        return;
      }
      
      // Procesar los datos
      const publicadores = jsonData.map(item => ({
        nombre: item['Nombre'] || '',
        edad: item['Edad'] ? parseInt(item['Edad']) : null,
        bautizado: item['Bautizado'] === 'Sí',
        privilegio_servicio: item['Privilegio de Servicio'] || '',
        responsabilidad: item['Responsabilidad'] || '',
        organizacion_id: user.organizacion_id,
        // Aquí deberías mapear el ID de la congregación si es necesario
      }));
      
      // Insertar los datos en la base de datos
      const { data: result, error } = await supabase
        .from('publicadores')
        .insert(publicadores);
      
      if (error) throw error;
      
      alert(`Se importaron ${publicadores.length} publicadores correctamente`);
      
      // Recargar la lista de publicadores
      cargarPublicadores();
    };
    
    // Disparar el input de archivo
    input.click();
    
  } catch (error) {
    console.error('Error al importar desde Excel:', error);
    alert('Error al importar los datos desde Excel');
  }
}

// Función para exportar a PDF
function exportarAPDF() {
  // Crear un nuevo documento PDF
  const doc = new jspdf.jsPDF();
  
  // Título del documento
  doc.setFontSize(20);
  doc.text('Lista de Publicadores', 14, 22);
  
  // Obtener la fecha actual
  const fecha = new Date().toLocaleDateString();
  doc.setFontSize(10);
  doc.text(`Generado el: ${fecha}`, 14, 30);
  
  // Obtener los datos de la tabla
  const headers = [
    'Nombre', 
    'Congregación', 
    'Edad', 
    'Bautizado', 
    'Privilegio'
  ];
  
  const filas = Array.from(document.querySelectorAll('#tablaPublicadores tbody tr'));
  const datos = filas.map(fila => {
    const celdas = fila.querySelectorAll('td');
    return [
      celdas[0]?.textContent || '',
      celdas[1]?.textContent || '',
      celdas[2]?.textContent || '',
      celdas[3]?.querySelector('.badge')?.textContent || 'No',
      celdas[4]?.textContent || ''
    ];
  });
  
  // Agregar la tabla al PDF
  doc.autoTable({
    head: [headers],
    body: datos,
    startY: 40,
    styles: { 
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { top: 40 }
  });
  
  // Guardar el PDF
  doc.save(`publicadores_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Función para configurar la paginación
function configurarPaginacion(publicadores) {
  const itemsPerPage = 10;
  let currentPage = 1;
  const totalPages = Math.ceil(publicadores.length / itemsPerPage);
  
  // Actualizar controles de paginación
  const updatePagination = () => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, publicadores.length);
    
    // Actualizar información de paginación
    document.getElementById('pagination-start').textContent = startItem;
    document.getElementById('pagination-end').textContent = endItem;
    document.getElementById('pagination-total').textContent = publicadores.length;
    
    // Habilitar/deshabilitar botones de navegación
    document.getElementById('pagination-prev').disabled = currentPage === 1;
    document.getElementById('pagination-next').disabled = currentPage === totalPages;
    
    // Actualizar clases de los botones
    document.getElementById('pagination-prev').classList.toggle('disabled', currentPage === 1);
    document.getElementById('pagination-next').classList.toggle('disabled', currentPage === totalPages);
    
    // Mostrar/ocultar filas según la página actual
    document.querySelectorAll('#tablaPublicadores tbody tr').forEach((row, index) => {
      const rowIndex = index + 1;
      if (rowIndex >= startItem && rowIndex <= endItem) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
    
    // Mostrar/ocultar elementos móviles según la página actual
    const mobileItems = document.querySelectorAll('.mobile-item');
    mobileItems.forEach((item, index) => {
      const itemIndex = index + 1;
      if (itemIndex >= startItem && itemIndex <= endItem) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  };
  
  // Event listeners para los botones de paginación
  document.getElementById('pagination-prev')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      updatePagination();
    }
  });
  
  document.getElementById('pagination-next')?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      updatePagination();
    }
  });
  
  // Inicializar la paginación
  updatePagination();
}

// Función para manejar la eliminación de un publicador
async function eliminarPublicador(id) {
  if (!confirm('¿Está seguro de que desea eliminar este publicador?')) {
    return;
  }
  
  try {
    const { error } = await supabase
      .from('publicadores')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Recargar la lista de publicadores
    cargarPublicadores();
    
    // Mostrar notificación de éxito
    alert('Publicador eliminado correctamente');
  } catch (error) {
    console.error('Error al eliminar el publicador:', error);
    alert('Error al eliminar el publicador. Por favor, intente nuevamente.');
  }
}

// Función para ver los detalles de un publicador
async function verPublicador(id) {
  try {
    // Obtener los datos del publicador
    const { data: publicador, error } = await supabase
      .from('publicadores')
      .select(`
        *,
        congregacion:congregacion_id (nombre)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!publicador) {
      alert('No se encontró el publicador');
      return;
    }

    // Crear el mensaje con solo la información adicional que no está en la tabla
    let mensaje = `Información adicional de ${publicador.nombre || 'este publicador'}:\n\n`;
    
    // Mostrar solo responsabilidad y notas si existen
    let tieneInfoAdicional = false;
    
    if (publicador.responsabilidad) {
      mensaje += `• Responsabilidad: ${publicador.responsabilidad}\n`;
      tieneInfoAdicional = true;
    }
    
    if (publicador.notas) {
      mensaje += `\nNotas:\n${publicador.notas}\n`;
      tieneInfoAdicional = true;
    }
    
    if (!tieneInfoAdicional) {
      mensaje = 'No hay información adicional disponible para este publicador.';
    }
    
    // Mostrar la información en un alert
    alert(mensaje);
    
  } catch (error) {
    console.error('Error al cargar los datos del publicador:', error);
    alert('Error al cargar los datos del publicador');
  }
}

// Función para editar un publicador
function editarPublicador(id) {
  // Aquí irá la lógica para editar un publicador
  console.log('Editar publicador con ID:', id);
  // Por ahora, solo mostramos un mensaje
  alert(`Función de edición para el publicador con ID: ${id} (por implementar)`);
}

// Inicializar la página si estamos en la sección de publicadores
if (window.location.pathname.includes('publicadores.html')) {
  inicializarPaginaPublicadores();
}
