// authCheck.js
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { auth } from '../../../environment/firebaseConfig.js';

// Tiempo de inactividad en milisegundos (5 minutos)
const INACTIVITY_TIME_LIMIT = 60 * 60 * 1000;
let inactivityTimer;

// Función para restablecer el temporizador de inactividad
function resetInactivityTimer() {
  // Limpiamos el temporizador actual
  clearTimeout(inactivityTimer);

  // Reiniciamos el temporizador
  inactivityTimer = setTimeout(() => {
    // Cerrar sesión después de 5 minutos de inactividad
    signOut(auth).then(() => {
      // Redirigir al login después de cerrar sesión
      window.location.href = '../../../../login.html';
    }).catch((error) => {
      console.error("Error al cerrar sesión:", error);
    });
  }, INACTIVITY_TIME_LIMIT);
}

// Escuchar eventos de actividad del usuario
function setupActivityListeners() {
  window.addEventListener('mousemove', resetInactivityTimer);
  window.addEventListener('keydown', resetInactivityTimer);
  window.addEventListener('touchstart', resetInactivityTimer);
  window.addEventListener('click', resetInactivityTimer);
}

// Función para verificar si el usuario está autenticado
export function checkAuth() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Si no hay un usuario autenticado, redirige al login
      window.location.href = '../../../../login.html';
    } else {
      // Configurar los eventos de actividad solo si el usuario está autenticado
      setupActivityListeners();
      // Iniciar el temporizador de inactividad
      resetInactivityTimer();
    }
  });
}