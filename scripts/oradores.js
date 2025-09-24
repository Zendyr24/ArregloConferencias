// Importar dependencias
import { supabase } from './supabase.js';
import { isAuthenticated, redirectToLogin } from './auth/auth-utils.js';

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
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Verificar autenticación
    if (!isAuthenticated()) {
      redirectToLogin();
      return;
    }
    

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
    mostrarMensaje('Error al inicializar el módulo de oradores', 'error');
  }
});

// Configurar event listeners
function setupEventListeners() {
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
      btnImportar.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await importarDesdeExcel();
        } catch (error) {
          console.error("Error al importar desde Excel:", error);
          mostrarMensaje('Error al importar desde Excel', 'error');
        }
      });
    }

    // Configurar botón de exportar a Excel
    if (btnExportar) {
      btnExportar.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await exportarAExcel();
        } catch (error) {
          console.error("Error al exportar a Excel:", error);
          mostrarMensaje('Error al exportar a Excel', 'error');
        }
      });
    }

    // Configurar botón de exportar a PDF
    if (btnExportarPDF) {
      btnExportarPDF.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await exportarAPDF();
        } catch (error) {
          console.error("Error al exportar a PDF:", error);
          mostrarMensaje('Error al exportar a PDF', 'error');
        }
      });
    }
  } catch (error) {
    console.error("Error al configurar los botones de importar/exportar:", error);
    mostrarMensaje('Error al configurar los botones de importar/exportar', 'error');
  }

  if (btnExportarPDF) {
    btnExportarPDF.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await exportarAPDF();
      } catch (error) {
        console.error("Error al exportar a PDF:", error);
      }
    });
  }

  // Configurar el listener para cerrar el panel al hacer clic fuera
  setupClickOutsideListener();
}

// Cargar oradores desde la base de datos
async function cargarOradores() {
  // Asegurarse de que tbody esté definido
  const tbody = document.querySelector(".data-table tbody");
  if (!tbody) {
    console.error('No se encontró el elemento tbody');
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

// Editar orador
async function editarOrador(id) {
  try {
    // Mostrar indicador de carga
    const btnEditar = document.querySelector(
      `button[data-id="${id}"][onclick*="editarOrador"]`
    );
    const originalText = btnEditar ? btnEditar.innerHTML : "";

    if (btnEditar) {
      btnEditar.disabled = true;
      btnEditar.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cargando...';
    }

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
    // Verificar si hay datos para exportar
    if (oradores.length === 0) {
      console.warn("No hay datos para exportar");
      return;
    }

    // Crear un libro de trabajo de ExcelJS
    const ExcelJS = window.ExcelJS;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Oradores");

    // Definir las columnas
    worksheet.columns = [
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Congregación", key: "congregacion", width: 25 },
      { header: "Teléfono", key: "telefono", width: 20 },
      { header: "Correo Electrónico", key: "email", width: 30 },
      { header: "Disponibilidad", key: "disponibilidad", width: 20 },
    ];

    // Agregar los datos
    oradores.forEach((orador) => {
      worksheet.addRow({
        nombre: orador.nombre || "",
        congregacion:
          typeof orador.congregacion === "object"
            ? orador.congregacion.nombre
            : orador.congregacion || "",
        telefono: orador.telefono || "",
        email: orador.email || "",
        disponibilidad: orador.disponibilidad || "",
      });
    });

    // Estilizar el encabezado
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    // Generar el archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oradores_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    console.log("Exportación a Excel completada con éxito");
  } catch (error) {
    console.error("Error al exportar a Excel:", error);
  }
}

// Exportar a PDF
async function exportarAPDF() {
  try {
    // Verificar si hay datos para exportar
    if (oradores.length === 0) {
      console.warn("No hay datos para exportar");
      return;
    }

    // Crear un nuevo documento PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título del documento
    doc.setFontSize(18);
    doc.text("Lista de Oradores", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    // Fecha de generación
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);

    // Configuración de la tabla
    const columns = [
      { title: "Nombre", dataKey: "nombre" },
      { title: "Congregación", dataKey: "congregacion" },
      { title: "Teléfono", dataKey: "telefono" },
      { title: "Correo", dataKey: "email" },
      { title: "Disponibilidad", dataKey: "disponibilidad" },
    ];

    // Preparar los datos
    const rows = oradores.map((orador) => ({
      nombre: orador.nombre || "",
      congregacion:
        typeof orador.congregacion === "object"
          ? orador.congregacion.nombre
          : orador.congregacion || "",
      telefono: orador.telefono || "",
      email: orador.email || "",
      disponibilidad: orador.disponibilidad || "",
    }));

    // Agregar la tabla al PDF
    doc.autoTable({
      head: [columns.map((col) => col.title)],
      body: rows.map((row) => columns.map((col) => row[col.dataKey])),
      startY: 40,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: "linebreak",
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [211, 211, 211],
        textColor: 0,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Guardar el PDF
    doc.save(`oradores_${new Date().toISOString().split("T")[0]}.pdf`);

    console.log("Exportación a PDF completada con éxito");
  } catch (error) {
    console.error("Error al exportar a PDF:", error);
  }
}

// Importar desde Excel
async function importarDesdeExcel() {
  try {
    // Crear un input de tipo archivo
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx, .xls";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // Mostrar mensaje en consola
        console.log("Procesando archivo, por favor espere...");

        // Leer el archivo Excel
        const buffer = await file.arrayBuffer();
        const ExcelJS = window.ExcelJS;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        // Obtener la primera hoja
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          throw new Error("El archivo no contiene hojas válidas");
        }

        // Obtener los datos
        const data = [];
        const headers = [];

        // Leer la primera fila como encabezados
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value?.toString().toLowerCase() || "";
        });

        // Validar encabezados requeridos
        const requiredHeaders = ["nombre"];
        const missingHeaders = requiredHeaders.filter(
          (h) => !headers.includes(h)
        );

        if (missingHeaders.length > 0) {
          throw new Error(
            `Faltan encabezados requeridos: ${missingHeaders.join(", ")}`
          );
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
          throw new Error("No se encontraron datos para importar");
        }

        // Aquí iría la lógica para guardar los datos en Supabase
        console.log(`Se importaron ${data.length} oradores correctamente`);

        // Recargar la lista de oradores
        cargarOradores();
      } catch (error) {
        console.error("Error al procesar el archivo:", error);
      }
    };

    // Disparar el diálogo de selección de archivo
    input.click();
  } catch (error) {
    console.error("Error en la importación:", error);
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
