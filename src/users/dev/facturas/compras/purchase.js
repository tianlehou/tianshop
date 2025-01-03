import {
  get,
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database, auth } from "../../../../../environment/firebaseConfig.js";
import { checkAuth } from "./modules/accessControl/authCheck.js";
import { getUserEmail } from "../../../../modules/accessControl/getUserEmail.js";

// Importaciones adicionales
import { setupInstallPrompt } from "../../../../modules/installPrompt.js";
import { initializePopovers } from "./components/popover/popover.js";
import { initializePagination } from "./components/pagination/pagination.js";
import { initializeSearchPurchase } from "./modules/tabla/search-purchase.js";
import { renderTableHeaders, createTableBody } from "./modules/tabla/createTableElements.js";
import { initializeDuplicatePurchaseRow } from "./modules/tabla/duplicatePurchaseRow.js";
import { initializeDeleteHandlers } from "./modules/tabla/deleteHandlersRow.js";

// Constantes
const tablaContenido = document.getElementById("contenidoTabla");
const tableHeadersElement = document.getElementById("table-headers");

// Función principal para mostrar datos
export function mostrarDatos(callback) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error("El usuario no ha iniciado sesión.");
    return;
  }

  const userId = currentUser.uid;
  const userPurchaseRef = ref(database, `users/${userId}/recordData/purchaseData`);

  const updateTable = async () => {
    try {
      tablaContenido.innerHTML = ""; // Limpia la tabla antes de renderizar
      const userPurchaseSnapshot = await get(userPurchaseRef);

      const data = [];

      // Procesar datos del usuario
      if (userPurchaseSnapshot.exists()) {
        userPurchaseSnapshot.forEach((childSnapshot) => {
          data.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
      }

      data.sort((a, b) => {
        const empresaDiff = a.producto.empresa.localeCompare(b.producto.empresa);
        if (empresaDiff !== 0) return empresaDiff;

        const marcaDiff = a.producto.marca.localeCompare(b.producto.marca);
        if (marcaDiff !== 0) return marcaDiff;

        const descripcionDiff = a.producto.descripcion.localeCompare(b.producto.descripcion);
        if (descripcionDiff !== 0) return descripcionDiff;

        return a.precio.venta.localeCompare(b.precio.venta);
      });

      let filaNumero = 1;
      for (const purchaseData of data) {
        tablaContenido.innerHTML += createTableBody(purchaseData, filaNumero++);
      }

      initializePopovers();
      if (callback) callback();
    } catch (error) {
      console.error("Error al mostrar los datos:", error);
    }
  };

  onValue(ref(database, `users/${userId}`), updateTable);
}

// Inicializar sesión del usuario
function initializeUserSession(user) {
  renderTableHeaders(tableHeadersElement); // Renderizar cabeceras al inicio
  const { updatePagination } = initializePagination("contenidoTabla", 10);

  mostrarDatos(() => {
    updatePagination(); // Actualiza la paginación después de mostrar los datos
  });

  initializeSearchPurchase();
  initializeDuplicatePurchaseRow();
  setupInstallPrompt("installButton");
  initializeDeleteHandlers();

  getUserEmail()
    .then((email) => {
      console.log(`Correo del usuario: ${email}`);
    })
    .catch((error) => {
      console.error("Error al obtener el correo del usuario:", error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  auth.onAuthStateChanged((user) => {
    if (user) {
      initializeUserSession(user);
    } else {
      console.error("Usuario no autenticado.");
    }
  });
});
