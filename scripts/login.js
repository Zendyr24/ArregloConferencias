import { db } from "./db.js";

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Mostrar notificación
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Ocultar después de 5 segundos
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// --- Selectores del DOM ---
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const protectedContent = document.getElementById("protected-content");
const logoutButton = document.getElementById("logout-button");
const userDataElement = document.getElementById("user-data");
const registerContainer = document.getElementById("register-container");
const loginContainer = document.getElementById("login-container");


// --- Lógica de Registro ---
async function handleRegister(event) {
  event.preventDefault();
  
  const registerButton = event.target.querySelector('button[type="submit"]');
  const originalButtonText = registerButton.innerHTML;
  
  try {
    // Mostrar indicador de carga
    registerButton.disabled = true;
    registerButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const orgCode = document.getElementById("register-org-code").value;
    const congId = parseInt(document.getElementById("register-cong-id").value);

    // Validar contraseña
    if (password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    // Buscar la organización usando su código único
    const { data: organizacion, error: orgError } = await db.obtenerOrganizacionPorCodigo(orgCode);

    if (orgError || !organizacion) {
      throw new Error("El código de la organización no es válido.");
    }

    const organizacion_id = organizacion.id;

    // (Opcional) Validar que la congregacion_id pertenece a la organizacion_id.
    // Esto requeriría una consulta adicional. Por ahora, confiamos en la entrada.

    // 2. Hashear la contraseña
    const hashedPassword = await window.bcrypt.hash(password, 10);

    // 3. Insertar el nuevo usuario en la base de datos
    const { data: newUser, error: insertError } = await db.insertar("users", [
      {
        email: email,
        password: hashedPassword,
        organizacion_id: organizacion_id,
        congregacion_id: congId,
      },
    ]);

    if (insertError) {
      throw new Error(insertError.message || 'Error al registrar el usuario');
    }

    // Mostrar mensaje de éxito
    showNotification('¡Registro exitoso! Por favor inicia sesión.', 'success');
    
    // Cambiar al formulario de inicio de sesión
    document.querySelector('.form-wrapper.active').classList.remove('active');
    setTimeout(() => {
      document.getElementById('register-container').style.display = 'none';
      const loginContainer = document.getElementById('login-container');
      loginContainer.style.display = 'block';
      setTimeout(() => loginContainer.classList.add('active'), 10);
      
      // Rellenar el email en el formulario de login
      document.getElementById('login-email').value = email;
      document.getElementById('register-form').reset();
    }, 500);
    
  } catch (error) {
    console.error("Error en el registro:", error);
    showNotification(error.message || 'Error al registrar el usuario. Inténtalo de nuevo.', 'error');
  } finally {
    // Restaurar el botón
    registerButton.disabled = false;
    registerButton.innerHTML = originalButtonText;
  }
}


// --- Toggle between Login and Register Forms ---
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegisterLink = document.getElementById('show-register');
  const showLoginLink = document.getElementById('show-login');
  const loginContainer = document.getElementById('login-container');
  const registerContainer = document.getElementById('register-container');

  // Show register form
  if (showRegisterLink) {
    showRegisterLink.addEventListener('click', (e) => {
      e.preventDefault();
      loginContainer.classList.remove('active');
      setTimeout(() => {
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
        setTimeout(() => registerContainer.classList.add('active'), 10);
      }, 300);
    });
  }

  // Show login form
  if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      registerContainer.classList.remove('active');
      setTimeout(() => {
        registerContainer.style.display = 'none';
        loginContainer.style.display = 'block';
        setTimeout(() => loginContainer.classList.add('active'), 10);
      }, 300);
    });
  }

  // Handle login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginAndRedirect);
  }

  // Handle register form submission
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
});

// Función para manejar el inicio de sesión
export async function handleLogin(event) {
  if (event) event.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    // 1. Buscar el usuario por email
    const { data: user, error: userError } = await db.obtenerUsuarioPorEmail(email);

    if (userError || !user) {
      showNotification("Credenciales incorrectas.", 'error');
      console.error("Error buscando usuario:", userError);
      return false;
    }

    // 2. Verificar la contraseña (asumiendo que está hasheada con bcrypt)
    const isPasswordValid = await window.bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      alert("Credenciales incorrectas.");
      return false;
    }

    // 3. Almacenar información del usuario en localStorage
    const userData = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      organizacion_id: user.organizacion_id,
      timestamp: new Date().getTime()
    };
    
    localStorage.setItem("user", JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error("Error en el inicio de sesión:", error);
    alert("Ocurrió un error al iniciar sesión. Por favor, inténtalo de nuevo.");
    return false;
  }
}

// Función para manejar la autenticación y redirección
async function handleLoginAndRedirect(event) {
  const success = await handleLogin(event);
  if (success) {
    // Obtener la URL de redirección de los parámetros de la URL o usar la página por defecto
    const urlParams = new URLSearchParams(window.location.search);
    const redirectTo = urlParams.get('redirect') || '../index.html';
    window.location.href = redirectTo;
  }
}

// Manejar el formulario de login en la página principal
const mainLoginForm = document.querySelector("form#login-form");
if (mainLoginForm) {
  mainLoginForm.addEventListener("submit", handleLoginAndRedirect);
}

// --- Lógica de Cierre de Sesión ---
if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  });
}

// --- Funciones para manejar la UI ---
function showProtectedContent() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    registerContainer.style.display = "none";
    loginContainer.style.display = "none";
    protectedContent.style.display = "block";
    // Mostrar los datos de la sesión del usuario
    userDataElement.textContent = JSON.stringify(user, null, 2);
  }
}

function showLogin() {
  registerContainer.style.display = "block";
  loginContainer.style.display = "block";
  protectedContent.style.display = "none";
  userDataElement.textContent = "";
}

// Comprobar si ya existe una sesión al cargar la página
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("user")) {
    showProtectedContent();
  }
});
