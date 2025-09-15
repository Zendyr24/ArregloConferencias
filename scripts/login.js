import { db } from "./db.js";

// --- Selectores del DOM ---
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const protectedContent = document.getElementById("protected-content");
const logoutButton = document.getElementById("logout-button");
const userDataElement = document.getElementById("user-data");
const registerContainer = document.getElementById("register-container");
const loginContainer = document.getElementById("login-container");

// --- Lógica de Registro ---
registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const orgCode = document.getElementById("register-org-code").value;
  const congId = parseInt(document.getElementById("register-cong-id").value);

  // 1. Buscar la organización usando su código único
  const { data: organizacion, error: orgError } = await db.obtenerOrganizacionPorCodigo(orgCode);

  if (orgError || !organizacion) {
    alert("El código de la organización no es válido.");
    console.error("Error buscando organización:", orgError);
    return;
  }

  const organizacion_id = organizacion.id;

  // (Opcional) Validar que la congregacion_id pertenece a la organizacion_id.
  // Esto requeriría una consulta adicional. Por ahora, confiamos en la entrada.

  // 2. Hashear la contraseña
  let hashedPassword;
  try {
    // Usar los métodos síncronos de bcrypt
    const salt = window.bcrypt.genSaltSync(10);
    hashedPassword = window.bcrypt.hashSync(password, salt);
  } catch (error) {
    console.error('Error hashing password:', error);
    alert('Error al procesar la contraseña. Por favor, inténtalo de nuevo.');
    return;
  }

  // 3. Insertar el nuevo usuario con las claves foráneas
  const { data: newUser, error: insertError } = await db.insertar("users", [
      {
        email: email,
        password: hashedPassword,
        organizacion_id: organizacion_id,
        congregacion_id: congId,
      },
    ]);

  if (insertError) {
    console.error("Error en el registro:", insertError);
    alert("Error al registrar el usuario. Es posible que el correo ya exista.");
  } else {
    console.log("Usuario registrado:", newUser);
    alert("¡Registro exitoso! Ahora puedes iniciar sesión.");
    registerForm.reset();
  }
});

// --- Lógica de Inicio de Sesión ---
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  // Buscar al usuario por email
  const { data: user, error } = await db.obtenerUsuarioPorEmail(email);

  if (error || !user) {
    alert("Credenciales incorrectas.");
    return;
  }

  // Comparar la contraseña ingresada con el hash almacenado
  let passwordMatch = false;
  try {
    passwordMatch = window.bcrypt.compareSync(password, user.password);
  } catch (error) {
    console.error('Error al comparar contraseñas:', error);
    alert('Error al verificar la contraseña. Por favor, inténtalo de nuevo.');
    return;
  }

  if (passwordMatch) {
    // Almacenar los datos relevantes del usuario en localStorage
    const sessionData = {
      id: user.id,
      email: user.email,
      organizacion_id: user.organizacion_id,
      congregacion_id: user.congregacion_id,
    };
    localStorage.setItem("user", JSON.stringify(sessionData));
    showProtectedContent();
  } else {
    alert("Credenciales incorrectas.");
  }
});

// --- Lógica de Cierre de Sesión ---
logoutButton.addEventListener("click", () => {
  localStorage.removeItem("user");
  showLogin();
});

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
