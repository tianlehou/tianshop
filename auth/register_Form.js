// Importa las funciones necesarias de Firebase
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { auth, database } from "../environment/firebaseConfig.js";

export function initRegisterForm() {
  const registerForm = document.getElementById('registerForm');
  if (!registerForm) {
    console.error("El formulario de registro no se encontró. El script no se ejecutará.");
    return;
  }

  // Resetea el formulario cuando se abre el modal
  const registerModalEl = document.getElementById("registerModal");
  registerModalEl.addEventListener("shown.bs.modal", () => {
    registerForm.reset(); // Limpia todos los campos
    document.querySelectorAll(".error-message").forEach((el) => (el.textContent = ""));
  });

  // Escucha el evento 'submit' del formulario
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Evita el comportamiento predeterminado

    // Obtén los valores de los campos del formulario
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();

    try {
      // Crea el usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Prepara los datos del usuario para la base de datos
      const newUserData = {
        name: name,
        email: email
      };

      // Guarda los datos del usuario en Firebase Realtime Database bajo user.uid
      const userRef = ref(database, `users/${user.uid}`);
      await set(userRef, newUserData);

      // Muestra un mensaje de éxito
      alert("¡Registro exitoso!");

      // Limpia el formulario
      registerForm.reset();

      // Oculta el modal
      const registerModal = bootstrap.Modal.getInstance(registerModalEl);
      registerModal.hide();

      // Recarga la página (opcional)
      setTimeout(() => {
        location.reload();
      }, 100);
    } catch (error) {
      // Maneja errores específicos de Firebase
      const errorMessages = {
        "auth/email-already-in-use": "¡Este correo ya está en uso! Intenta iniciar sesión o usar otro correo.",
        "auth/invalid-email": "Correo inválido. Verifica que esté bien escrito.",
        "auth/weak-password": "Contraseña débil. Usa al menos 8 caracteres con letras y números.",
      };
      const message = errorMessages[error.code] || "¡Ocurrió un error inesperado!";
      alert(message);
      console.error("Error al registrar al usuario:", error);
    }
  });
}
