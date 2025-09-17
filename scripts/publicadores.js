import { supabase } from './supabase.js';
import { getCurrentUser } from './auth/auth-utils.js';
// SweetAlert2 is loaded via CDN in the HTML file

export async function cargarPublicadores() {
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
            <button class="btn-icon text-warning" data-action="edit" data-id="${publicador.id}" title="Editar">
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
            ${publicador.bautizado ? 'Sí' : 'No'}
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
  // Configurar los event listeners
  configurarEventListeners();
  
  // Inicializar la búsqueda
  inicializarBusqueda();
  
  // Cargar los datos iniciales
  cargarPublicadores();
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
  document.addEventListener('click', async (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    
    const action = button.getAttribute('data-action');
    const id = button.getAttribute('data-id');
    
    // Variable para controlar si ya se está procesando un clic
    let procesando = button.getAttribute('data-procesando') === 'true';
    
    // Si ya se está procesando un clic, no hacer nada
    if (procesando) return;
    
    try {
      // Marcar que se está procesando
      button.setAttribute('data-procesando', 'true');
      button.disabled = true;
      
      switch (action) {
        case 'view':
          await verPublicador(id);
          break;
        case 'edit':
          await editarPublicador(id);
          break;
        case 'delete':
          const confirmResult = await Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
          });

          if (confirmResult.isConfirmed) {
            await eliminarPublicador(id);
          }
          break;
      }
    } catch (error) {
      console.error('Error en el manejador de eventos:', error);
    } finally {
      // Restablecer el estado del botón después de un pequeño retraso
      setTimeout(() => {
        button.removeAttribute('data-procesando');
        button.disabled = false;
      }, 500);
    }
  });

  // Botón de agregar publicador
  const btnAgregar = document.querySelector('#btnAgregarPublicador');
  if (btnAgregar) {
    btnAgregar.addEventListener('click', () => {
      // Resetear el formulario
      resetearFormularioPublicador();
      
      // Cambiar el título del modal
      const modalTitle = document.getElementById('publicadorModalTitle');
      if (modalTitle) {
        modalTitle.textContent = 'Agregar Nuevo Publicador';
      }
      
      // Mostrar el modal
      const modal = new bootstrap.Modal(document.getElementById('publicadorModal'));
      modal.show();
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

// Función para importar datos desde un archivo Excel
async function importarDatos() {
  try {
    // Obtener el usuario actual
    const user = getCurrentUser();
    if (!user) {
      throw new Error('No se pudo obtener la información del usuario');
    }

    // Obtener la información de la organización del usuario
    const { data: usuario, error: userError } = await supabase
      .from('users')
      .select('organizacion_id, congregacion_id')
      .eq('id', user.id)
      .single();

    if (userError || !usuario) {
      throw new Error('No se pudo obtener la información de la organización');
    }

    // Crear input de archivo
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // Leer el archivo Excel
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          alert('El archivo está vacío');
          return;
        }

        // Validar estructura del archivo
        const requiredFields = ['Nombre', 'Congregación'];
        const fileHeaders = Object.keys(jsonData[0] || {});
        
        const missingFields = requiredFields.filter(
          field => !fileHeaders.includes(field)
        );

        if (missingFields.length > 0) {
          throw new Error(`Faltan campos requeridos: ${missingFields.join(', ')}`);
        }

        // Obtener lista de congregaciones para validación
        const { data: congregaciones, error: congError } = await supabase
          .from('congregacion')
          .select('id, nombre');

        if (congError) throw congError;

        const congregacionMap = new Map(
          congregaciones.map(c => [c.nombre.toLowerCase(), c.id])
        );

        // Procesar los datos
        const publicadores = [];
        const errores = [];
        const nombresProcesados = new Set();

        for (const [index, row] of jsonData.entries()) {
          try {
            const nombre = (row['Nombre'] || '').trim();
            const nombreCongregacion = (row['Congregación'] || '').trim();

            // Validaciones
            if (!nombre) {
              errores.push(`Fila ${index + 2}: El campo 'Nombre' es requerido`);
              continue;
            }

            // Verificar duplicados en el archivo
            const claveUnica = `${nombre.toLowerCase()}-${nombreCongregacion.toLowerCase()}`;
            if (nombresProcesados.has(claveUnica)) {
              errores.push(`Fila ${index + 2}: El publicador '${nombre}' ya está duplicado en el archivo`);
              continue;
            }
            nombresProcesados.add(claveUnica);

            // Validar congregación
            let congregacionId = usuario.congregacion_id;
            if (nombreCongregacion) {
              const idCongregacion = congregacionMap.get(nombreCongregacion.toLowerCase());
              if (!idCongregacion) {
                errores.push(`Fila ${index + 2}: No se encontró la congregación '${nombreCongregacion}'`);
                continue;
              }
              congregacionId = idCongregacion;
            }

            // Verificar si ya existe un publicador con el mismo nombre en la misma congregación
            const { data: existe, error: existeError } = await supabase
              .from('publicadores')
              .select('id')
              .ilike('nombre', nombre)
              .eq('congregacion_id', congregacionId)
              .maybeSingle();

            if (existeError) throw existeError;
            if (existe) {
              console.log(`Saltando publicador existente: ${nombre} (ID: ${existe.id})`);
              continue; // Saltar publicadores que ya existen
            }

            // Agregar publicador a la lista de importación
            publicadores.push({
              nombre,
              edad: parseInt(row['Edad']) || null,
              bautizado: ['sí', 'si', '1', 'true'].includes(
                (row['Bautizado'] || '').toString().toLowerCase()
              ),
              privilegio_servicio: (row['Privilegio de Servicio'] || row['Privilegio'] || '').trim(),
              responsabilidad: (row['Responsabilidad'] || '').trim(),
              congregacion_id: congregacionId,
              organizacion_id: usuario.organizacion_id
            });

          } catch (error) {
            console.error(`Error procesando fila ${index + 2}:`, error);
            errores.push(`Fila ${index + 2}: ${error.message || 'Error al procesar la fila'}`);
          }
        }

        // Mostrar resumen de validaciones
        if (errores.length > 0) {
          const mensajeError = `Se encontraron ${errores.length} errores de validación:\n\n` +
            errores.slice(0, 10).join('\n') + 
            (errores.length > 10 ? `\n\n...y ${errores.length - 10} errores más` : '');
          
          if (!confirm(`${mensajeError}\n\n¿Desea continuar con la importación de los ${publicadores.length} publicadores válidos?`)) {
            return;
          }
        }

        // Insertar los publicadores en lotes
        const BATCH_SIZE = 25;
        let exitosos = 0;

        for (let i = 0; i < publicadores.length; i += BATCH_SIZE) {
          const batch = publicadores.slice(i, i + BATCH_SIZE);
          const { error: insertError } = await supabase
            .from('publicadores')
            .insert(batch);

          if (insertError) {
            console.error('Error insertando lote:', insertError);
            errores.push(`Error al insertar lote ${Math.floor(i/BATCH_SIZE) + 1}: ${insertError.message}`);
          } else {
            exitosos += batch.length;
          }
        }

        // Mostrar resumen
        let mensaje = `Se importaron ${exitosos} de ${publicadores.length} publicadores correctamente.`;
        if (errores.length > 0) {
          mensaje += `\n\nSe encontraron ${errores.length} errores durante la importación.`;
          console.error('Errores de importación:', errores);
        }

        alert(mensaje);
        
        // Recargar la lista de publicadores
        if (exitosos > 0) {
          await cargarPublicadores();
        }

      } catch (error) {
        console.error('Error en el proceso de importación:', error);
        alert(`Error al importar los datos: ${error.message}`);
      }
    };

    // Disparar el input de archivo
    input.click();

  } catch (error) {
    console.error('Error en la importación:', error);
    alert(`Error: ${error.message}`);
  }
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
    // Obtener el usuario actual
    const user = getCurrentUser();
    if (!user) {
      throw new Error('No se pudo obtener la información del usuario');
    }
    
    // Obtener los datos de la base de datos
    const { data: publicadores, error } = await supabase
      .from('publicadores')
      .select(`
        nombre,
        edad,
        bautizado,
        privilegio_servicio,
        responsabilidad,
        congregacion:congregacion_id(nombre)
      `)
      .order('nombre', { ascending: true });

    if (error) throw error;
    
    if (!publicadores || publicadores.length === 0) {
      alert('No hay publicadores para exportar');
      return;
    }

    // Definir encabezados
    const headers = [
      'Nombre', 
      'Congregación', 
      'Edad', 
      'Bautizado', 
      'Privilegio de Servicio',
      'Responsabilidad'
    ];
    
    // Formatear los datos para Excel
    const data = [headers];
    
    // Mapear los datos para el Excel
    publicadores.forEach(publicador => {
      data.push([
        publicador.nombre || '',
        publicador.congregacion?.nombre || 'Sin congregación',
        publicador.edad || '',
        publicador.bautizado ? 'Sí' : 'No',
        publicador.privilegio_servicio || '',
        publicador.responsabilidad || ''
      ]);
    });
    
    // Crear un nuevo libro de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Ajustar el ancho de las columnas
    const columnWidths = [
      { wch: 30 }, // Nombre
      { wch: 25 }, // Congregación
      { wch: 8 },  // Edad
      { wch: 12 }, // Bautizado
      { wch: 25 }, // Privilegio de Servicio
      { wch: 25 }  // Responsabilidad
    ];
    ws['!cols'] = columnWidths;
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Publicadores');
    
    // Generar el archivo Excel
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `publicadores_${fecha}.xlsx`);
    
    alert('Exportación completada con éxito');
    
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    alert('Error al exportar a Excel: ' + (error.message || 'Error desconocido'));
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
    'Privilegio de Servicio',
    'Responsabilidad'
  ];
  
  const filas = Array.from(document.querySelectorAll('#tablaPublicadores tbody tr'));
  const datos = filas.map(fila => {
    const celdas = fila.querySelectorAll('td');
    return [
      celdas[0]?.textContent || '',
      celdas[1]?.textContent || '',
      celdas[2]?.textContent || '',
      celdas[3]?.querySelector('.badge')?.textContent || 'No',
      celdas[4]?.textContent || '',
      celdas[5]?.textContent || ''
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
  try {
    if (!id) {
      console.error('ID de publicador no proporcionado');
      return;
    }

    // Mostrar diálogo de confirmación
    if (!confirm('¿Está seguro de que desea eliminar este publicador? Esta acción no se puede deshacer.')) {
      return;
    }

    // Mostrar indicador de carga
    const botonEliminar = document.querySelector(`[data-action="delete"][data-id="${id}"]`);
    const botonOriginalHTML = botonEliminar?.innerHTML;
    
    if (botonEliminar) {
      botonEliminar.disabled = true;
      botonEliminar.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    // Eliminar el publicador
    const { error } = await supabase
      .from('publicadores')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Recargar la lista de publicadores
    await cargarPublicadores();
    
  } catch (error) {
    console.error('Error al eliminar el publicador:', error);
    
    // Mostrar notificación de error
    const notificacion = document.createElement('div');
    notificacion.className = 'alert alert-danger alert-dismissible fade show';
    notificacion.role = 'alert';
    notificacion.innerHTML = `
      Error al eliminar el publicador. Por favor, intente nuevamente.
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    `;
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.insertBefore(notificacion, mainContent.firstChild);
      
      // Eliminar la notificación después de 5 segundos
      setTimeout(() => {
        notificacion.classList.remove('show');
        setTimeout(() => notificacion.remove(), 150);
      }, 5000);
    }
  } finally {
    // Re-habilitar el botón de eliminar
    const botonEliminar = document.querySelector(`[data-action="delete"][data-id="${id}"]`);
    if (botonEliminar) {
      botonEliminar.disabled = false;
      botonEliminar.innerHTML = '<i class="fas fa-trash"></i>';
    }
  }
}

// Función para ver los detalles de un publicador
async function verPublicador(id) {
  try {
    // Obtener referencia al botón sin modificar su estado
    const botonVer = document.querySelector(`[data-action="view"][data-id="${id}"]`);
    

    // Obtener los datos del publicador
    const { data: publicador, error } = await supabase
      .from('publicadores')
      .select('*, congregacion:congregacion_id(nombre)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al obtener el publicador:', error);
      throw error;
    }
    
    if (!publicador) {
      await Swal.fire({
        title: 'Error',
        text: 'No se encontró el publicador',
        icon: 'error',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
    // Crear el mensaje con solo la información adicional que no está en la tabla
    let mensaje = `Información adicional de ${publicador.nombre || 'este publicador'}:\n\n`;
    
    // Mostrar solo responsabilidad y notas si existen
    let tieneInfoAdicional = false;
    
    // Verificar si el campo responsabilidad existe y tiene valor
    if (publicador.responsabilidad && publicador.responsabilidad.trim() !== '') {
      mensaje += `• Responsabilidad: ${publicador.responsabilidad}\n`;
      tieneInfoAdicional = true;
    }
    
    // Verificar si el campo notas existe y tiene valor
    if (publicador.notas && publicador.notas.trim() !== '') {
      mensaje += `\nNotas:\n${publicador.notas}\n`;
      tieneInfoAdicional = true;
    }
    
    // Si no hay información adicional, mostrar un mensaje
    if (!tieneInfoAdicional) {
      mensaje = 'No hay información adicional disponible para este publicador.';
    }
    
    // Mostrar la información en un alert simple
    alert(mensaje);
    
  } catch (error) {
    console.error('Error al cargar los datos del publicador:', error);
    alert('Error al cargar los datos del publicador');
  }
}

// Función para guardar un nuevo publicador
export async function guardarPublicador(publicador) {
  try {
    // Obtener el usuario actual
    const user = getCurrentUser();
    if (!user) {
      throw new Error('No se pudo obtener la información del usuario');
    }

    // Obtener la organización del usuario
    const { data: usuario, error: userError } = await supabase
      .from('users')
      .select('organizacion_id, congregacion_id')
      .eq('id', user.id)
      .single();

    if (userError || !usuario) {
      throw new Error('Error al obtener la información del usuario');
    }

    // Calcular la edad a partir de la fecha de nacimiento si está disponible
    let edad = null;
    if (publicador.fechaNacimiento) {
      const fechaNacimiento = new Date(publicador.fechaNacimiento);
      const hoy = new Date();
      edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
      const mes = hoy.getMonth() - fechaNacimiento.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
        edad--;
      }
    }

    // Obtener el ID de la congregación seleccionada
    let congregacionId = usuario.congregacion_id;
    
    // Si el usuario es administrador y seleccionó una congregación diferente
    if (publicador.congregacion && publicador.congregacion !== '') {
      const { data: congregacion, error: congError } = await supabase
        .from('congregacion')
        .select('id')
        .eq('nombre', publicador.congregacion)
        .single();
        
      if (!congError && congregacion) {
        congregacionId = congregacion.id;
      }
    }

    // Preparar los datos para guardar según el esquema de la base de datos
    const publicadorData = {
      nombre: publicador.nombre,
      edad: publicador.edad, // Usar la edad directamente del objeto publicador
      bautizado: publicador.bautizado, // Usar el valor booleano directamente
      privilegio_servicio: publicador.privilegio_servicio, // Corregir el nombre del campo
      responsabilidad: publicador.responsabilidad, // Incluir la responsabilidad
      congregacion_id: congregacionId,
      organizacion_id: usuario.organizacion_id
    };
    
    console.log('Datos a guardar:', publicadorData); // Para depuración

    // Insertar el nuevo publicador en la base de datos
    const { data, error } = await supabase
      .from('publicadores')
      .insert([publicadorData])
      .select();

    if (error) throw error;

    return data[0];
  } catch (error) {
    console.error('Error en guardarPublicador:', error);
    throw error;
  }
}

// Función para editar un publicador
async function editarPublicador(id) {
  try {
    console.log('Cargando datos del publicador con ID:', id);
    
    // Verificar que el ID sea válido
    if (!id) {
      throw new Error('ID de publicador no proporcionado');
    }
    
    // Mostrar el modal de carga
    const modalElement = document.getElementById('publicadorModal');
    if (!modalElement) {
      throw new Error('No se encontró el elemento del modal');
    }
    
    const modal = new bootstrap.Modal(modalElement);
    
    // Actualizar el título del modal de manera segura
    const modalTitle = document.getElementById('publicadorModalTitle');
    if (modalTitle) {
      modalTitle.textContent = 'Editar Publicador';
    } else {
      console.warn('No se encontró el título del modal');
    }
    
    console.log('Obteniendo datos del publicador...');
    
    // Obtener los datos del publicador
    const { data: publicador, error } = await supabase
      .from('publicadores')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error de Supabase:', error);
      throw error;
    }
    
    if (!publicador) {
      throw new Error('No se encontró el publicador con el ID: ' + id);
    }
    
    console.log('Datos del publicador:', publicador);
    
    // Llenar el formulario con los datos del publicador
    const form = document.getElementById('publicadorForm');
    if (!form) {
      throw new Error('No se encontró el formulario de publicador');
    }
    
    // Llenar campos del formulario
    const nombreInput = document.getElementById('nombre');
    const edadInput = document.getElementById('edad');
    const bautizadoInput = document.getElementById('bautizado');
    const privilegioInput = document.getElementById('privilegio_servicio');
    const responsabilidadInput = document.getElementById('responsabilidad');
    
    if (nombreInput) nombreInput.value = publicador.nombre || '';
    if (edadInput) edadInput.value = publicador.edad || '';
    if (bautizadoInput) bautizadoInput.checked = Boolean(publicador.bautizado);
    if (privilegioInput) privilegioInput.value = publicador.privilegio_servicio || '';
    if (responsabilidadInput) responsabilidadInput.value = publicador.responsabilidad || '';
    
    // Establecer el ID del publicador en el formulario (necesario para la actualización)
    form.dataset.id = id;
    console.log('ID del publicador establecido en el formulario:', form.dataset.id);
    
    console.log('Cargando congregaciones...');
    // Cargar las congregaciones y seleccionar la correcta
    await cargarCongregaciones(publicador.congregacion_id);
    
    console.log('Mostrando modal...');
    // Mostrar el modal
    modal.show();
    
  } catch (error) {
    console.error('Error al cargar el publicador:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      id: id
    });
    alert('Error al cargar los datos del publicador: ' + error.message);
  }
}

// Función para cargar las congregaciones en el select
async function cargarCongregaciones(congregacionId = null) {
  try {    
    // Obtener todas las congregaciones (sin filtrar por organización)
    const { data: congregaciones, error } = await supabase
      .from('congregacion')
      .select('id, nombre')
      .order('nombre', { ascending: true });
          
    if (error) throw error;
    
    // Actualizar el select de congregaciones
    const select = document.getElementById('congregacion');
    if (!select) return;
    
    // Guardar el valor seleccionado actual
    const currentValue = select.value;
    
    // Limpiar opciones existentes, excepto la primera opción
    while (select.options.length > 1) {
      select.remove(1);
    }
    
    // Agregar las congregaciones al select
    if (congregaciones && congregaciones.length > 0) {
      congregaciones.forEach(congregacion => {
        const option = document.createElement('option');
        option.value = congregacion.id;
        option.textContent = congregacion.nombre;
        select.appendChild(option);
      });
      
      // Establecer el valor seleccionado si se proporcionó un ID
      if (congregacionId) {
        select.value = congregacionId;
      } else if (currentValue) {
        // Mantener el valor seleccionado anterior si existe
        select.value = currentValue;
      }
    } else {
      // Si no hay congregaciones, mostrar un mensaje
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No hay congregaciones registradas';
      option.disabled = true;
      select.appendChild(option);
    }
    
  } catch (error) {
    console.error('Error al cargar las congregaciones:', error);
    alert('Error al cargar la lista de congregaciones');
  }
}

// Función para resetear el formulario de publicador
function resetearFormularioPublicador() {
  const form = document.getElementById('publicadorForm');
  if (!form) return;
  
  // Resetear el formulario
  form.reset();
  
  // Limpiar el ID del publicador
  delete form.dataset.id;
  
  // Cargar las congregaciones
  cargarCongregaciones();
}

// Función para manejar el envío del formulario
async function manejarEnvioFormulario(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const submitButton = form.querySelector('button[type="submit"]');
  
  // Deshabilitar el botón de envío para evitar múltiples envíos
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
  
  try {
    // Obtener el ID del publicador del formulario
    const publicadorId = form.dataset.id; // Será undefined para nuevos publicadores
    
    // Validar campos requeridos
    if (!formData.get('nombre') || !formData.get('congregacion')) {
      throw new Error('Por favor complete los campos requeridos');
    }
    
    // Obtener el valor seleccionado del select de congregación
    const congregacionSelect = document.getElementById('congregacion');
    const congregacionId = congregacionSelect ? congregacionSelect.value : null;
    
    const publicador = {
      nombre: formData.get('nombre').trim(),
      edad: formData.get('edad') ? parseInt(formData.get('edad')) : null,
      bautizado: formData.get('bautizado') === 'true',
      privilegio_servicio: formData.get('privilegio_servicio') || null,
      responsabilidad: formData.get('responsabilidad') ? formData.get('responsabilidad').trim() : null,
      congregacion_id: congregacionId
    };
    
    let result;
    
    if (publicadorId) {
      // Actualizar publicador existente
      const { data, error } = await supabase
        .from('publicadores')
        .update(publicador)
        .eq('id', publicadorId)
        .select();
        
      if (error) throw error;
      result = data[0];
    } else {
      // Crear nuevo publicador
      const user = getCurrentUser();
      if (!user) throw new Error('No se pudo obtener la información del usuario');
      
      // Obtener la organización del usuario
      const { data: usuario, error: userError } = await supabase
        .from('users')
        .select('organizacion_id')
        .eq('id', user.id)
        .single();
        
      if (userError || !usuario) throw userError || new Error('No se pudo obtener la organización');
      
      // Agregar la organización al publicador
      publicador.organizacion_id = usuario.organizacion_id;
      
      // Insertar el nuevo publicador
      const { data, error } = await supabase
        .from('publicadores')
        .insert([publicador])
        .select();
        
      if (error) throw error;
      result = data[0];
    }
    
    // Mostrar mensaje de éxito
    await Swal.fire({
      icon: 'success',
      title: publicadorId ? '¡Actualizado!' : '¡Creado!',
      text: `El publicador ha sido ${publicadorId ? 'actualizado' : 'creado'} correctamente`,
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true
    });
    
    // Cerrar el modal
    const modalElement = document.getElementById('publicadorModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    
    // Recargar la lista de publicadores
    await cargarPublicadores();
    
    return result;
    
  } catch (error) {
    console.error('Error al guardar el publicador:', error);
    
    // Mostrar mensaje de error
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'Ocurrió un error al guardar el publicador. Por favor, intente nuevamente.',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#3085d6'
    });
    
    // Re-lanzar el error para manejarlo en el llamador si es necesario
    throw error;
  } finally {
    // Restaurar el estado del botón de envío
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  }
}

// Variable global para mantener la instancia del modal
let publicadorModal = null;

// Función para inicializar el modal
function inicializarModal() {
  const btnAgregar = document.getElementById('btnAgregarPublicador');
  const modalElement = document.getElementById('publicadorModal');
  const publicadorForm = document.getElementById('publicadorForm');
  
  // Si ya existe una instancia del modal, eliminarla primero
  if (publicadorModal) {
    publicadorModal.dispose();
  }
  
  // Crear una nueva instancia del modal
  publicadorModal = new bootstrap.Modal(modalElement, {
    backdrop: 'static',
    keyboard: false
  });
  
  // Limpiar eventos previos
  const newBtnAgregar = btnAgregar.cloneNode(true);
  btnAgregar.parentNode.replaceChild(newBtnAgregar, btnAgregar);
  
  const newForm = publicadorForm.cloneNode(true);
  publicadorForm.parentNode.replaceChild(newForm, publicadorForm);

  // Mostrar el modal al hacer clic en el botón de agregar
  newBtnAgregar.addEventListener('click', function handleAgregarClick() {
    // Limpiar el formulario
    newForm.reset();
    resetearFormularioPublicador();
    // Actualizar el título del modal
    document.getElementById('publicadorModalTitle').textContent = 'Nuevo Publicador';
    // Mostrar el modal
    publicadorModal.show();
  });

  // Manejar el envío del formulario
  newForm.addEventListener('submit', function handleSubmit(e) {
    e.preventDefault();
    manejarEnvioFormulario(e).then(() => {
      // Cerrar el modal después de guardar exitosamente
      publicadorModal.hide();
    }).catch(error => {
      console.error('Error al procesar el formulario:', error);
    });
  });
  
  // Limpiar recursos cuando el modal se cierre
  modalElement.addEventListener('hidden.bs.modal', function() {
    // Forzar el foco al botón que abrió el modal
    if (document.activeElement === modalElement) {
      newBtnAgregar.focus();
    }
  });
}

// Inicializar la página si estamos en la sección de publicadores
if (window.location.pathname.includes('publicadores.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    // Inicializar componentes
    inicializarPaginaPublicadores();
    inicializarModal();
    cargarCongregaciones();
  });
}

// Exportar las funciones que necesitamos en el HTML
export {
  editarPublicador,
  eliminarPublicador,
  verPublicador,
  cargarCongregaciones,
  manejarEnvioFormulario,
  resetearFormularioPublicador
};
