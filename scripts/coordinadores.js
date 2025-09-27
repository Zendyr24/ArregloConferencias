// Importar dependencias
import { supabase } from "./supabase.js";
import {
  isAuthenticated,
  redirectToLogin,
  updateUserInfo,
} from "./auth/auth-utils.js";

// Variables globales
let coordinadores = [];
let currentPage = 1;
const itemsPerPage = 10;
let coordinadoresFiltrados = [];

// Elementos del DOM
let tbody;
let mobileTable;
let searchInput;
let paginationPrev;
let paginationNext;
let paginationStart;
let paginationEnd;
let paginationTotal;
let importExportPanel;
let toggleImportExport;

// Inicializar el módulo de coordinadores
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Verificar autenticación
    if (!isAuthenticated()) {
      redirectToLogin();
      return;
    }

    // Actualizar la información del usuario en la interfaz
    updateUserInfo();

    // Inicializar referencias a elementos del DOM
    tbody = document.querySelector(".data-table tbody");
    mobileTable = document.querySelector(".mobile-table");
    searchInput = document.getElementById("buscarCoordinador");
    paginationPrev = document.getElementById("pagination-prev");
    paginationNext = document.getElementById("pagination-next");
    paginationStart = document.getElementById("pagination-start");
    paginationEnd = document.getElementById("pagination-end");
    paginationTotal = document.getElementById("pagination-total");
    importExportPanel = document.getElementById("importExportPanel");
    toggleImportExport = document.getElementById("toggleImportExport");

    // Configurar eventos
    setupEventListeners();

    // Inicializar búsqueda
    inicializarBusqueda();

    // Cargar datos iniciales
    await cargarCoordinadores();

    console.log("Módulo de coordinadores inicializado correctamente");
  } catch (error) {
    console.error("Error al inicializar el módulo de coordinadores:", error);
    mostrarMensaje("Error al inicializar el módulo de coordinadores", "error");
  }
});

// Configurar event listeners
function setupEventListeners() {
  // Configurar botón de cierre de sesión
  const logoutButton = document.getElementById("app-logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      // Limpiar la sesión
      localStorage.removeItem("user");
      // Redirigir a la página de inicio de sesión
      window.location.href = "../index.html";
    });
  }

  // Manejador de eventos para el botón Agregar Coordinador
  const btnAgregarCoordinador = document.getElementById("btnAgregarCoordinador");
  if (btnAgregarCoordinador) {
    btnAgregarCoordinador.addEventListener("click", () => mostrarModalNuevoCoordinador());
  }

  // Manejador de eventos para los botones de acción
  document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "edit") editarCoordinador(id);
    if (action === "delete") confirmarEliminarCoordinador(id);
  });

  // Paginación
  if (paginationPrev) {
    paginationPrev.addEventListener("click", async (e) => {
      e.preventDefault();
      if (currentPage > 1) {
        currentPage--;
        await renderCoordinadores();
      }
    });
  }

  if (paginationNext) {
    paginationNext.addEventListener("click", async (e) => {
      e.preventDefault();
      const totalPages = Math.ceil(coordinadoresFiltrados.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        await renderCoordinadores();
      }
    });
  }

  // Configurar botón de guardar coordinador
  const btnGuardarCoordinador = document.getElementById("guardarCoordinador");
  if (btnGuardarCoordinador) {
    btnGuardarCoordinador.addEventListener("click", guardarCoordinador);
  }

  // Configurar botón de confirmar eliminación
  const btnConfirmarEliminar = document.getElementById("confirmarEliminar");
  if (btnConfirmarEliminar) {
    btnConfirmarEliminar.addEventListener("click", eliminarCoordinador);
  }

  // Configurar botones de importar/exportar
  setupImportExportButtons();
}

// Configurar botones de importar/exportar
function setupImportExportButtons() {
  const btnImportar = document.getElementById("btnImportar");
  const btnExportar = document.getElementById("btnExportar");
  const btnExportarPDF = document.getElementById("btnExportarPDF");

  // Configurar el botón de alternar panel de importación/exportación
  if (toggleImportExport) {
    toggleImportExport.addEventListener("click", toggleImportExportPanel);
  }

  // Configurar botón de importar
  if (btnImportar) {
    btnImportar.addEventListener("click", handleImportExcel);
  }

  // Configurar botón de exportar a Excel
  if (btnExportar) {
    btnExportar.addEventListener("click", exportarAExcel);
  }

  // Configurar botón de exportar a PDF
  if (btnExportarPDF) {
    btnExportarPDF.addEventListener("click", exportarAPDF);
  }

  // Configurar el listener para cerrar el panel al hacer clic fuera
  setupClickOutsideListener();
}

// Cargar coordinadores desde la base de datos
async function cargarCoordinadores() {
  try {
    // Mostrar estado de carga
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </td>
      </tr>`;

    // Obtener coordinadores con información de publicadores y congregaciones
    const { data, error } = await supabase
      .from('coordinadores')
      .select(`
        id,
        telefono,
        publicador:publicador_id(id, nombre, privilegio_servicio, congregacion_id),
        congregacion:publicador_id!inner(congregacion_id(id, nombre))
      `);

    if (error) throw error;

    // Procesar los datos para un formato más manejable
    coordinadores = data.map(item => ({
      id: item.id,
      publicador_id: item.publicador?.id,
      nombre: item.publicador?.nombre || 'Sin nombre',
      telefono: item.telefono || 'No especificado',
      privilegio: item.publicador?.privilegio_servicio || 'Sin privilegio',
      congregacion_id: item.congregacion?.congregacion_id?.id,
      congregacion: item.congregacion?.congregacion_id?.nombre || 'Sin congregación'
    }));

    // Renderizar la tabla
    renderCoordinadores();
  } catch (error) {
    console.error("Error al cargar coordinadores:", error);
    mostrarMensaje("Error al cargar los coordinadores: " + error.message, "error");
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted">
          Error al cargar los datos
        </td>
      </tr>`;
  }
}

// Renderizar la tabla de coordinadores
function renderCoordinadores() {
  try {
    // Filtrar coordinadores según la búsqueda
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
    
    coordinadoresFiltrados = searchTerm
      ? coordinadores.filter(
          (coordinador) =>
            (coordinador.nombre && coordinador.nombre.toLowerCase().includes(searchTerm)) ||
            (coordinador.telefono && coordinador.telefono.toLowerCase().includes(searchTerm)) ||
            (coordinador.congregacion && coordinador.congregacion.toLowerCase().includes(searchTerm))
        )
      : [...coordinadores];

    // Calcular la paginación
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedCoordinadores = coordinadoresFiltrados.slice(start, end);

    // Limpiar tabla
    tbody.innerHTML = "";

    if (coordinadoresFiltrados.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td colspan="5" class="empty-state-container">
          <div class="empty-state">
            <i class="fas fa-address-book"></i>
            <p>No se encontraron coordinadores</p>
          </div>
        </td>`;
      tbody.appendChild(tr);
      updatePagination(0);
      return;
    }

    // Llenar tabla
    paginatedCoordinadores.forEach((coordinador) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="col-nombre">${coordinador.nombre || "N/A"}</td>
        <td class="col-telefono">${coordinador.telefono || "N/A"}</td>
        <td class="col-privilegio">${coordinador.privilegio || "N/A"}</td>
        <td class="col-congregacion">${coordinador.congregacion || "N/A"}</td>
        <td class="col-acciones">
          <div class="acciones-botones">
            <button class="btn-icon" data-action="edit" data-id="${coordinador.id}" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" data-action="delete" data-id="${coordinador.id}" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Actualizar paginación
    updatePagination(coordinadoresFiltrados.length);

    // Actualizar tabla móvil
    updateMobileTable(paginatedCoordinadores);
  } catch (error) {
    console.error("Error al renderizar coordinadores:", error);
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted">
          Error al cargar los datos
        </td>
      </tr>`;
  }
}

// Actualizar la tabla móvil
function updateMobileTable(coordinadores) {
  if (!mobileTable) return;

  try {
    mobileTable.innerHTML = "";

    if (!coordinadores || coordinadores.length === 0) {
      mobileTable.innerHTML = `
        <div class="mobile-table-row">
          <div class="mobile-table-cell">
            <span class="label">No hay coordinadores para mostrar</span>
          </div>
        </div>`;
      return;
    }

    coordinadores.forEach((coordinador) => {
      const mobileCard = document.createElement("div");
      mobileCard.className = "mobile-table-row";
      mobileCard.innerHTML = `
        <div class="mobile-table-cell">
          <span class="label">Nombre:</span>
          <span class="value">${coordinador.nombre || "N/A"}</span>
        </div>
        <div class="mobile-table-cell">
          <span class="label">Teléfono:</span>
          <span class="value">${coordinador.telefono || "N/A"}</span>
        </div>
        <div class="mobile-table-cell">
          <span class="label">Privilegio:</span>
          <span class="value">${coordinador.privilegio || "N/A"}</span>
        </div>
        <div class="mobile-table-cell">
          <span class="label">Congregación:</span>
          <span class="value">${coordinador.congregacion || "N/A"}</span>
        </div>
        <div class="mobile-table-actions">
          <button class="btn-action" data-action="edit" data-id="${coordinador.id}" title="Editar">
            <i class="fas fa-edit"></i>
            <span>Editar</span>
          </button>
          <button class="btn-action text-danger" data-action="delete" data-id="${coordinador.id}" title="Eliminar">
            <i class="fas fa-trash"></i>
            <span>Eliminar</span>
          </button>
        </div>`;

      mobileTable.appendChild(mobileCard);
    });
  } catch (error) {
    console.error("Error al actualizar la tabla móvil:", error);
    mobileTable.innerHTML = `
      <div class="mobile-table-row">
        <div class="mobile-table-cell">
          <span class="value text-danger">Error al cargar los datos</span>
        </div>
      </div>`;
  }
}

// Actualizar la paginación
function updatePagination(totalItems) {
  if (!paginationStart || !paginationEnd || !paginationTotal) return;
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const start = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const end = Math.min(start + itemsPerPage - 1, totalItems);

  paginationStart.textContent = start;
  paginationEnd.textContent = end;
  paginationTotal.textContent = totalItems;

  if (paginationPrev) paginationPrev.disabled = currentPage === 1;
  if (paginationNext) paginationNext.disabled = currentPage === totalPages || totalPages === 0;
}

// Inicializar la búsqueda
function inicializarBusqueda() {
  if (!searchInput) return;
  
  const btnLimpiar = document.createElement('button');
  btnLimpiar.className = 'btn-clear-search';
  btnLimpiar.innerHTML = '<i class="fas fa-times"></i>';
  btnLimpiar.style.display = 'none';
  btnLimpiar.type = 'button';
  
  // Insertar el botón de limpiar después del input
  searchInput.parentNode.insertBefore(btnLimpiar, searchInput.nextSibling);
  
  // Función para buscar coordinadores
  const buscarCoordinadores = (termino) => {
    currentPage = 1;
    renderCoordinadores();
  };
  
  // Mostrar/ocultar el botón de limpiar y buscar al escribir
  searchInput.addEventListener('input', () => {
    btnLimpiar.style.display = searchInput.value ? 'flex' : 'none';
    buscarCoordinadores(searchInput.value);
  });
  
  // Limpiar la búsqueda
  btnLimpiar.addEventListener('click', () => {
    searchInput.value = '';
    btnLimpiar.style.display = 'none';
    buscarCoordinadores('');
  });
  
  // Buscar al presionar Enter
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      buscarCoordinadores(searchInput.value);
    }
  });
}

// Mostrar modal para agregar/editar coordinador
async function mostrarModalNuevoCoordinador(coordinador = null) {
  try {
    const modalElement = document.getElementById("coordinadorModal");
    if (!modalElement) {
      throw new Error("No se encontró el elemento del modal");
    }

    const modal = new bootstrap.Modal(modalElement);
    const form = document.getElementById("coordinadorForm");
    const publicadorSelect = document.getElementById("publicador_id");
    const telefonoInput = document.getElementById("telefono");
    const congregacionSelect = document.getElementById("congregacion_id");
    const tituloModal = document.getElementById("coordinadorModalTitle");
    const btnGuardar = document.getElementById("guardarCoordinador");

    if (!form || !publicadorSelect || !telefonoInput || !congregacionSelect || !tituloModal || !btnGuardar) {
      throw new Error("No se encontraron todos los elementos necesarios en el formulario");
    }

    // Limpiar el formulario
    form.reset();
    publicadorSelect.innerHTML = '<option value="" selected disabled>Seleccione un publicador</option>';
    congregacionSelect.innerHTML = '<option value="" selected disabled>Seleccione una congregación</option>';
    
    // Cargar congregaciones
    await cargarCongregaciones(congregacionSelect);

    // Configurar el título del modal
    tituloModal.textContent = coordinador ? "Editar Coordinador" : "Nuevo Coordinador";
    
    // Configurar el botón de guardar
    if (coordinador) {
      btnGuardar.setAttribute("data-id", coordinador.id);
      
      // Cargar datos del coordinador en el formulario
      telefonoInput.value = coordinador.telefono || "";
      
      // Establecer la congregación seleccionada
      if (coordinador.congregacion_id) {
        congregacionSelect.value = coordinador.congregacion_id;
      }
      
      // Cargar publicadores para la congregación seleccionada
      if (coordinador.congregacion_id) {
        await cargarPublicadores(publicadorSelect, coordinador.congregacion_id, coordinador.publicador_id);
      }
    } else {
      btnGuardar.removeAttribute("data-id");
      // Cargar publicadores cuando se seleccione una congregación
      congregacionSelect.addEventListener("change", async () => {
        const congregacionId = congregacionSelect.value;
        await cargarPublicadores(publicadorSelect, congregacionId);
      });
    }

    // Mostrar el modal
    modal.show();
  } catch (error) {
    console.error("Error al mostrar el modal de coordinador:", error);
    mostrarMensaje("Error al cargar el formulario: " + error.message, "error");
  }
}

// Cargar congregaciones en un select
async function cargarCongregaciones(selectElement) {
  try {
    const { data: congregaciones, error } = await supabase
      .from('congregacion')
      .select('id, nombre')
      .order('nombre', { ascending: true });

    if (error) throw error;

    // Limpiar opciones existentes
    selectElement.innerHTML = '<option value="" selected disabled>Seleccione una congregación</option>';

    // Agregar opciones
    congregaciones.forEach(congregacion => {
      const option = document.createElement('option');
      option.value = congregacion.id;
      option.textContent = congregacion.nombre;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar las congregaciones:", error);
    throw error;
  }
}

// Cargar publicadores de una congregación en un select
async function cargarPublicadores(selectElement, congregacionId, publicadorSeleccionadoId = null) {
  try {
    const { data: publicadores, error } = await supabase
      .from('publicadores')
      .select('id, nombre')
      .eq('congregacion_id', congregacionId)
      .order('nombre', { ascending: true });

    if (error) throw error;

    // Limpiar opciones existentes
    selectElement.innerHTML = '<option value="" selected disabled>Seleccione un publicador</option>';

    // Agregar opciones
    publicadores.forEach(publicador => {
      const option = document.createElement('option');
      option.value = publicador.id;
      option.textContent = publicador.nombre;
      option.selected = (publicadorSeleccionadoId && publicador.id === publicadorSeleccionadoId);
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar los publicadores:", error);
    throw error;
  }
}

// Guardar coordinador (crear o actualizar)
async function guardarCoordinador() {
  const form = document.getElementById("coordinadorForm");
  const formData = new FormData(form);
  const coordinadorId = document.getElementById("guardarCoordinador").getAttribute("data-id");
  const publicadorId = formData.get("publicador_id");
  const telefono = formData.get("telefono");
  const congregacionId = formData.get("congregacion_id");

  // Validar campos obligatorios
  if (!publicadorId || !telefono || !congregacionId) {
    mostrarMensaje("Por favor complete todos los campos obligatorios", "error");
    return;
  }

  try {
    // Mostrar indicador de carga
    const btnGuardar = document.getElementById("guardarCoordinador");
    const originalText = btnGuardar.innerHTML;
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';

    // Preparar los datos para guardar
    const coordinadorData = {
      publicador_id: publicadorId,
      telefono: telefono,
      organizacion_id: 1 // Ajustar según sea necesario
    };

    let error = null;

    // Crear o actualizar el coordinador
    if (coordinadorId) {
      // Actualizar coordinador existente
      const { error: updateError } = await supabase
        .from("coordinadores")
        .update(coordinadorData)
        .eq("id", coordinadorId);

      error = updateError;
    } else {
      // Verificar si ya existe un coordinador para este publicador
      const { data: coordinadorExistente, error: findError } = await supabase
        .from("coordinadores")
        .select("id")
        .eq("publicador_id", publicadorId);

      if (findError) throw findError;

      if (coordinadorExistente && coordinadorExistente.length > 0) {
        throw new Error("Este publicador ya está registrado como coordinador");
      }

      // Crear nuevo coordinador
      const { error: insertError } = await supabase
        .from("coordinadores")
        .insert([coordinadorData]);

      error = insertError;
    }

    if (error) throw error;

    // Cerrar el modal
    const modalElement = document.getElementById("coordinadorModal");
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }

    // Mostrar mensaje de éxito
    mostrarMensaje(
      `Coordinador ${coordinadorId ? "actualizado" : "agregado"} correctamente`,
      "success"
    );

    // Recargar la lista de coordinadores
    await cargarCoordinadores();
  } catch (error) {
    console.error("Error al guardar el coordinador:", error);
    mostrarMensaje(
      `Error al ${coordinadorId ? "actualizar" : "agregar"} el coordinador: ${error.message}`,
      "error"
    );
  } finally {
    // Restaurar el botón de guardar
    const btnGuardar = document.getElementById("guardarCoordinador");
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = 'Guardar';
    }
  }
}

// Editar coordinador
async function editarCoordinador(id) {
  try {
    // Buscar el coordinador en la lista local
    let coordinador = coordinadores.find(c => c.id === parseInt(id));

    // Si no está en la lista local, cargarlo desde la base de datos
    if (!coordinador) {
      const { data, error } = await supabase
        .from('coordinadores')
        .select(`
          id,
          telefono,
          publicador:publicador_id(id, nombre, congregacion_id),
          congregacion:publicador_id!inner(congregacion_id(id, nombre))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error("No se encontró el coordinador seleccionado");

      coordinador = {
        id: data.id,
        publicador_id: data.publicador?.id,
        nombre: data.publicador?.nombre || 'Sin nombre',
        telefono: data.telefono,
        congregacion_id: data.congregacion?.congregacion_id?.id,
        congregacion: data.congregacion?.congregacion_id?.nombre || 'Sin congregación'
      };
    }

    // Mostrar el modal con los datos del coordinador
    await mostrarModalNuevoCoordinador(coordinador);
  } catch (error) {
    console.error("Error al cargar el coordinador para editar:", error);
    mostrarMensaje("Error al cargar los datos del coordinador: " + error.message, "error");
  }
}

// Confirmar eliminación de coordinador
async function confirmarEliminarCoordinador(id) {
  // Mostrar confirmación con SweetAlert2
  const result = await Swal.fire({
    title: "¿Está seguro?",
    text: "Esta acción eliminará al coordinador permanentemente y no se podrá deshacer.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    reverseButtons: true,
  });

  // Si el usuario confirma la eliminación
  if (result.isConfirmed) {
    await eliminarCoordinador(id);
  }
}

// Eliminar coordinador
async function eliminarCoordinador() {
  const id = document.getElementById("confirmarEliminar").getAttribute("data-id");
  
  if (!id) {
    console.error("No se proporcionó un ID de coordinador para eliminar");
    return;
  }

  try {
    // Mostrar indicador de carga
    const btnEliminar = document.querySelector(`button[data-id="${id}"][data-action="delete"]`);
    const originalContent = btnEliminar ? btnEliminar.innerHTML : "";

    if (btnEliminar) {
      btnEliminar.disabled = true;
      btnEliminar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
    }

    // Eliminar el coordinador
    const { error } = await supabase
      .from("coordinadores")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Cerrar el modal de confirmación
    const modalElement = document.getElementById("confirmarEliminarModal");
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }

    // Mostrar mensaje de éxito
    mostrarMensaje("Coordinador eliminado correctamente", "success");

    // Actualizar la lista de coordinadores
    await cargarCoordinadores();
  } catch (error) {
    console.error("Error al eliminar el coordinador:", error);
    mostrarMensaje("Error al eliminar el coordinador: " + error.message, "error");
  } finally {
    // Restaurar el botón de eliminar
    const btnEliminar = document.querySelector(`button[data-id="${id}"][data-action="delete"]`);
    if (btnEliminar) {
      btnEliminar.disabled = false;
      btnEliminar.innerHTML = originalContent || '<i class="fas fa-trash"></i>';
    }
  }
}

// Exportar a Excel
async function exportarAExcel() {
  try {
    // Obtener los datos actualizados de la base de datos
    const { data, error } = await supabase
      .from('coordinadores')
      .select(`
        id,
        telefono,
        publicador:publicador_id(id, nombre),
        congregacion:publicador_id!inner(congregacion_id(id, nombre))
      `);

    if (error) throw error;

    if (!data || data.length === 0) {
      mostrarMensaje("No hay coordinadores para exportar", "warning");
      return;
    }

    // Formatear los datos para Excel
    const rows = data.map(item => ({
      'ID': item.id,
      'Nombre': item.publicador?.nombre || 'Sin nombre',
      'Teléfono': item.telefono || 'No especificado',
      'Congregación': item.congregacion?.congregacion_id?.nombre || 'Sin congregación'
    }));

    // Crear un nuevo libro de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Ajustar el ancho de las columnas
    const columnWidths = [
      { wch: 10 },  // ID
      { wch: 40 },  // Nombre
      { wch: 20 },  // Teléfono
      { wch: 40 }   // Congregación
    ];
    ws['!cols'] = columnWidths;

    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, "Coordinadores");

    // Generar el archivo Excel
    const fecha = new Date().toISOString().split('T')[0];
    const fileName = `coordinadores_${fecha}.xlsx`;
    
    // Usar XLSX para generar el archivo
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Usar FileSaver.js para guardar el archivo
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Guardar el archivo
    saveAs(blob, fileName);
    
    mostrarMensaje("Exportación completada con éxito", "success");
  } catch (error) {
    console.error("Error al exportar a Excel:", error);
    mostrarMensaje("Error al exportar a Excel: " + error.message, "error");
  }
}

// Exportar a PDF
async function exportarAPDF() {
  try {
    // Obtener los datos actualizados de la base de datos
    const { data, error } = await supabase
      .from('coordinadores')
      .select(`
        id,
        telefono,
        publicador:publicador_id(id, nombre),
        congregacion:publicador_id!inner(congregacion_id(id, nombre))
      `);

    if (error) throw error;

    if (!data || data.length === 0) {
      mostrarMensaje("No hay coordinadores para exportar", "warning");
      return;
    }

    // Formatear los datos para la tabla PDF
    const rows = data.map(item => [
      item.id,
      item.publicador?.nombre || 'Sin nombre',
      item.telefono || 'No especificado',
      item.congregacion?.congregacion_id?.nombre || 'Sin congregación'
    ]);

    // Crear un nuevo documento PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Título del documento
    doc.setFontSize(18);
    doc.text('Lista de Coordinadores', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    
    // Fecha de generación
    const fecha = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    doc.text(`Generado el ${fecha}`, 14, 30);
    
    // Agregar la tabla
    doc.autoTable({
      head: [['ID', 'Nombre', 'Teléfono', 'Congregación']],
      body: rows,
      startY: 40,
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 10 },
      styles: {
        fontSize: 9,
        cellPadding: 2,
        overflow: 'linebreak',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 60 },
        2: { cellWidth: 35 },
        3: { cellWidth: 60 }
      }
    });
    
    // Guardar el PDF
    const fechaArchivo = new Date().toISOString().split('T')[0];
    doc.save(`coordinadores_${fechaArchivo}.pdf`);
    
    mostrarMensaje("Exportación a PDF completada con éxito", "success");
  } catch (error) {
    console.error("Error al exportar a PDF:", error);
    mostrarMensaje("Error al exportar a PDF: " + error.message, "error");
  }
}

// Manejar importación desde Excel
async function handleImportExcel() {
  try {
    // Crear input de archivo
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        // Mostrar indicador de carga
        const loadingSwal = Swal.fire({
          title: 'Procesando archivo',
          html: 'Por favor espere mientras se importan los datos...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Leer el archivo Excel
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        if (!jsonData || jsonData.length === 0) {
          throw new Error('El archivo está vacío o no tiene un formato válido');
        }
        
        // Procesar cada fila
        const resultados = {
          exitosos: 0,
          fallidos: 0,
          errores: []
        };
        
        for (let i = 0; i < jsonData.length; i++) {
          const fila = jsonData[i];
          const numFila = i + 2; // +2 porque la primera fila es el encabezado y los arrays empiezan en 0
          
          try {
            // Validar campos obligatorios
            if (!fila['Nombre'] || !fila['Teléfono'] || !fila['Congregación']) {
              throw new Error('Faltan campos obligatorios');
            }
            
            // Buscar la congregación por nombre
            const { data: congregaciones, error: errorCongregacion } = await supabase
              .from('congregacion')
              .select('id')
              .ilike('nombre', `%${fila['Congregación']}%`);
              
            if (errorCongregacion) throw errorCongregacion;
            if (!congregaciones || congregaciones.length === 0) {
              throw new Error(`No se encontró la congregación: ${fila['Congregación']}`);
            }
            
            const congregacionId = congregaciones[0].id;
            
            // Buscar el publicador por nombre y congregación
            const { data: publicadores, error: errorPublicador } = await supabase
              .from('publicadores')
              .select('id')
              .eq('congregacion_id', congregacionId)
              .ilike('nombre', `%${fila['Nombre']}%`);
              
            if (errorPublicador) throw errorPublicador;
            
            let publicadorId;
            
            if (!publicadores || publicadores.length === 0) {
              // Si no existe el publicador, crearlo
              const { data: nuevoPublicador, error: errorNuevoPublicador } = await supabase
                .from('publicadores')
                .insert([
                  {
                    nombre: fila['Nombre'],
                    congregacion_id: congregacionId,
                    organizacion_id: 1
                  }
                ])
                .select('id')
                .single();
                
              if (errorNuevoPublicador) throw errorNuevoPublicador;
              
              // Usar el ID del nuevo publicador
              publicadorId = nuevoPublicador.id;
            } else {
              // Usar el ID del publicador existente
              publicadorId = publicadores[0].id;
            }
            
            // Verificar si ya existe un coordinador para este publicador
            const { data: coordinadorExistente, error: errorCoordinadorExistente } = await supabase
              .from('coordinadores')
              .select('id')
              .eq('publicador_id', publicadorId)
              .single();
              
            if (errorCoordinadorExistente && errorCoordinadorExistente.code !== 'PGRST116') {
              throw errorCoordinadorExistente;
            }
            
            if (coordinadorExistente) {
              // Actualizar coordinador existente
              const { error: errorActualizar } = await supabase
                .from('coordinadores')
                .update({
                  telefono: fila['Teléfono'],
                  organizacion_id: 1
                })
                .eq('id', coordinadorExistente.id);
                
              if (errorActualizar) throw errorActualizar;
              
              resultados.exitosos++;
            } else {
              // Crear nuevo coordinador
              const { error: errorCoordinador } = await supabase
                .from('coordinadores')
                .insert([
                  {
                    publicador_id: publicadorId,
                    telefono: fila['Teléfono'],
                    organizacion_id: 1
                  }
                ]);
                
              if (errorCoordinador) throw errorCoordinador;
              
              resultados.exitosos++;
            }
          } catch (error) {
            console.error(`Error en la fila ${numFila}:`, error);
            resultados.fallidos++;
            resultados.errores.push({
              fila: numFila,
              error: error.message || 'Error desconocido al procesar la fila'
            });
          }
        }
        
        // Cerrar el indicador de carga
        await loadingSwal.close();
        
        // Mostrar resumen de la importación
        let mensaje = `
          <div class="text-left">
            <p>Proceso de importación completado:</p>
            <ul class="mb-0">
              <li>Registros exitosos: <strong>${resultados.exitosos}</strong></li>
              <li>Registros fallidos: <strong>${resultados.fallidos}</strong></li>
            </ul>
        `;
        
        if (resultados.errores.length > 0) {
          mensaje += `
            <div class="mt-3">
              <p class="mb-1">Errores encontrados:</p>
              <ul class="small text-muted" style="max-height: 150px; overflow-y: auto;">
                ${resultados.errores.map(e => `<li>Fila ${e.fila}: ${e.error}</li>`).join('')}
              </ul>
            </div>
          `;
        }
        
        mensaje += '</div>';
        
        await Swal.fire({
          title: 'Importación completada',
          html: mensaje,
          icon: resultados.fallidos === 0 ? 'success' : 'warning',
          confirmButtonText: 'Aceptar'
        });
        
        // Recargar los datos
        await cargarCoordinadores();
        
      } catch (error) {
        console.error('Error al importar desde Excel:', error);
        
        await Swal.fire({
          title: 'Error',
          text: error.message || 'Ocurrió un error al importar el archivo',
          title: 'Error al importar',
          text: error.message || 'Ocurrió un error al procesar el archivo',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    };
    
    // Disparar el diálogo de selección de archivo
    input.click();
  } catch (error) {
    console.error("Error al manejar la importación:", error);
    mostrarMensaje("Error al manejar la importación: " + error.message, "error");
  }
}

// Alternar visibilidad del panel de importación/exportación
function toggleImportExportPanel(e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }

  const panel = document.getElementById("importExportPanel");
  const toggleBtn = document.getElementById("toggleImportExport");

  if (!panel || !toggleBtn) return;

  const icon = toggleBtn.querySelector("i");
  const isVisible = panel.classList.contains("visible");

  // Cerrar cualquier otro panel abierto
  document.querySelectorAll(".import-export-panel.visible").forEach((p) => {
    if (p !== panel) {
      p.classList.remove("visible");
    }
  });

  // Alternar la clase visible
  if (isVisible) {
    panel.classList.remove("visible");
    icon.classList.remove("fa-chevron-up");
    icon.classList.add("fa-chevron-down");
  } else {
    panel.classList.add("visible");
    icon.classList.remove("fa-chevron-down");
    icon.classList.add("fa-chevron-up");
  }
}

// Cerrar el panel de importación/exportación al hacer clic fuera o presionar Escape
function setupClickOutsideListener() {
  const toggleBtn = document.getElementById("toggleImportExport");
  const panel = document.getElementById("importExportPanel");

  if (!toggleBtn || !panel) return;

  // Cerrar al hacer clic fuera
  document.addEventListener(
    "click",
    (e) => {
      if (
        panel.classList.contains("visible") &&
        !panel.contains(e.target) &&
        !toggleBtn.contains(e.target)
      ) {
        toggleImportExportPanel(e);
      }
    },
    true
  );

  // Cerrar con la tecla Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("visible")) {
      toggleImportExportPanel(e);
    }
  });

  // Prevenir que los clics dentro del panel cierren el panel
  panel.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

// Mostrar mensaje de notificación
function mostrarMensaje(mensaje, tipo = "info") {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  Toast.fire({
    icon: tipo,
    title: mensaje,
  });
}

// Exportar funciones para acceso global
window.mostrarModalNuevoCoordinador = mostrarModalNuevoCoordinador;
window.editarCoordinador = editarCoordinador;
window.eliminarCoordinador = eliminarCoordinador;
window.handleImportExcel = handleImportExcel;
