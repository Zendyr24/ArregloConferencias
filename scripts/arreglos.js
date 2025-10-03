// scripts/arreglos.js
import { supabase } from "./supabase.js";
import { db } from "./db.js";
import "./auth/arreglos-auth.js"; // Importa el archivo de autenticación
import { isAuthenticated, updateUserInfo, redirectToLogin, getCurrentUser } from "./auth/auth-utils.js";

// Variable global para la instancia del calendario
let calendar;

// Inicializar la página
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Verificar autenticación
    if (!isAuthenticated()) {
      redirectToLogin();
      return;
    }

    // Actualizar la información del usuario en la interfaz
    updateUserInfo();

    // Configurar manejadores de eventos
    configurarEventos();

    // Inicializar el calendario
    inicializarCalendario();

    // Cargar los arreglos en el calendario
    await cargarArreglos();
  } catch (error) {
    console.error("Error al inicializar el módulo de arreglos:", error);
    mostrarNotificacion("Error al inicializar el módulo de arreglos", "error");
  }
});

// Inicializar el calendario
function inicializarCalendario() {
  const calendarEl = document.getElementById("calendar");

  if (!calendarEl) return;

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "es",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
    },
    buttonText: {
      today: "Hoy",
      month: "Mes",
      week: "Semana",
      day: "Día",
      list: "Lista",
    },
    events: [], // Los eventos se cargarán dinámicamente
    eventClick: manejarClicEvento,
    eventContent: personalizarVistaEvento,
    height: "auto",
    firstDay: 1, // Lunes como primer día de la semana
    editable: true,
    selectable: true,
    select: manejarSeleccionFecha,
    eventDrop: manejarArrastreEvento,
    eventResize: manejarRedimensionEvento,
  });

  calendar.render();
}

// Cargar programas con sus arreglos desde Supabase
async function cargarArreglos() {
  try {
    // Obtener el usuario actual del localStorage
    const user = getCurrentUser();
    
    if (!user) {
      console.error("No se pudo obtener la información del usuario");
      return [];
    }

    // Obtener la organización del usuario
    const { data: usuario, error: errorUsuario } = await supabase
      .from("users")
      .select("organizacion_id")
      .eq("id", user.id)
      .single();

    if (errorUsuario || !usuario) {
      console.error(
        "Error al obtener la organización del usuario:",
        errorUsuario
      );
      mostrarNotificacion(
        "Error al cargar la información de la organización",
        "error"
      );
      return;
    }

    // Consulta para obtener los programas con sus arreglos
    const { data: programas, error } = await supabase
      .from("programa")
      .select(`
        id,
        fecha,
        tipo,
        arreglos:arreglo(
          id,
          tipo_movimiento,
          orador_id,
          bosquejo_id,
          congregacion_destino_id,
          descripcion,
          orador:orador_id(
            id,
            publicador:publicador_id(
              id,
              nombre,
              congregacion:congregacion_id(
                id,
                nombre,
                circuito
              )
            )
          ),
          bosquejo:bosquejo_id(
            id,
            titulo,
            numero
          ),
          congregacion_destino:congregacion_destino_id(
            id,
            nombre,
            circuito
          )
        )
      `)
      .eq("organizacion_id", usuario.organizacion_id)
      .order("fecha", { ascending: true });

    if (error) {
      console.error("Error al cargar los programas:", error);
      mostrarNotificacion(
        "Error al cargar los programas. Por favor, intente nuevamente.",
        "error"
      );
      return [];
    }

    // Limpiar el calendario
    const calendarEl = document.getElementById("calendar");
    if (!calendarEl) return [];

    const calendar = new FullCalendar.Calendar(calendarEl);
    calendar.removeAllEvents();

    // Procesar cada programa y sus arreglos
    const eventos = [];

    programas.forEach((programa) => {
      // Crear un evento para el programa
      const eventoPrograma = {
        id: `programa-${programa.id}`,
        title: `Programa: ${programa.tipo}`,
        start: programa.fecha_hora,
        allDay: false,
        backgroundColor: "#4e73df",
        borderColor: "#4e73df",
        textColor: "#fff",
        extendedProps: {
          tipo: "programa",
          programaId: programa.id,
          arreglos: programa.arreglos || [],
        },
      };

      eventos.push(eventoPrograma);

      // Crear eventos para cada arreglo del programa
      if (programa.arreglos && programa.arreglos.length > 0) {
        programa.arreglos.forEach((arreglo, index) => {
          const tituloArreglo = `Arreglo: ${arreglo.tipo_movimiento}`;
          const descripcion = `${arreglo.orador?.nombre || "Sin orador"} - ${
            arreglo.bosquejo?.titulo || "Sin bosquejo"
          }`;

          const eventoArreglo = {
            id: `arreglo-${arreglo.id}`,
            groupId: `programa-${programa.id}`,
            title: tituloArreglo,
            start: programa.fecha_hora,
            allDay: false,
            backgroundColor: obtenerColorPorEstado(
              arreglo.estado || "pendiente"
            ),
            borderColor: obtenerColorPorEstado(arreglo.estado || "pendiente"),
            textColor: obtenerColorTextoPorEstado(
              arreglo.estado || "pendiente"
            ),
            extendedProps: {
              tipo: "arreglo",
              programaId: programa.id,
              arregloId: arreglo.id,
              descripcion: descripcion,
              tipoMovimiento: arreglo.tipo_movimiento,
              orador: arreglo.orador,
              bosquejo: arreglo.bosquejo,
              congregacionDestino: arreglo.congregacion_destino,
              observaciones: arreglo.observaciones,
              estado: arreglo.estado || "pendiente",
            },
          };

          eventos.push(eventoArreglo);
        });
      }
    });

    // Agregar eventos al calendario
    calendar.addEventSource(eventos);

    // Actualizar la lista de próximos eventos
    actualizarProximosEventos(eventos);

    return eventos;

    // Cerrar el bloque try y agregar manejo de errores
  } catch (error) {
    console.error("Error al cargar los arreglos:", error);
    mostrarNotificacion(
      "Error al cargar los arreglos. Por favor, intente de nuevo.",
      "error"
    );
    return [];
  }
}

// Personalizar la vista de los eventos en el calendario
function personalizarVistaEvento(arg) {
  const { event } = arg;
  const { extendedProps } = event;

  // Crear contenedor principal
  const container = document.createElement("div");
  container.className = "fc-event-main";
  container.style.padding = "2px 4px";

  // Título del evento
  const titleEl = document.createElement("div");
  titleEl.textContent = event.title;
  titleEl.style.fontWeight = "500";
  titleEl.style.marginBottom = "2px";

  // Hora del evento
  const timeEl = document.createElement("div");
  timeEl.textContent = event.start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  timeEl.style.fontSize = "0.8em";
  timeEl.style.opacity = "0.9";

  container.appendChild(titleEl);
  container.appendChild(timeEl);

  return { domNodes: [container] };
}

// Manejar clic en un evento
function manejarClicEvento(info) {
  const { event } = info;
  const { extendedProps } = event;

  // Mostrar detalles del arreglo en un modal
  mostrarModalArreglo({
    id: event.id,
    titulo: event.title,
    fecha_hora_inicio: event.start,
    fecha_hora_fin: event.end || event.start,
    todo_el_dia: event.allDay,
    ...extendedProps,
  });

  // Resaltar el evento seleccionado
  info.jsEvent.preventDefault();
}

// Manejar selección de fecha para crear nuevo arreglo
function manejarSeleccionFecha(selectInfo) {
  // Mostrar modal para crear un nuevo arreglo
  mostrarModalArreglo({
    fecha_hora_inicio: selectInfo.start,
    fecha_hora_fin: selectInfo.end || selectInfo.start,
  });

  calendar.unselect();
}

// Manejar arrastre de evento
async function manejarArrastreEvento(info) {
  try {
    const { event } = info;

    // Actualizar la fecha/hora del arreglo en la base de datos
    const { error } = await db.actualizar("arreglos", event.id, {
      fecha_hora_inicio: event.start,
      fecha_hora_fin: event.end || event.start,
    });

    if (error) throw error;

    // Mostrar notificación de éxito
    mostrarNotificacion("Arreglo actualizado correctamente", "success");
  } catch (error) {
    console.error("Error al actualizar el arreglo:", error);
    mostrarNotificacion("Error al actualizar el arreglo", "error");
    // Revertir el cambio en el calendario
    info.revert();
  }
}

// Manejar redimensión de evento
async function manejarRedimensionEvento(info) {
  try {
    const { event } = info;

    // Actualizar la fecha/hora de finalización del arreglo en la base de datos
    const { error } = await db.actualizar("arreglos", event.id, {
      fecha_hora_fin: event.end || event.start,
    });

    if (error) throw error;

    // Mostrar notificación de éxito
    mostrarNotificacion("Arreglo actualizado correctamente", "success");
  } catch (error) {
    console.error("Error al actualizar el arreglo:", error);
    mostrarNotificacion("Error al actualizar el arreglo", "error");
    // Revertir el cambio en el calendario
    info.revert();
  }
}

// Actualizar la lista de próximos eventos
function actualizarProximosEventos(eventos) {
  const ahora = new Date();
  const enUnaSemana = new Date();
  enUnaSemana.setDate(ahora.getDate() + 7);

  // Filtrar eventos futuros (hasta una semana)
  const proximosEventos = eventos
    .filter(
      (evento) =>
        new Date(evento.start) >= ahora && new Date(evento.start) <= enUnaSemana
    )
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  const contenedorEventos = document.querySelector(".event-list");
  if (!contenedorEventos) return;

  // Limpiar eventos existentes
  contenedorEventos.innerHTML = "";

  if (proximosEventos.length === 0) {
    contenedorEventos.innerHTML =
      '<p class="text-muted">No hay eventos programados para la próxima semana.</p>';
    return;
  }

  // Agregar eventos a la lista
  proximosEventos.forEach((evento) => {
    const fecha = new Date(evento.start);
    const dia = fecha.getDate();
    const mes = fecha.toLocaleString("es-ES", { month: "short" });
    const hora = fecha.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const eventoHTML = `
      <div class="event-item">
        <div class="event-date">
          <span class="day">${dia}</span>
          <span class="month">${mes}</span>
        </div>
        <div class="event-details">
          <h4>${evento.title}</h4>
          <p><i class="far fa-clock"></i> ${hora}</p>
          ${
            evento.extendedProps.congregacion
              ? `<p><i class="fas fa-users"></i> ${evento.extendedProps.congregacion.nombre}</p>`
              : ""
          }
          ${
            evento.extendedProps.orador
              ? `<p><i class="fas fa-user-tie"></i> ${evento.extendedProps.orador.nombre} ${evento.extendedProps.orador.apellido}</p>`
              : ""
          }
        </div>
        <div class="event-actions">
          <button class="btn-icon" data-id="${evento.id}" data-action="view">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
    `;

    contenedorEventos.insertAdjacentHTML("beforeend", eventoHTML);
  });
}

// Mostrar modal para crear/editar un programa con sus arreglos
async function mostrarModalArreglo(programa = {}) {
  try {
    // Obtener datos necesarios
    const [oradores, congregaciones, bosquejos] = await Promise.all([
      obtenerOradores(),
      obtenerCongregaciones(),
      obtenerBosquejos(),
    ]);

    // Determinar si es un programa nuevo o existente
    const esNuevo = !programa.id;

    // Actualizar el título del modal
    document.getElementById("modalTitulo").textContent = esNuevo
      ? "Nuevo Programa"
      : "Editar Programa";

    // Actualizar ID del programa si existe
    const programaIdInput = document.getElementById("programaId");
    if (programaIdInput) {
      programaIdInput.value = esNuevo ? "" : programa.id;
    }

    // Actualizar fecha y hora del programa
    const fechaHoraInput = document.getElementById("fechaHora");
    if (fechaHoraInput) {
      const fechaHora = programa.fecha_hora
        ? new Date(programa.fecha_hora)
        : new Date();
      fechaHoraInput.value = formatearFechaParaInput(fechaHora);
    }

    // Actualizar tipo de programa
    const tipoProgramaSelect = document.getElementById("tipoPrograma");
    if (tipoProgramaSelect) {
      tipoProgramaSelect.value = programa.tipo || "reunion"; // Valor por defecto
    }

    // Limpiar contenedor de arreglos
    const arreglosContainer = document.getElementById("arreglosContainer");
    if (arreglosContainer) {
      arreglosContainer.innerHTML = "";

      // Mostrar mensaje si no hay arreglos
      const sinArreglosMensaje = document.getElementById("sinArreglosMensaje");

      // Si hay arreglos existentes, mostrarlos
      if (programa.arreglos && programa.arreglos.length > 0) {
        if (sinArreglosMensaje) {
          sinArreglosMensaje.style.display = "none";
        }
        programa.arreglos.forEach((arreglo, index) => {
          agregarArregloAlFormulario(
            arreglo,
            index,
            oradores,
            congregaciones,
            bosquejos
          );
        });
      } else if (esNuevo) {
        // Si es un programa nuevo, agregar un arreglo vacío por defecto
        const arregloVacio = {
          tipo_movimiento: "saliente",
          orador_id: "",
          bosquejo_id: "",
          congregacion_id: "",
          observaciones: "",
        };
        agregarArregloAlFormulario(
          arregloVacio,
          0,
          oradores,
          congregaciones,
          bosquejos
        );
      } else if (sinArreglosMensaje) {
        // Mostrar mensaje si no hay arreglos y no es un programa nuevo
        sinArreglosMensaje.style.display = "block";
      }
    }

    // Configurar eventos del modal
    configurarEventosModal(programa);

    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById("arregloModal"));
    modal.show();

    // Configurar botón de agregar arreglo
    const btnAgregarArreglo = document.getElementById("btnAgregarArreglo");
    if (btnAgregarArreglo) {
      btnAgregarArreglo.onclick = () => {
        agregarArregloAlFormulario(
          null,
          document.querySelectorAll(".arreglo-card").length,
          oradores,
          congregaciones,
          bosquejos
        );
        const sinArreglosMensaje =
          document.getElementById("sinArreglosMensaje");
        if (sinArreglosMensaje) {
          sinArreglosMensaje.style.display = "none";
        }
      };
    }

    // Mostrar u ocultar botón de eliminar programa
    const btnEliminarPrograma = document.getElementById("btnEliminarPrograma");
    if (btnEliminarPrograma) {
      btnEliminarPrograma.style.display = esNuevo ? "none" : "block";
    }
  } catch (error) {
    console.error("Error al mostrar el modal de arreglo:", error);
    mostrarNotificacion("Error al cargar el formulario de arreglo", "error");
  }
}

// Función para agregar un formulario de arreglo al contenedor
function agregarArregloAlFormulario(
  arreglo,
  index,
  oradores,
  congregaciones,
  bosquejos
) {
  const arreglosContainer = document.getElementById("arreglosContainer");
  const arregloId = arreglo
    ? `arreglo-${arreglo.id}`
    : `nuevo-arreglo-${Date.now()}`;
  const esNuevo = !arreglo || !arreglo.id;

  // Crear el elemento del arreglo
  const arregloElement = document.createElement("div");
  arregloElement.className = "card mb-3 arreglo-card";
  arregloElement.dataset.arregloId = arregloId;

  // Crear el encabezado del card con los colores globales
  const cardHeader = document.createElement("div");
  cardHeader.className = "card-header text-center bg-primary text-white";
  cardHeader.style.borderBottom = "1px solid var(--color-border)";
  cardHeader.innerHTML = `
    <h5 class="mb-0 fw-semibold">Arreglo #${index + 1}</h5>
  `;

  // Crear el cuerpo del card
  const cardBody = document.createElement("div");
  cardBody.className = "card-body";

  // Crear el formulario de arreglo
  const form = document.createElement("form");
  form.className = "arreglo-form";
  form.dataset.arregloId = arregloId;

  // Si es un arreglo existente, agregar el ID oculto
  if (!esNuevo) {
    form.innerHTML += `
      <input type="hidden" name="arregloId" value="${arreglo.id}">
    `;
  }

  // Tipo de movimiento
  form.innerHTML = `
    <div class="mb-3">
      <label class="form-label">Tipo de Movimiento</label>
      <select class="form-select tipo-movimiento" name="tipo_movimiento" required>
        <option value="">Seleccione un tipo</option>
        <option value="saliente" ${
          arreglo?.tipo_movimiento === "saliente" ? "selected" : ""
        }>Orador que sale</option>
        <option value="entrante" ${
          arreglo?.tipo_movimiento === "entrante" ? "selected" : ""
        }>Orador que entra</option>
        <option value="interno" ${
          arreglo?.tipo_movimiento === "interno" ? "selected" : ""
        }>Orador interno</option>
      </select>
    </div>
    
    <div class="row">
      <div class="col-md-6">
        <div class="mb-3">
          <label class="form-label">Orador</label>
          <select class="form-select orador-select" name="orador_id" required>
            <option value="">Seleccione un orador</option>
            ${oradores
              .map(
                (orador) => `
              <option value="${orador.id}" 
                      data-congregacion-id="${orador.congregacion_id}"
                      data-congregacion-nombre="${orador.congregacion_nombre}"
                      data-congregacion-circuito="${
                        orador.congregacion_circuito || ""
                      }"
                      ${arreglo?.orador_id === orador.id ? "selected" : ""}>
                ${orador.nombre} (${orador.congregacion_nombre})
              </option>
            `
              )
              .join("")}
          </select>
        </div>
      </div>
      <div class="col-md-6">
        <div class="mb-3">
          <label class="form-label">Bosquejo</label>
          <select class="form-select bosquejo-select" name="bosquejo_id" required>
            <option value="">Seleccione un bosquejo</option>
            ${bosquejos
              .map(
                (bosquejo) => `
              <option value="${bosquejo.id}" ${
                  arreglo?.bosquejo_id === bosquejo.id ? "selected" : ""
                }>
                ${bosquejo.numero}. ${bosquejo.titulo}
              </option>
            `
              )
              .join("")}
          </select>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col-md-6">
        <div class="mb-3">
          <label class="form-label">Congregación de Origen</label>
          <div class="form-control-plaintext congregacion-origen-display" style="min-height: 38px; padding: 0.375rem 0.75rem; border: 1px solid transparent;">
            ${arreglo?.congregacion_origen_nombre || "Seleccione un orador"}
            ${
              arreglo?.congregacion_origen_circuito
                ? `(${arreglo.congregacion_origen_circuito})`
                : ""
            }
          </div>
          <input type="hidden" class="congregacion-origen" name="congregacion_origen_id" value="${
            arreglo?.congregacion_origen_id || ""
          }">
        </div>
      </div>
      <div class="col-md-6">
        <div class="mb-3">
          <label class="form-label">Congregación de Destino</label>
          <select class="form-select congregacion-destino" name="congregacion_destino_id">
            <option value="">Seleccione una congregación</option>
            ${congregaciones
              .map(
                (cong) => `
              <option value="${cong.id}" ${
                  arreglo?.congregacion_destino_id === cong.id ? "selected" : ""
                }>
                ${cong.nombre} (${cong.circuito})
              </option>
            `
              )
              .join("")}
          </select>
        </div>
      </div>
    </div>
    
    <div class="mb-3">
  `;

  // Agregar el formulario al card body
  cardBody.appendChild(form);

  // Crear el footer del card para el botón de eliminar
  const cardFooter = document.createElement("div");
  cardFooter.className = "card-footer text-center";
  cardFooter.innerHTML = `
    <button type="button" class="btn btn-outline-danger btn-sm btn-eliminar-arreglo" data-arreglo-id="${arregloId}">
      <i class="fas fa-trash me-1"></i> Eliminar Arreglo
    </button>
  `;

  // Agregar elementos al DOM
  arregloElement.appendChild(cardHeader);
  arregloElement.appendChild(cardBody);
  arregloElement.appendChild(cardFooter);
  arreglosContainer.appendChild(arregloElement);

  // Obtener referencias a los elementos del formulario
  const congregacionOrigenSelect = arregloElement.querySelector(
    ".congregacion-origen"
  );
  const congregacionDestinoSelect = arregloElement.querySelector(
    ".congregacion-destino"
  );
  const oradorSelect = arregloElement.querySelector(".orador-select");
  const tipoMovimientoSelect = arregloElement.querySelector(".tipo-movimiento");

  // Función para actualizar la congregación de origen basada en el orador seleccionado
  const actualizarCongregacionOrigen = () => {
    const oradorOption = oradorSelect.options[oradorSelect.selectedIndex];
    const congregacionOrigenDisplay = arregloElement.querySelector(
      ".congregacion-origen-display"
    );
    const congregacionOrigenInput = arregloElement.querySelector(
      ".congregacion-origen"
    );

    if (oradorOption && oradorOption.dataset.congregacionId) {
      // Actualizar el display y el input oculto
      const nombreCongregacion = oradorOption.dataset.congregacionNombre || "";
      const circuitoCongregacion =
        oradorOption.dataset.congregacionCircuito || "";
      const displayText = `${nombreCongregacion}${
        circuitoCongregacion ? ` (${circuitoCongregacion})` : ""
      }`;

      congregacionOrigenDisplay.textContent = displayText || "No especificada";
      congregacionOrigenInput.value = oradorOption.dataset.congregacionId;
    } else {
      congregacionOrigenDisplay.textContent = "Seleccione un orador";
      congregacionOrigenInput.value = "";
    }
  };

  // Función para actualizar la visibilidad de los campos según el tipo de movimiento
  const actualizarCamposPorTipoMovimiento = () => {
    const tipoMovimiento = tipoMovimientoSelect.value;

    // Actualizar la congregación de origen cuando cambia el orador
    actualizarCongregacionOrigen();

    // Mostrar/ocultar campos según el tipo de movimiento
    switch (tipoMovimiento) {
      case "saliente":
        // Para saliente, mostrar destino como requerido
        congregacionDestinoSelect.required = true;
        break;
      case "entrante":
        // Para entrante, mostrar origen como requerido
        // La congregación de origen ya está establecida por el orador
        break;
      case "interno":
      default:
        // Para interno, no se requiere destino
        congregacionDestinoSelect.required = false;
        break;
    }
  };

  // Configurar eventos
  tipoMovimientoSelect.addEventListener(
    "change",
    actualizarCamposPorTipoMovimiento
  );
  oradorSelect.addEventListener("change", actualizarCamposPorTipoMovimiento);

  // Configurar evento para eliminar arreglo
  const btnEliminar = arregloElement.querySelector(".btn-eliminar-arreglo");
  if (btnEliminar) {
    btnEliminar.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("¿Está seguro de que desea eliminar este arreglo?")) {
        // Si es un arreglo existente, marcar para eliminación
        if (!esNuevo) {
          const inputEliminado = document.createElement("input");
          inputEliminado.type = "hidden";
          inputEliminado.name = "arreglos_eliminados";
          inputEliminado.value = arreglo.id;
          form.appendChild(inputEliminado);
          arregloElement.style.display = "none"; // Ocultar en lugar de eliminar
        } else {
          arregloElement.remove(); // Eliminar si es un arreglo nuevo
        }

        // Mostrar mensaje si no quedan arreglos
        if (
          document.querySelectorAll(
            '.arreglo-card:not([style*="display: none"])'
          ).length === 0
        ) {
          document.getElementById("sinArreglosMensaje").style.display = "block";
        }
      }
    });
  }

  // Inicializar los campos según el tipo de movimiento
  actualizarCamposPorTipoMovimiento();

  // Retornar el elemento del arreglo creado
  return arregloElement;
}

// Función auxiliar para formatear fecha para input datetime-local
function formatearFechaParaInput(fecha) {
  const d = new Date(fecha);
  const pad = (num) => num.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// Función para configurar los eventos del modal
function configurarEventosModal(programa = {}) {
  // Configurar botón de guardar programa
  const btnGuardar = document.getElementById("btnGuardarPrograma");
  if (btnGuardar) {
    // Remover todos los eventos existentes del botón
    const newBtnGuardar = btnGuardar.cloneNode(true);
    btnGuardar.parentNode.replaceChild(newBtnGuardar, btnGuardar);
    
    // Cambiar el tipo del botón a 'button' para evitar el envío del formulario
    newBtnGuardar.type = 'button';
    
    // Agregar un solo manejador de eventos
    newBtnGuardar.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Deshabilitar el botón para evitar múltiples clics
      newBtnGuardar.disabled = true;
      newBtnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Guardando...';
      
      try {
        await guardarPrograma();
      } finally {
        // Restaurar el botón después de guardar o en caso de error
        newBtnGuardar.disabled = false;
        newBtnGuardar.innerHTML = '<i class="fas fa-save me-1"></i> Guardar Programa';
      }
    };
  }

  // Configurar botón de eliminar si existe
  const btnEliminar = document.getElementById("btnEliminar");
  if (btnEliminar && programa.id) {
    btnEliminar.onclick = () => eliminarArreglo(programa.id);
  }

  // Configurar botón para agregar nuevo arreglo
  const btnAgregarArreglo = document.getElementById("btnAgregarArreglo");
  if (btnAgregarArreglo) {
    btnAgregarArreglo.onclick = async () => {
      // Obtener datos necesarios para el nuevo arreglo
      const [oradores, congregaciones, bosquejos] = await Promise.all([
        obtenerOradores(),
        obtenerCongregaciones(),
        obtenerBosquejos(),
      ]);

      // Crear un nuevo arreglo vacío
      const nuevoArreglo = {
        tipo_movimiento: "saliente",
        orador_id: "",
        bosquejo_id: "",
        congregacion_id: "",
        observaciones: "",
      };

      // Obtener el índice para el nuevo arreglo
      const index = document.querySelectorAll(".arreglo-card").length;

      // Agregar el nuevo arreglo al formulario
      agregarArregloAlFormulario(
        nuevoArreglo,
        index,
        oradores,
        congregaciones,
        bosquejos
      );
    };
  }
}

// Guardar programa con sus arreglos
async function guardarPrograma() {
  try {
    // Obtener datos del formulario del programa
    const programaId = document.getElementById("programaId")?.value || "";
    const fechaHora = document.getElementById("fechaHora")?.value;
    const tipoPrograma = document.getElementById("tipoPrograma")?.value;

    // Validar campos requeridos
    if (!fechaHora || !tipoPrograma) {
      const mensaje = !fechaHora ? 'La fecha y hora son requeridas' : 'El tipo de programa es requerido';
      mostrarNotificacion(
        `Por favor complete todos los campos requeridos del programa: ${mensaje}`,
        "error"
      );
      return;
    }

    // Obtener los arreglos del formulario
    const arreglos = [];
    const arregloElements = document.querySelectorAll(".arreglo-card");

    for (const element of arregloElements) {
      const index = Array.from(arregloElements).indexOf(element);
      
      // Usar selectores basados en la estructura real del formulario
      const tipoMovimiento = element.querySelector('select[name="tipo_movimiento"]')?.value;
      const oradorId = element.querySelector('select[name="orador_id"]')?.value;
      const bosquejoId = element.querySelector('select[name="bosquejo_id"]')?.value;
      const congregacionDestinoId = element.querySelector('select[name="congregacion_destino_id"]')?.value;
      const observaciones = element.querySelector('textarea[name="observaciones"]')?.value || '';
      

      // Validar campos requeridos del arreglo
      if (!tipoMovimiento || !oradorId || !bosquejoId) {
        mostrarNotificacion(
          `Por favor complete todos los campos requeridos en el arreglo #${
            parseInt(index) + 1
          }`,
          "error"
        );
        return;
      }
      
      // Solo requerir congregación de destino si es un movimiento de salida
      if (tipoMovimiento === 'saliente' && !congregacionDestinoId) {
        mostrarNotificacion(
          `Por favor seleccione una congregación de destino para el arreglo #${
            parseInt(index) + 1
          }`,
          "error"
        );
        return;
      }

      arreglos.push({
        tipo_movimiento: tipoMovimiento,
        orador_id: oradorId,
        bosquejo_id: bosquejoId,
        congregacion_destino_id: congregacionDestinoId,
        observaciones: observaciones,
      });
    }

    if (arreglos.length === 0) {
      mostrarNotificacion("Debe agregar al menos un arreglo", "error");
      return;
    }

    // Crear objeto con los datos del programa
    const programaData = {
      fecha: new Date(fechaHora).toISOString(),
      tipo: tipoPrograma,
      organizacion_id: 1 // Asegúrate de establecer el ID de la organización correcto
    };

    // Si es una actualización, agregar el ID
    if (programaId) {
      programaData.id = programaId;
    }

    // Guardar el programa en la base de datos
    const { data: programaGuardado, error: programaError } = await supabase
      .from("programa")
      .upsert(programaData, { onConflict: "id" })
      .select()
      .single();

    if (programaError) throw programaError;

    // Obtener el ID del programa (nuevo o existente)
    const programaIdGuardado = programaGuardado.id;
    
    // Si es una actualización, eliminar los arreglos antiguos primero
    if (programaId) {
      const { error: deleteError } = await supabase
        .from("arreglo")
        .delete()
        .eq("programa_id", programaIdGuardado);

      if (deleteError) throw deleteError;
    }

    // Guardar cada arreglo en la tabla de arreglos
    for (const arreglo of arreglos) {
      const { error: arregloError } = await supabase
        .from('arreglo')
        .insert({
          programa_id: programaIdGuardado,
          tipo_movimiento: arreglo.tipo_movimiento,
          orador_id: arreglo.orador_id,
          bosquejo_id: arreglo.bosquejo_id,
          congregacion_destino_id: arreglo.congregacion_destino_id,
          descripcion: arreglo.observaciones || '',
          organizacion_id: 1 // Asegúrate de establecer el ID de la organización correcto
        });
      
      if (arregloError) throw arregloError;
    }
    
    // Obtener los arreglos recién guardados para mostrarlos
    const { error: arreglosGuardadosError } = await supabase
      .from('arreglo')
      .select('*')
      .eq('programa_id', programaIdGuardado);
      
    if (arreglosGuardadosError) {
      // Solo mostramos notificación al usuario, no es un error crítico
    }
    
    // Cerrar el modal y recargar los datos
    const modal = bootstrap.Modal.getInstance(document.getElementById('arregloModal'));
    if (modal) modal.hide();

    // Recargar los arreglos en el calendario
    await cargarArreglos();
    
    // Mostrar notificación de éxito
    mostrarNotificacion('Programa guardado correctamente', 'success');
  } catch (error) {
    mostrarNotificacion(
      `Error al guardar el programa: ${error.message}`,
      "error"
    );
    throw error;
  }
}

// Eliminar programa y sus arreglos
async function eliminarArreglo(id) {
  try {
    if (
      !confirm(
        "¿Está seguro de que desea eliminar este programa y todos sus arreglos asociados?"
      )
    ) {
      return;
    }

    // Eliminar primero los arreglos asociados al programa
    const { error: errorArreglos } = await supabase
      .from("arreglo")
      .delete()
      .eq("programa_id", id);

    if (errorArreglos) throw errorArreglos;

    // Luego eliminar el programa
    const { error: errorPrograma } = await supabase
      .from("programa")
      .delete()
      .eq("id", id);

    if (errorPrograma) throw errorPrograma;

    // Actualizar el calendario
    await cargarArreglos();

    // Cerrar el modal si está abierto
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("arregloModal")
    );
    if (modal) modal.hide();

    mostrarNotificacion(
      "Programa y sus arreglos eliminados correctamente",
      "success"
    );
  } catch (error) {
    console.error("Error al eliminar el programa:", error);
    mostrarNotificacion(
      `Error al eliminar el programa: ${error.message}`,
      "error"
    );
  }
}

// Obtener lista de oradores
async function obtenerOradores() {
  try {
    // Primero obtenemos los oradores con información de sus congregaciones
    const { data: oradores, error: oradoresError } = await supabase
      .from("oradores")
      .select(
        `
        *,
        publicadores:publicadores (
          id,
          nombre,
          congregacion:congregacion_id (
            id,
            nombre,
            circuito
          )
        )
      `
      )
      .order("id", { ascending: true });

    if (oradoresError) throw oradoresError;

    // Procesamos los datos para devolver un formato consistente
    return oradores.map((orador) => {
      const publicador = orador.publicadores;
      const congregacion = publicador?.congregacion || {};

      return {
        id: orador.id,
        nombre: publicador?.nombre || "Orador",
        nombre: publicador?.nombre || `#${orador.id}`,
        publicador_id: orador.publicador_id,
        congregacion_id: congregacion.id || null,
        congregacion_nombre: congregacion.nombre || "Sin congregación",
        congregacion_circuito: congregacion.circuito || "",
      };
    });
  } catch (error) {
    console.error("Error al obtener oradores:", error);

    // En caso de error, intentar obtener solo los datos básicos
    try {
      const { data: oradoresBasicos, error: basicoError } = await supabase
        .from("oradores")
        .select(
          `
          id, 
          publicador_id,
          publicadores:publicadores (
            id,
            nombre,
            congregacion_id
          )
        `
        )
        .order("id", { ascending: true });

      if (!basicoError && oradoresBasicos) {
        return oradoresBasicos.map((o) => ({
          id: o.id,
          nombre: o.publicadores?.nombre || "Orador",
          apellido: o.publicadores?.nombre || `#${o.id}`,
          publicador_id: o.publicador_id,
          congregacion_id: o.publicadores?.congregacion_id || null,
          congregacion_nombre: "Sin información",
          congregacion_circuito: "",
        }));
      }
    } catch (e) {
      console.error("Error al obtener oradores básicos:", e);
    }

    return [];
  }
}

// Obtener lista de congregaciones
async function obtenerCongregaciones() {
  try {
    // Obtener todas las congregaciones sin filtrar
    const { data: todasCongregaciones, error } = await supabase
      .from("congregacion")
      .select("id, nombre, circuito")
      .order("nombre", { ascending: true });

    if (error) {
      console.error("Error al obtener las congregaciones:", error);
      return [];
    }

    return todasCongregaciones || [];
  } catch (error) {
    console.error("Error inesperado al obtener congregaciones:", error);
    return [];
  }
}

// Obtener lista de bosquejos
async function obtenerBosquejos() {
  try {
    const { data, error } = await supabase
      .from("bosquejos")
      .select("id, titulo, numero")
      .order("numero", { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error al obtener bosquejos:", error);
    return [];
  }
}

// Obtener color según el estado del arreglo
function obtenerColorPorEstado(estado) {
  switch (estado) {
    case "confirmado":
      return "var(--color-success)";
    case "cancelado":
      return "var(--color-error)";
    case "completado":
      return "var(--color-info)";
    case "pendiente":
    default:
      return "var(--color-warning)";
  }
}

// Obtener color de texto según el estado del arreglo
function obtenerColorTextoPorEstado(estado) {
  return estado === "pendiente" ? "var(--color-text)" : "white";
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = "info") {
  // Usar Toast de Bootstrap o un simple alert
  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-white bg-${tipo} border-0`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${mensaje}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
    </div>
  `;

  const toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    const container = document.createElement("div");
    container.className = "toast-container position-fixed bottom-0 end-0 p-3";
    container.style.zIndex = "11";
    document.body.appendChild(container);
    container.appendChild(toast);
  } else {
    toastContainer.appendChild(toast);
  }

  const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 5000 });
  bsToast.show();

  // Eliminar el toast después de que se oculte
  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove();
  });
}

// Configurar manejadores de eventos
function configurarEventos() {
  // Manejador para el botón de nuevo arreglo
  document.addEventListener("click", (e) => {
    if (e.target.closest("#btnNuevoArreglo")) {
      e.preventDefault();
      mostrarModalArreglo();
    }
  });

  // Manejador para los botones de acción en la lista de próximos eventos
  document
    .querySelector(".event-list")
    ?.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");

      if (action === "view" && id) {
        e.preventDefault();
        const { data: arreglo, error } = await db.obtenerPorId("arreglo", id);

        if (error) {
          console.error("Error al cargar el arreglo:", error);
          mostrarNotificacion("Error al cargar el arreglo", "error");
          return;
        }

        if (arreglo) {
          mostrarModalArreglo(arreglo);
        }
      }
    });

  // Manejador para los botones de acción en la lista de próximos eventos
  document
    .querySelector(".event-list")
    ?.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");

      if (action === "view" && id) {
        e.preventDefault();
        const { data: arreglo, error } = await db.obtenerPorId("arreglo", id);

        if (error) {
          console.error("Error al cargar el arreglo:", error);
          mostrarNotificacion("Error al cargar el arreglo", "error");
          return;
        }

        if (arreglo) {
          mostrarModalArreglo(arreglo);
        }
      }
    });
}
