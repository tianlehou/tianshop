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

import { initializePopovers } from "./components/popover/product-table/action-purchase-popover.js";
import { initializeDeleteHandlers } from "./modules/tabla/deleteHandlersRow.js";
import { initializeSearchPurchase } from "./modules/tabla/search-purchase.js";
import { initializeFilters, createDateFilters } from "./components/buttons/date-buttons/filter-date.js";
import {
  renderTableHeaders,
  createTableBody,
  updateTotalMonto,
} from "./modules/tabla/createTableElements.js";
import { renderPurchaseChart, clearChart } from "./modules/chart.js";

const tablaContenido = document.getElementById("contenidoTabla");
const tableHeadersElement = document.getElementById("table-headers");

export async function mostrarDatos(callback, customFilter = null) {
  const email = await getUserEmail();
  if (!email) {
    showToast("No se pudo obtener el correo del usuario.", "error");
    return;
  }

  // Guardar en la base de datos personal del usuario
  const userEmailKey = email.replaceAll(".", "_");
  const userPurchaseRef = ref(database, `users/${userEmailKey}/recordData/purchaseData`);
  const { filterToday } = createDateFilters(); // Usar el filtro del día actual

  const updateTable = async () => {
    try {
      tablaContenido.innerHTML = "";
      const userPurchaseSnapshot = await get(userPurchaseRef);

      const data = [];
      if (userPurchaseSnapshot.exists()) {
        userPurchaseSnapshot.forEach((childSnapshot) => {
          const purchaseData = { id: childSnapshot.key, ...childSnapshot.val() };
          const purchaseDate = new Date(purchaseData.fecha); // Convertir la fecha a objeto Date

          // Usar el filtro personalizado si existe, de lo contrario usar filterToday
          if (customFilter ? customFilter(purchaseDate) : filterToday(purchaseDate)) {
            data.push(purchaseData);
          }
        });

        // Ordenar por fecha y empresa
        data.sort((a, b) => {
          const dateA = new Date(a.fecha);
          const dateB = new Date(b.fecha);

          // Ordenar por fecha ascendente
          const dateComparison = dateA - dateB;
          if (dateComparison !== 0) return dateComparison;

          // Si las fechas son iguales, ordenar por empresa
          const empresaA = a.factura?.empresa?.toLowerCase() || "---";
          const empresaB = b.factura?.empresa?.toLowerCase() || "---";
          return empresaA.localeCompare(empresaB);
        });
      }

      if (data.length === 0) {
        tablaContenido.innerHTML = "<tr><td colspan='6'>No hay registros para este filtro.</td></tr>";
      } else {
        let filaNumero = 1;
        for (const purchaseData of data) {
          tablaContenido.innerHTML += createTableBody(purchaseData, filaNumero++);
        }
      }

      if (data.length > 0) {
        renderPurchaseChart(data);
      } else {
        // Limpiar gráfico si no hay datos
        clearChart();
      }
      initializePopovers();
      updateTotalMonto();
      if (callback) callback();
    } catch (error) {
      console.error("Error al mostrar los datos:", error);
    }
  };

  onValue(ref(database, `users/${userEmailKey}`), updateTable);
}

function initializeUserSession(user) {
  renderTableHeaders(tableHeadersElement);
  setupInstallPrompt("installButton");
  initializeDeleteHandlers();
  mostrarDatos();

  const searchRetryLimit = 10; // Límite de intentos
  let retryCount = 0; // Contador de intentos

  const checkElements = setInterval(() => {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const todayButton = document.getElementById("todayButton");
    const weekButton = document.getElementById("weekButton");
    const monthButton = document.getElementById("monthButton");
    const yearButton = document.getElementById("yearButton");

    // Verifica si todos los elementos están presentes
    if (searchInput && searchButton && todayButton && weekButton && monthButton && yearButton) {
      clearInterval(checkElements); // Detiene el intervalo

      // Inicializa la funcionalidad de búsqueda
      initializeSearchPurchase();

      // Inicializa los filtros
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
    } else if (++retryCount >= searchRetryLimit) {
      clearInterval(checkElements); // Detiene el intervalo
      window.location.reload(); // Recarga la página si se supera el límite de intentos
    }
  }, 500); // Intervalo de verificación de 500ms

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