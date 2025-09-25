// Importar dependencias
import { supabase } from "./supabase.js";
import {
  isAuthenticated,
  redirectToLogin,
  updateUserInfo,
  getCurrentUser,
} from "./auth/auth-utils.js";

// Verificar autenticación
if (!isAuthenticated()) {
  redirectToLogin();
}

// XLSX is now available globally from the CDN

// Variables globales
let oradores = [];
let currentPage = 1;
const itemsPerPage = 10;
let oradoresFiltrados = [];

// Elementos del DOM
let tbody;
let mobileTable;
let searchInput;
let limpiarBusqueda;
let paginationPrev;
let paginationNext;
let paginationStart;
let paginationEnd;
let paginationTotal;
let importExportPanel;
let toggleImportExport;

// Inicializar el módulo de oradores
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
    searchInput = document.getElementById("buscarOrador");
    limpiarBusqueda = document.getElementById("limpiarBusqueda");
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
    await cargarOradores();

    console.log("Módulo de oradores inicializado correctamente");
  } catch (error) {
    console.error("Error al inicializar el módulo de oradores:", error);
    mostrarMensaje("Error al inicializar el módulo de oradores", "error");
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

  // La búsqueda ahora se maneja en inicializarBusqueda()

  // Manejador de eventos para el botón Agregar Orador
  const btnAgregarOrador = document.getElementById("btnAgregarOrador");
  if (btnAgregarOrador) {
    btnAgregarOrador.addEventListener("click", () => mostrarModalNuevoOrador());
  }

  // Manejador de eventos para los botones de acción
  document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "edit") editarOrador(id);
    if (action === "delete") eliminarOrador(id);
  });

  // Paginación
  if (paginationPrev) {
    paginationPrev.addEventListener("click", async (e) => {
      e.preventDefault();
      if (currentPage > 1) {
        currentPage--;
        await renderOradores();
      }
    });
  }

  if (paginationNext) {
    paginationNext.addEventListener("click", async (e) => {
      e.preventDefault();
      const totalPages = Math.ceil(getFiltredOradores().length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        await renderOradores();
      }
    });
  }

  // Configurar botones de importar/exportar
  const btnImportar = document.getElementById("btnImportar");
  const btnExportar = document.getElementById("btnExportar");
  const btnExportarPDF = document.getElementById("btnExportarPDF");

  try {
    // Configurar el botón de alternar panel de importación/exportación
    if (toggleImportExport) {
      toggleImportExport.addEventListener("click", (e) => {
        e.preventDefault();
        toggleImportExportPanel(e);
      });
    }

    // Configurar botón de importar
    if (btnImportar) {
      let isImporting = false;
      
      const handleImport = (e) => {
        e.preventDefault();
        
        if (isImporting) return;
        
        // Crear input de archivo
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx, .xls';
        
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          
          const button = e.currentTarget;
          button.disabled = true;
          isImporting = true;
          
          try {
            await importarDesdeExcel(file);
          } catch (error) {
            console.error("Error al importar:", error);
            mostrarMensaje(`Error al importar: ${error.message}`, 'error');
          } finally {
            button.disabled = false;
            isImporting = false;
          }
        };
        
        // Disparar el diálogo de selección de archivo
        input.click();
      };
      
      btnImportar.addEventListener('click', handleImport);
    }

    // Configurar botón de exportar a Excel
    if (btnExportar) {
      const handleExportExcel = async (e) => {
        e.preventDefault();
        const button = e.currentTarget;
        button.disabled = true;
        try {
          await exportarAExcel();
        } catch (error) {
          console.error("Error al exportar a Excel:", error);
          mostrarMensaje(`Error al exportar a Excel: ${error.message}`, 'error');
        } finally {
          button.disabled = false;
        }
      };
      btnExportar.addEventListener("click", handleExportExcel);
    }

    // Configurar botón de exportar a PDF
    if (btnExportarPDF) {
      const handleExportPDF = async (e) => {
        e.preventDefault();
        const button = e.currentTarget;
        button.disabled = true;
        try {
          await exportarAPDF();
        } catch (error) {
          console.error("Error al exportar a PDF:", error);
          mostrarMensaje(`Error al exportar a PDF: ${error.message}`, 'error');
        } finally {
          button.disabled = false;
        }
      };
      btnExportarPDF.addEventListener("click", handleExportPDF);
    }
  } catch (error) {
    console.error(
      "Error al configurar los botones de importar/exportar:",
      error
    );
    mostrarMensaje(
      "Error al configurar los botones de importar/exportar",
      "error"
    );
  }

  // Configurar el listener para cerrar el panel al hacer clic fuera
  setupClickOutsideListener();
}

// Cargar oradores desde la base de datos
async function cargarOradores() {
  // Asegurarse de que tbody esté definido
  const tbody = document.querySelector(".data-table tbody");
  if (!tbody) {
    console.error("No se encontró el elemento tbody");
    return;
  }

  try {
    // Mostrar estado de carga
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </td>
      </tr>`;

    // Verificar que supabase esté inicializado
    if (!supabase || typeof supabase.from !== "function") {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted">
            Error: No se pudo conectar con la base de datos
          </td>
        </tr>`;
      return;
    }

    // Obtener oradores
    const { data: oradoresData, error: oradoresError } = await supabase
      .from("oradores")
      .select("*");

    if (oradoresError) throw oradoresError;
    if (!oradoresData || oradoresData.length === 0) {
      oradores = [];
      renderOradores();
      return;
    }

    // Obtener IDs de publicadores
    const publicadorIds = oradoresData
      .map((orador) => orador.publicador_id)
      .filter(Boolean);

    // Obtener información de publicadores
    const { data: publicadoresData, error: publicadoresError } = await supabase
      .from("publicadores")
      .select(
        `
        id,
        nombre,
        privilegio_servicio,
        congregacion_id,
        congregacion:congregacion_id (id, nombre)
      `
      )
      .in("id", publicadorIds);

    if (publicadoresError) throw publicadoresError;

    // Mapear datos
    const publicadoresMap = {};
    publicadoresData.forEach((pub) => {
      publicadoresMap[pub.id] = {
        nombre: pub.nombre || "Sin nombre",
        privilegio: pub.privilegio_servicio || "Sin privilegio",
        congregacion: pub.congregacion?.nombre || "Sin congregación",
        congregacion_id: pub.congregacion_id,
      };
    });

    // Combinar datos
    oradores = oradoresData.map((orador) => ({
      id: orador.id,
      publicador_id: orador.publicador_id,
      nombre: publicadoresMap[orador.publicador_id]?.nombre || "Sin nombre",
      privilegio:
        publicadoresMap[orador.publicador_id]?.privilegio || "Sin privilegio",
      saliente: orador.saliente || false,
      congregacion:
        publicadoresMap[orador.publicador_id]?.congregacion ||
        "Sin congregación",
      congregacion_id: publicadoresMap[orador.publicador_id]?.congregacion_id,
    }));

    renderOradores();
  } catch (error) {
    console.error("Error al cargar oradores:", error);
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">
          No se pudieron cargar los datos
        </td>
      </tr>`;
  }
}

// Filtrar oradores según la búsqueda
function getFiltredOradores() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";

  if (!searchTerm) {
    oradoresFiltrados = [...oradores];
    return oradoresFiltrados;
  }

  oradoresFiltrados = oradores.filter(
    (orador) =>
      (orador.nombre && orador.nombre.toLowerCase().includes(searchTerm)) ||
      (orador.congregacion &&
        orador.congregacion.toLowerCase().includes(searchTerm)) ||
      (orador.privilegio &&
        orador.privilegio.toLowerCase().includes(searchTerm)) ||
      (orador.telefono && orador.telefono.toLowerCase().includes(searchTerm)) ||
      (orador.email && orador.email.toLowerCase().includes(searchTerm))
  );

  return oradoresFiltrados;
}

// Inicializar la búsqueda
function inicializarBusqueda() {
  const buscarInput = document.getElementById("buscarOrador");
  const btnLimpiar = document.createElement("button");
  btnLimpiar.className = "btn-clear-search";
  btnLimpiar.innerHTML = '<i class="fas fa-times"></i>';
  btnLimpiar.style.display = "none";
  btnLimpiar.type = "button";

  if (buscarInput) {
    // Insertar el botón de limpiar después del input
    buscarInput.parentNode.insertBefore(btnLimpiar, buscarInput.nextSibling);

    // Mostrar/ocultar el botón de limpiar
    buscarInput.addEventListener("input", () => {
      btnLimpiar.style.display = buscarInput.value ? "flex" : "none";
      currentPage = 1;
      renderOradores();
    });

    // Limpiar la búsqueda
    btnLimpiar.addEventListener("click", () => {
      buscarInput.value = "";
      btnLimpiar.style.display = "none";
      currentPage = 1;
      renderOradores();
    });

    // Buscar al presionar Enter
    buscarInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        currentPage = 1;
        renderOradores();
      }
    });
  }
}

// Renderizar la tabla de oradores
async function renderOradores() {
  try {
    const filteredOradores = getFiltredOradores();
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedOradores = filteredOradores.slice(start, end);

    // Limpiar tabla
    tbody.innerHTML = "";

    if (filteredOradores.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td colspan="5" class="text-center">
          <div class="empty-state">
            <i class="fas fa-users-slash"></i>
            <p>No se encontraron oradores</p>
          </div>
        </td>`;
      tbody.appendChild(tr);
      updatePagination(0);
      return;
    }

    // Llenar tabla
    paginatedOradores.forEach((orador) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="col-nombre">${orador.nombre || "N/A"}</td>
        <td class="col-congregacion">${orador.congregacion || "N/A"}</td>
        <td class="col-privilegio">${orador.privilegio || "N/A"}</td>
        <td class="col-saliente">
          <span class="saliente-badge">
            ${orador.saliente ? "Sí" : "No"}
          </span>
        </td>
        <td class="col-acciones">
          <div class="acciones-botones">
            <button class="btn-icon" data-action="edit" data-id="${
              orador.id
            }" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" data-action="delete" data-id="${
              orador.id
            }" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Actualizar paginación
    updatePagination(filteredOradores.length);

    // Actualizar tabla móvil
    updateMobileTable(paginatedOradores);
  } catch (error) {
    console.error("Error al renderizar oradores:", error);
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted">
          Error al cargar los datos
        </td>
      </tr>`;
  }
}

// Actualizar la tabla móvil
function updateMobileTable(oradores) {
  if (!mobileTable) return;

  try {
    mobileTable.innerHTML = "";

    if (!oradores || oradores.length === 0) {
      mobileTable.innerHTML = `
        <div class="mobile-table-row">
          <div class="mobile-table-cell">
            <span class="label">No hay oradores para mostrar</span>
          </div>
        </div>`;
      return;
    }

    oradores.forEach((orador) => {
      const mobileCard = document.createElement("div");
      mobileCard.className = "mobile-table-row";
      mobileCard.innerHTML = `
        <div class="mobile-table-cell">
          <span class="label">Nombre:</span>
          <span class="value">${orador.nombre || "N/A"}</span>
        </div>
        <div class="mobile-table-cell">
          <span class="label">Congregación:</span>
          <span class="value">${orador.congregacion || "N/A"}</span>
        </div>
        <div class="mobile-table-cell">
          <span class="label">Privilegio:</span>
          <span class="value">${orador.privilegio || "N/A"}</span>
        </div>
        <div class="mobile-table-cell">
          <span class="label">Saliente:</span>
          <span class="value">
            <span class="saliente-badge ${
              orador.saliente ? "activo" : "inactivo"
            }">
              ${orador.saliente ? "Sí" : "No"}
            </span>
          </span>
        </div>
        <div class="mobile-table-actions">
          <button class="btn-action" data-action="edit" data-id="${
            orador.id
          }" title="Editar">
            <i class="fas fa-edit"></i>
            <span>Editar</span>
          </button>
          <button class="btn-action text-danger" data-action="delete" data-id="${
            orador.id
          }" title="Eliminar">
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
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(start + itemsPerPage - 1, totalItems);

  paginationStart.textContent = start;
  paginationEnd.textContent = end;
  paginationTotal.textContent = totalItems;

  paginationPrev.disabled = currentPage === 1;
  paginationNext.disabled = currentPage === totalPages || totalPages === 0;
}

// Obtener clase CSS para el badge según el estado
function getBadgeClass(estado) {
  if (typeof estado === "boolean") {
    return estado ? "saliente-badge activo" : "saliente-badge inactivo";
  }

  const estadoStr = String(estado || "").toLowerCase();

  switch (estadoStr) {
    case "disponible":
      return "badge-disponible";
    case "ocupado":
      return "badge-ocupado";
    case "si":
    case "sí":
    case "true":
      return "saliente-badge activo";
    case "no":
    case "false":
      return "saliente-badge inactivo";
    default:
      return "badge-no-disponible";
  }
}

// Cargar publicadores que pueden ser oradores (Ancianos o Siervos Ministeriales) y que no estén ya como oradores
async function cargarPublicadoresParaOradores() {
  try {
    // Primero, obtenemos todos los publicadores que pueden ser oradores
    const { data: publicadores, error: errorPublicadores } = await supabase
      .from("publicadores")
      .select(
        "id, nombre, privilegio_servicio, congregacion_id, congregacion(nombre)"
      )
      .in("privilegio_servicio", ["Anciano", "Siervo Ministerial"]);

    if (errorPublicadores) throw errorPublicadores;
    if (!publicadores || publicadores.length === 0) return [];

    // Luego, obtenemos los IDs de los publicadores que ya son oradores
    const { data: oradoresExistentes, error: errorOradores } = await supabase
      .from("oradores")
      .select("publicador_id");

    if (errorOradores) throw errorOradores;

    // Extraemos los IDs de los publicadores que ya son oradores
    const idsOradoresExistentes = oradoresExistentes.map(
      (orador) => orador.publicador_id
    );

    // Filtramos los publicadores para excluir los que ya son oradores
    const publicadoresDisponibles = publicadores.filter(
      (publicador) => !idsOradoresExistentes.includes(publicador.id)
    );

    // Ordenamos alfabéticamente por nombre
    publicadoresDisponibles.sort((a, b) => a.nombre.localeCompare(b.nombre));

    return publicadoresDisponibles;
  } catch (error) {
    console.error("Error al cargar publicadores para oradores:", error);
    mostrarMensaje(
      "Error al cargar la lista de publicadores: " + error.message,
      "error"
    );
    return [];
  }
}

// Mostrar modal para agregar/editar orador
async function mostrarModalNuevoOrador(orador = null) {
  try {
    // Obtener referencias a los elementos del DOM
    const modalElement = document.getElementById("oradorModal");
    if (!modalElement) {
      throw new Error("No se encontró el elemento del modal");
    }

    // Inicializar el modal de Bootstrap
    const modal = new bootstrap.Modal(modalElement);

    // Obtener referencias a los elementos del formulario
    const form = document.getElementById("oradorForm");
    const publicadorSelect = document.getElementById("publicador_id");
    const tituloModal = document.getElementById("oradorModalTitle");
    const btnGuardar = document.getElementById("guardarOrador");

    if (!form || !publicadorSelect || !tituloModal || !btnGuardar) {
      throw new Error(
        "No se encontraron todos los elementos necesarios en el formulario"
      );
    }

    // Limpiar el formulario y deshabilitar el botón de guardar temporalmente
    form.reset();
    btnGuardar.disabled = true;

    // Configurar el título del modal
    tituloModal.textContent = orador ? "Editar Orador" : "Nuevo Orador";

    try {
      // Si estamos editando, mostrar solo el publicador actual
      if (orador) {
        // Deshabilitar el select y mostrar solo el publicador actual
        publicadorSelect.disabled = true;

        // Crear una opción con el publicador actual
        publicadorSelect.innerHTML = "";
        const option = document.createElement("option");
        option.value = orador.publicador_id;
        option.textContent = orador.publicador
          ? `${orador.publicador.nombre} (${orador.publicador.privilegio_servicio})`
          : "Cargando...";
        publicadorSelect.appendChild(option);

        // Establecer los demás valores del formulario
        const salienteCheckbox = document.getElementById("saliente");
        if (salienteCheckbox) {
          salienteCheckbox.checked = orador.saliente || false;
        }
        btnGuardar.setAttribute("data-id", orador.id);
      }
      // Si es un nuevo orador, cargar la lista de publicadores disponibles
      else {
        // Cargar publicadores disponibles
        const publicadores = await cargarPublicadoresParaOradores();

        // Limpiar opciones existentes
        publicadorSelect.innerHTML =
          '<option value="" selected disabled>Seleccione un publicador (Anciano o Siervo Ministerial)</option>';

        // Verificar si hay publicadores disponibles
        if (!publicadores || publicadores.length === 0) {
          mostrarMensaje(
            "No hay publicadores disponibles para agregar como oradores",
            "info"
          );
          return; // Salir temprano si no hay publicadores
        }

        // Agregar opciones de publicadores
        publicadores.forEach((pub) => {
          const option = document.createElement("option");
          option.value = pub.id;
          option.textContent = `${pub.nombre} (${pub.privilegio_servicio})`;
          publicadorSelect.appendChild(option);
        });

        // Asegurarse de que el botón no tenga data-id para nuevo orador
        btnGuardar.removeAttribute("data-id");
      }

      // Mostrar el modal
      modal.show();
    } catch (error) {
      console.error("Error al cargar los publicadores:", error);
      mostrarMensaje("Error al cargar la lista de publicadores", "error");
      return; // Salir si hay un error
    } finally {
      // Habilitar el botón de guardar cuando todo esté listo
      btnGuardar.disabled = false;
    }
  } catch (error) {
    console.error("Error al mostrar el modal de orador:", error);
    mostrarMensaje("Error al cargar el formulario: " + error.message, "error");
  }
}

// Guardar orador (crear o actualizar)
async function guardarOrador(event) {
  event.preventDefault();

  const form = document.getElementById("oradorForm");
  const formData = new FormData(form);
  const oradorId = document
    .getElementById("guardarOrador")
    .getAttribute("data-id");
  const publicadorId = formData.get("publicador_id");
  const saliente = formData.get("saliente") === "on";

  try {
    // Solo validar la selección de publicador si es un nuevo registro
    if (!oradorId && !publicadorId) {
      mostrarMensaje("Por favor seleccione un publicador", "error");
      return;
    }

    // Si es un nuevo registro, verificar que el publicador no sea ya un orador
    if (!oradorId) {
      try {
        const { data: oradorExistente, error: errorExistente } = await supabase
          .from("oradores")
          .select("id")
          .eq("publicador_id", publicadorId);

        if (oradorExistente && oradorExistente.length > 0) {
          mostrarMensaje(
            "Este publicador ya está registrado como orador",
            "error"
          );
          return;
        }
      } catch (error) {
        console.error("Error al verificar orador existente:", error);
        // Continuar con el guardado a pesar del error de verificación
      }
    }

    // Obtener el publicador seleccionado (para nuevo orador) o el actual (para edición)
    let publicador;

    if (oradorId) {
      // Si estamos editando, obtener el publicador actual
      const { data: oradorActual, error: oradorError } = await supabase
        .from("oradores")
        .select("publicador_id")
        .eq("id", oradorId)
        .single();

      if (oradorError) throw oradorError;

      const { data: publicadorData, error: publicadorError } = await supabase
        .from("publicadores")
        .select("id, nombre, privilegio_servicio, congregacion_id")
        .eq("id", publicadorId || oradorActual.publicador_id)
        .single();

      if (publicadorError) throw publicadorError;
      publicador = publicadorData;
    } else {
      // Si es un nuevo orador, obtener los datos del publicador seleccionado
      publicador = (
        await supabase
          .from("publicadores")
          .select("id, nombre, privilegio_servicio, congregacion_id")
          .eq("id", publicadorId)
          .single()
      ).data;
    }

    if (!publicador) {
      throw new Error("No se pudo obtener la información del publicador");
    }

    // Preparar los datos para guardar
    const oradorData = {
      publicador_id: publicador.id,
      saliente: saliente,
      publicador: {
        id: publicador.id,
        nombre: publicador.nombre,
        privilegio_servicio: publicador.privilegio_servicio,
        congregacion_id: publicador.congregacion_id,
      },
      organizacion_id: 1, // Ajustar según sea necesario
    };

    let error = null;

    // Crear o actualizar el orador
    if (oradorId) {
      // Actualizar orador existente
      const { error: updateError } = await supabase
        .from("oradores")
        .update({
          saliente: oradorData.saliente,
          // No actualizamos el publicador_id al editar
        })
        .eq("id", oradorId);

      error = updateError;
    } else {
      // Crear nuevo orador
      const { error: insertError } = await supabase.from("oradores").insert([
        {
          publicador_id: oradorData.publicador_id,
          saliente: oradorData.saliente,
          organizacion_id: oradorData.organizacion_id,
        },
      ]);

      error = insertError;
    }

    if (error) throw error;

    // Cerrar el modal
    const modalElement = document.getElementById("oradorModal");
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }

    // Mostrar mensaje de éxito
    mostrarMensaje(
      `Orador ${oradorId ? "actualizado" : "agregado"} correctamente`,
      "success"
    );

    // Recargar la lista de oradores
    await cargarOradores();

    // Desplazarse al principio de la página para ver el mensaje
    window.scrollTo(0, 0);
  } catch (error) {
    console.error("Error al guardar el orador:", error);
    mostrarMensaje("Error al guardar el orador", "error");
  }
}

// Configurar el manejador de eventos para el formulario
const form = document.getElementById("oradorForm");
if (form) {
  form.addEventListener("submit", guardarOrador);
}

// Función para editar un orador
async function editarOrador(id) {
  // Guardar el texto original del botón
  const btnEditar = document.querySelector(
    `button[data-id="${id}"][onclick*="editarOrador"]`
  );
  const originalText = btnEditar ? btnEditar.innerHTML : "";

  if (btnEditar) {
    btnEditar.disabled = true;
    btnEditar.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cargando...';
  }

  try {
    // Buscar el orador en la lista local
    let orador = oradores.find((o) => o.id === id);

    // Si no está en la lista local, intentar cargarlo desde la base de datos
    if (!orador) {
      const { data, error } = await supabase
        .from("oradores")
        .select(
          `
          id,
          publicador_id,
          saliente,
          publicador:publicador_id (id, nombre, privilegio_servicio)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) throw new Error("No se encontró el orador seleccionado");

      orador = {
        id: data.id,
        publicador_id: data.publicador_id,
        saliente: data.saliente,
        publicador: data.publicador,
      };

      // Agregar a la lista local para futuras referencias
      oradores.push(orador);
    }

    // Mostrar el modal con los datos del orador
    await mostrarModalNuevoOrador(orador);
  } catch (error) {
    console.error("Error al cargar el orador para editar:", error);
    mostrarMensaje(
      "Error al cargar los datos del orador: " +
        (error.message || "Error desconocido"),
      "error"
    );
  } finally {
    // Restaurar el botón de editar
    const btnEditar = document.querySelector(
      `button[data-id="${id}"][onclick*="editarOrador"]`
    );
    if (btnEditar) {
      btnEditar.disabled = false;
      btnEditar.innerHTML = originalText || '<i class="fas fa-edit"></i>';
    }
  }
}

// Eliminar orador
async function eliminarOrador(id) {
  // Mostrar confirmación con SweetAlert2
  const result = await Swal.fire({
    title: "¿Está seguro?",
    text: "Esta acción eliminará al orador permanentemente y no se podrá deshacer.",
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
    try {
      // Mostrar indicador de carga
      const btnEliminar = document.querySelector(
        `button[data-id="${id}"][onclick*="eliminarOrador"]`
      );
      const originalContent = btnEliminar ? btnEliminar.innerHTML : "";

      if (btnEliminar) {
        btnEliminar.disabled = true;
        btnEliminar.innerHTML =
          '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Eliminando...';
      }

      // Proceder directamente con la eliminación ya que la tabla de asignaciones no existe
      const { error } = await supabase.from("oradores").delete().eq("id", id);

      if (error) throw error;

      // Mostrar mensaje de éxito
      await Swal.fire({
        title: "¡Eliminado!",
        text: "El orador ha sido eliminado correctamente.",
        icon: "success",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Aceptar",
      });

      // Actualizar la lista de oradores
      await cargarOradores();
    } catch (error) {
      console.error("Error al eliminar el orador:", error);

      // Mostrar mensaje de error
      await Swal.fire({
        title: "Error",
        text:
          "No se pudo eliminar el orador: " +
          (error.message || "Error desconocido"),
        icon: "error",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Aceptar",
      });
    } finally {
      // Restaurar el botón de eliminar
      const btnEliminar = document.querySelector(
        `button[data-id="${id}"][onclick*="eliminarOrador"]`
      );
      if (btnEliminar) {
        btnEliminar.disabled = false;
        btnEliminar.innerHTML = originalContent;
      }
    }
  }
}

// Mostrar mensaje de notificación
function mostrarMensaje(mensaje, tipo = "info") {
  // Configuración común para todos los tipos de mensajes
  const toastConfig = {
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  };

  // Configuración específica por tipo de mensaje
  const config = {
    ...toastConfig,
    text: mensaje,
    icon: tipo,
    background: "var(--color-surface)",
    color: "var(--color-text)",
    customClass: {
      popup: "sweetalert-popup",
      title: "sweetalert-title",
      htmlContainer: "sweetalert-html",
      confirmButton: "sweetalert-confirm",
      cancelButton: "sweetalert-cancel",
      actions: "sweetalert-actions",
      icon: `sweetalert-icon-${tipo}`,
    },
  };

  // Mostrar el mensaje
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

// Toggle del panel de importación/exportación
function toggleImportExportPanel(e) {
  // Prevenir el cierre inmediato al hacer clic en el botón
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

  // Prevenir que el clic se propague al documento
  return false;
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
  ); // Usar captura para asegurar que se ejecute primero

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

// Exportar a Excel
async function exportarAExcel() {
  try {
    // Obtener los datos actualizados de la base de datos
    const { data: oradores, error } = await supabase
      .from("oradores")
      .select(
        `
        publicador_id,
        saliente,
        publicador:publicador_id (
          nombre,
          privilegio_servicio,
          congregacion:congregacion_id(nombre)
        )
      `
      )
      .order("publicador_id", { ascending: true });

    if (error) throw error;

    if (!oradores || oradores.length === 0) {
      mostrarMensaje("No hay oradores para exportar", "warning");
      return;
    }

    // Definir encabezados
    const headers = [
      "Nombre",
      "Privilegio de Servicio",
      "Congregación",
      "Es Saliente",
    ];

    // Formatear los datos para Excel
    const data = [headers];

    // Mapear los datos para el Excel
    oradores.forEach((orador) => {
      data.push([
        orador.publicador?.nombre || "Sin nombre",
        orador.publicador?.privilegio_servicio || "",
        orador.publicador?.congregacion?.nombre || "Sin congregación",
        orador.saliente ? "Sí" : "No",
      ]);
    });

    // Crear un nuevo libro de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Ajustar el ancho de las columnas
    const columnWidths = [
      { wch: 30 }, // Nombre
      { wch: 25 }, // Privilegio de Servicio
      { wch: 25 }, // Congregación
      { wch: 15 }, // Es Saliente
    ];
    ws["!cols"] = columnWidths;

    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, "Oradores");

    // Generar el archivo Excel
    const fecha = new Date().toISOString().split("T")[0];
    const fileName = `oradores_${fecha}.xlsx`;

    try {
      // Usar XLSX para generar el archivo
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

      // Usar FileSaver.js para guardar el archivo
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Guardar el archivo usando FileSaver.js
      saveAs(data, fileName);
    } catch (e) {
      console.error("Error al exportar a Excel:", e);
      throw e; // Relanzar el error para que sea manejado por el catch externo
    }

    mostrarMensaje("Exportación completada con éxito", "success");
  } catch (error) {
    console.error("Error al exportar a Excel:", error);
    mostrarMensaje(
      "Error al exportar a Excel: " + (error.message || "Error desconocido"),
      "error"
    );
  }
}

// Helper function for Excel export
function s2ab(s) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
  return buf;
}

// Exportar a PDF
async function exportarAPDF() {
  try {
    // Obtener los datos actualizados de la base de datos
    const { data: oradores, error } = await supabase
      .from("oradores")
      .select(
        `
        publicador_id,
        saliente,
        publicador:publicador_id (
          nombre,
          privilegio_servicio,
          congregacion:congregacion_id(nombre)
        )
      `
      )
      .order("publicador_id", { ascending: true });

    if (error) throw error;

    if (!oradores || oradores.length === 0) {
      mostrarMensaje("No hay oradores para exportar", "warning");
      return;
    }

    // Crear un nuevo documento PDF
    const doc = new jspdf.jsPDF();

    // Título del documento
    doc.setFontSize(20);
    doc.text("Lista de Oradores", 14, 22);

    // Fecha de generación
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);

    // Preparar los datos para la tabla
    const headers = [
      "Nombre",
      "Privilegio de Servicio",
      "Congregación",
      "Es Saliente",
    ];

    const datos = oradores.map((orador) => [
      orador.publicador?.nombre || "Sin nombre",
      orador.publicador?.privilegio_servicio || "",
      orador.publicador?.congregacion?.nombre || "Sin congregación",
      orador.saliente ? "Sí" : "No",
    ]);

    // Agregar la tabla al PDF
    doc.autoTable({
      head: [headers],
      body: datos,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        valign: "middle",
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [41, 128, 185], // Color azul similar al de la interfaz
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 40 },
    });

    // Guardar el PDF
    doc.save(`oradores_${new Date().toISOString().split("T")[0]}.pdf`);

    mostrarMensaje("Exportación a PDF completada con éxito", "success");
  } catch (error) {
    console.error("Error al exportar a PDF:", error);
    mostrarMensaje(
      "Error al exportar a PDF: " + (error.message || "Error desconocido"),
      "error"
    );
  }
}

// Función auxiliar para normalizar texto (eliminar acentos y convertir a minúsculas)
function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Función para buscar un publicador por nombre
async function buscarPublicadorPorNombre(nombre) {
  if (!nombre) return null;

  const nombreNormalizado = normalizarTexto(nombre);

  try {
    // Buscar por coincidencia parcial en el nombre
    const { data, error } = await supabase
      .from("publicadores")
      .select("*")
      .ilike("nombre", `%${nombre}%`);

    if (error) {
      console.error("Error al buscar publicador:", error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log(`No se encontró publicador con nombre: ${nombre}`);
      return null;
    }

    // Buscar coincidencia exacta ignorando mayúsculas/minúsculas y acentos
    const coincidenciaExacta = data.find(
      (p) => normalizarTexto(p.nombre) === nombreNormalizado
    );

    // Si hay una coincidencia exacta, devolverla, de lo contrario devolver la primera coincidencia
    const publicador = coincidenciaExacta || data[0];
    
    console.log(`Publicador encontrado para '${nombre}':`, publicador);
    return publicador;
  } catch (error) {
    console.error("Error inesperado al buscar publicador:", error);
    return null;
  }
}

// Función para importar oradores desde un archivo Excel
async function importarDesdeExcel(file) {
  const loadingSwal = Swal.fire({
    title: 'Procesando archivo',
    html: 'Por favor espere mientras se procesa el archivo...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  try {
    if (!file) {
      throw new Error('No se seleccionó ningún archivo');
    }


    try {
      // Leer el archivo Excel usando XLSX
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      if (!worksheet) {
        throw new Error("El archivo no contiene hojas válidas");
      }

      // Convertir la hoja a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (jsonData.length < 2) {
        throw new Error("El archivo está vacío o no contiene datos");
      }

      // Obtener los encabezados y validar
      const headers = jsonData[0].map(header => String(header || '').trim().toLowerCase());
      const requiredHeaders = ["nombre"];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        throw new Error(`Faltan encabezados requeridos: ${missingHeaders.join(", ")}`);
      }

      // Procesar filas de datos
      const filasConErrores = [];
      const filasConAdvertencias = [];
      const nuevosOradores = [];

      // Obtener todos los oradores existentes
      const { data: oradoresActuales, error: errorOradores } = await supabase
        .from("oradores")
        .select(`
          id,
          publicadores (
            id,
            nombre
          )
        `);

      if (errorOradores) throw errorOradores;

      // Crear un mapa de oradores existentes por ID y nombre
      const oradoresPorId = new Map();
      const oradoresPorNombre = new Map();

      oradoresActuales.forEach((orador) => {
        if (orador.publicadores) {
          oradoresPorId.set(orador.publicadores.id, orador);
          const nombreCompleto = `${orador.publicadores.nombre}`
            .toLowerCase()
            .trim();
          oradoresPorNombre.set(nombreCompleto, orador);
        }
      });

      // Procesar cada fila del archivo
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const rowData = {};
        
        // Mapear los valores a los encabezados
        headers.forEach((header, index) => {
          rowData[header] = row[index] !== undefined ? String(row[index]).trim() : '';
        });

        const nombreCompleto = String(rowData.nombre || '').trim();
        
        // Validar nombre
        if (!nombreCompleto) {
          filasConErrores.push({
            fila: i + 1,
            mensaje: "Nombre vacío"
          });
          continue;
        }

        // Buscar el publicador por nombre
        const publicador = await buscarPublicadorPorNombre(nombreCompleto);

        if (!publicador) {
          filasConErrores.push({
            fila: i + 1,
            mensaje: `No se encontró el publicador: ${nombreCompleto}`
          });
          continue;
        }

        // Verificar si ya es orador
        if (oradoresPorId.has(publicador.id)) {
          filasConAdvertencias.push({
            fila: i + 1,
            mensaje: `El publicador ya está en la lista de oradores: ${nombreCompleto}`
          });
          continue;
        }

        // Verificar si hay otro orador con el mismo nombre (caso de nombres duplicados)
        const nombreNormalizado = normalizarTexto(nombreCompleto);
        if (
          Array.from(oradoresPorNombre.keys()).some(
            (nombre) => normalizarTexto(nombre) === nombreNormalizado
          )
        ) {
          filasConAdvertencias.push({
            fila: i + 1,
            mensaje: `Posible duplicado: ${nombreCompleto}`
          });
          // Continuamos de todos modos, ya que es solo una advertencia
        }

        // Agregar a la lista de nuevos oradores
        nuevosOradores.push({
          publicador_id: publicador.id,
          saliente:
            rowData.saliente === "Sí" ||
            rowData.saliente === "Si" ||
            rowData.saliente === "1" ||
            rowData.saliente === true
        });

        // Agregar al mapa de oradores para evitar duplicados en esta importación
        oradoresPorId.set(publicador.id, { publicadores: publicador });
        oradoresPorNombre.set(nombreCompleto.toLowerCase(), {
          publicadores: publicador
        });
      }

      // Mostrar resumen de advertencias si las hay
      if (filasConAdvertencias.length > 0) {
        const mensajeAdvertencias =
          `Se encontraron ${filasConAdvertencias.length} advertencias. ¿Desea continuar con la importación?<br><br>` +
          filasConAdvertencias
            .slice(0, 5)
            .map(w => `Fila ${w.fila}: ${w.mensaje}`)
            .join("<br>") +
          (filasConAdvertencias.length > 5
            ? `<br>...y ${filasConAdvertencias.length - 5} más.`
            : "");

          const { isConfirmed } = await Swal.fire({
            title: "Advertencias",
            html: mensajeAdvertencias,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, continuar",
            cancelButtonText: "Cancelar",
            showLoaderOnConfirm: true,
          });

          if (!isConfirmed) {
            throw new Error("Importación cancelada por el usuario");
          }
        }

        // Mostrar resumen de errores si los hay
        if (filasConErrores.length > 0) {
          const mensajeErrores =
            `Se encontraron ${filasConErrores.length} errores en el archivo. ` +
            "Se importarán los registros válidos.<br><br>" +
            filasConErrores
              .slice(0, 5)
              .map((e) => `Fila ${e.fila}: ${e.mensaje}`)
              .join("<br>") +
            (filasConErrores.length > 5
              ? `<br>...y ${filasConErrores.length - 5} más.`
              : "");

          const { isConfirmed } = await Swal.fire({
            title: "Errores en el archivo",
            html: mensajeErrores,
            icon: "error",
            showCancelButton: true,
            confirmButtonText: "Continuar con la importación",
            cancelButtonText: "Cancelar",
            showLoaderOnConfirm: true,
          });

          if (!isConfirmed) {
            throw new Error("Importación cancelada por el usuario");
          }
        }

        // Si no hay oradores para importar, mostrar mensaje y salir
        if (nuevosOradores.length === 0) {
          await Swal.fire({
            title: "Nada que importar",
            text: "No se encontraron nuevos oradores para importar.",
            icon: "info"
          });
          return;
        }

        // Insertar los nuevos oradores en lotes para evitar timeouts
        const batchSize = 50;
        const totalBatches = Math.ceil(nuevosOradores.length / batchSize);
        let oradoresImportados = 0;

        for (let i = 0; i < nuevosOradores.length; i += batchSize) {
          const batch = nuevosOradores.slice(i, i + batchSize);
          const { error: insertError } = await supabase
            .from("oradores")
            .insert(batch);

          if (insertError) throw insertError;

          oradoresImportados += batch.length;

          // Actualizar el progreso
          const progreso = Math.round(
            ((i + batch.length) / nuevosOradores.length) * 100
          );
          
          if (Swal.isVisible()) {
            Swal.update({
              title: `Importando oradores... (${progreso}%)`,
              html: `Procesando lote ${Math.ceil((i + batchSize) / batchSize)} de ${totalBatches}<br>${oradoresImportados} de ${nuevosOradores.length} oradores importados`
            });
          }
        }

        // Mostrar mensaje de éxito
        await Swal.fire({
          title: "¡Importación exitosa!",
          text: `Se importaron ${oradoresImportados} oradores correctamente.`,
          icon: "success"
        });

        // Recargar la lista de oradores
        await cargarOradores();
      } catch (error) {
        console.error("Error durante la importación:", error);
        
        // Cerrar cualquier diálogo de carga pendiente
        if (Swal.isVisible()) {
          await Swal.hideLoading();
          await Swal.close();
        }
        
        mostrarMensaje(
          "Error al importar desde Excel: " + (error.message || "Error desconocido"),
          "error"
        );
      } finally {
        // Asegurarse de que el diálogo de carga se cierre
        if (Swal.isVisible()) {
          await Swal.close();
        }
      }
    } catch (error) {
      console.error("Error en la función importarDesdeExcel:", error);
      mostrarMensaje(
        error.message || "Ocurrió un error inesperado al importar desde Excel",
        "error"
      );
    }
  }

// Exportar funciones para acceso global
window.mostrarModalNuevoOrador = mostrarModalNuevoOrador;
window.editarOrador = editarOrador;
window.eliminarOrador = eliminarOrador;
window.guardarOrador = guardarOrador;
window.exportarAExcel = exportarAExcel;
window.exportarAPDF = exportarAPDF;

// Manejar redimensionamiento de la ventana
window.addEventListener("resize", () => {
  try {
    const filteredOradores = getFiltredOradores();
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const oradoresPaginados = filteredOradores.slice(start, end);
    updateMobileTable(oradoresPaginados);
  } catch (error) {
    console.error("Error al manejar el redimensionamiento:", error);
  }
});
