import { supabase } from './supabase.js';

// Función para redirigir al inicio de sesión
function redirigirALogin() {
  window.location.href = '/index.html';
}

export async function cargarPublicadores() {
  try {
    console.log('Iniciando carga de publicadores...');
    
    // Verificar si hay una sesión activa
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('No hay sesión activa:', sessionError);
      redirigirALogin();
      return;
    }
    
    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error al obtener el usuario:', userError);
      redirigirALogin();
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
    if (!tbody) return;

    tbody.innerHTML = ''; // Limpiar la tabla

    if (!publicadores || publicadores.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">No hay publicadores registrados</td>
        </tr>
      `;
      return;
    }

    // Llenar la tabla con los datos
    publicadores.forEach(publicador => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${publicador.nombre || ''}</td>
        <td>${publicador.congregacion?.nombre || 'Sin asignar'}</td>
        <td>${publicador.edad || ''}</td>
        <td class="text-center">
          <span class="badge ${publicador.bautizado ? 'bg-success' : 'bg-secondary'}">
            ${publicador.bautizado ? 'Sí' : 'No'}
          </span>
        </td>
        <td>${publicador.privilegio_servicio || ''}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${publicador.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger btn-eliminar ms-2" data-id="${publicador.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Agregar event listeners a los botones
    document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        editarPublicador(id);
      });
    });

    document.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        eliminarPublicador(id);
      });
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
  document.addEventListener('DOMContentLoaded', cargarPublicadores);
  
  // Configurar el botón de agregar
  const btnAgregar = document.querySelector('#btnAgregarPublicador');
  if (btnAgregar) {
    btnAgregar.addEventListener('click', () => {
      // Aquí irá la lógica para mostrar el formulario de agregar
      console.log('Mostrar formulario para agregar publicador');
    });
  }
}

// Inicializar la página si estamos en la sección de publicadores
if (window.location.pathname.includes('publicadores.html')) {
  inicializarPaginaPublicadores();
}
