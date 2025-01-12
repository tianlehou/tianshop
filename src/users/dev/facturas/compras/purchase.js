import {
  get,
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database, auth } from "../../../../../environment/firebaseConfig.js";
import { checkAuth } from "./modules/accessControl/authCheck.js";
import { getUserEmail } from "../../../../modules/accessControl/getUserEmail.js";
import { setupInstallPrompt } from "../../../../modules/installPrompt.js";

import { initializePopovers } from "./components/popover/product-table/action-purchase-popover.js";
import { initializePagination } from "./components/pagination/pagination.js";
import { initializeSearchPurchase } from "./modules/tabla/search-purchase.js";
import {
  renderTableHeaders,
  createTableBody,
  updateTotalMonto,
} from "./modules/tabla/createTableElements.js";
import { initializeDeleteHandlers } from "./modules/tabla/deleteHandlersRow.js";
import { initializeFilters, createDateFilters } from "./modules/tabla/filters-date/filterDate.js";

const tablaContenido = document.getElementById("contenidoTabla");
const tableHeadersElement = document.getElementById("table-headers");

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
      tablaContenido.innerHTML = "";
      const userPurchaseSnapshot = await get(userPurchaseRef);

      const data = [];
      if (userPurchaseSnapshot.exists()) {
        userPurchaseSnapshot.forEach((childSnapshot) => {
          data.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
      }

      let filaNumero = 1;
      for (const purchaseData of data) {
        tablaContenido.innerHTML += createTableBody(purchaseData, filaNumero++);
      }

      initializePopovers();
      updateTotalMonto();

      if (callback) callback();
    } catch (error) {
      console.error("Error al mostrar los datos:", error);
    }
  };

  onValue(ref(database, `users/${userId}`), updateTable);
}

function initializeUserSession(user) {
  renderTableHeaders(tableHeadersElement);
  const { updatePagination } = initializePagination("contenidoTabla", 10);

  mostrarDatos(() => {
    updatePagination();
  });

  initializeSearchPurchase();
  setupInstallPrompt("installButton");
  initializeDeleteHandlers();

  const { filterToday, filterWeek, filterMonth, filterYear } = createDateFilters();
  initializeFilters(
    [
      { buttonId: "todayButton", filterFn: filterToday },
      { buttonId: "weekButton", filterFn: filterWeek },
      { buttonId: "monthButton", filterFn: filterMonth },
      { buttonId: "yearButton", filterFn: filterYear },
    ],
    "contenidoTabla"
  );

  getUserEmail()
    .then((email) => console.log(`Correo del usuario: ${email}`))
    .catch((error) => console.error("Error al obtener el correo del usuario:", error));
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
