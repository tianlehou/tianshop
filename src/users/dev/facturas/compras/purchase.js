// purchase.js
import {
  get,
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database, auth } from "../../../../../environment/firebaseConfig.js";
import { checkAuth } from "./modules/accessControl/authCheck.js";
import { getUserEmail } from "../../../../modules/accessControl/getUserEmail.js";
import { setupInstallPrompt } from "../../../../modules/installPrompt.js";

// Importaciones adicionales
import { initializePopovers } from "./components/popover/product-table/action-purchase-popover.js";
import { initializePagination } from "./components/pagination/pagination.js";
import { initializeSearchPurchase } from "./modules/tabla/search-purchase.js";
import {
  renderTableHeaders,
  createTableBody,
  updateTotalMonto,
} from "./modules/tabla/createTableElements.js";
import { initializeDeleteHandlers } from "./modules/tabla/deleteHandlersRow.js";
import { initializeFilterToday } from "./modules/tabla/filters/filterToday.js";

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

      let filaNumero = 1;
      for (const purchaseData of data) {
        tablaContenido.innerHTML += createTableBody(purchaseData, filaNumero++);
      }

      // Inicializa popovers y actualiza el total de "Monto"
      initializePopovers();
      updateTotalMonto(); // Actualiza el total después de renderizar la tabla

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
      initializeFilterToday("todayButton", "contenidoTabla");
    } else {
      console.error("Usuario no autenticado.");
    }
  });
});
