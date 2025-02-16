// filterDate.js
import { database } from "../../../../../../../../environment/firebaseConfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getUserEmail } from "../../../../../../../modules/accessControl/getUserEmail.js";
import { createTableBody, updateTotalMonto } from "../../../modules/tabla/createTableElements.js";
import { initializePopovers } from "../../popover/product-table/action-purchase-popover.js";
import { renderPurchaseChart, clearChart } from "../../../modules/chart.js";

export function initializeFilters(buttonConfig, tableId) {
  const tableContainer = document.getElementById(tableId);

  if (!tableContainer) {
    console.error("No se encontró la tabla para el filtro.");
    return;
  }

  buttonConfig.forEach(({ buttonId, filterFn }) => {
    const button = document.getElementById(buttonId);

    if (!button) {
      console.error(`No se encontró el botón con ID: ${buttonId}`);
      return;
    }

    button.addEventListener("click", async () => {
      try {
        const email = await getUserEmail();

        if (!email) {
          showToast("No se pudo obtener el correo del usuario.", "error");
          return;
        }
      
        const userEmailKey = email.replaceAll(".", "_");
        const dbRef = ref(database, `users/${userEmailKey}/recordData/purchaseData`);
        const snapshot = await get(dbRef);

        if (!snapshot.exists()) {
          tableContainer.innerHTML = "<tr><td colspan='6'>No hay datos disponibles.</td></tr>";
          updateTotalMonto();
          clearChart(); // Limpiar gráfico si no hay datos
          return;
        }

        const purchases = snapshot.val();
        const filteredData = Object.entries(purchases)
          .filter(([key, purchase]) => {
            const purchaseDate = new Date(purchase.fecha);
            return filterFn(purchaseDate);
          })
          .map(([key, purchase]) => ({ id: key, ...purchase }));

        filteredData.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        tableContainer.innerHTML = "";
        if (filteredData.length > 0) {
          let filaNumero = 1;
          filteredData.forEach((purchase) => {
            tableContainer.innerHTML += createTableBody(purchase, filaNumero++);
          });
          initializePopovers();
          updateTotalMonto();
          renderPurchaseChart(filteredData); // Actualizar gráfico
        } else {
          tableContainer.innerHTML = "<tr><td colspan='6'>No hay datos disponibles.</td></tr>";
          updateTotalMonto();
          clearChart(); // Limpiar gráfico
        }
      } catch (error) {
        console.error("Error al filtrar los datos:", error);
      }
    });
  });
}

export function createDateFilters() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const getStartOfLocalDay = (date) => {
    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);
    return localDate;
  };

  const getEndOfLocalDay = (date) => {
    const localDate = new Date(date);
    localDate.setHours(23, 59, 59, 999);
    return localDate;
  };

  const normalizeDate = (purchaseDate) => {
    const utcDate = new Date(purchaseDate);
    return new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
  };

  return {
    filterToday: (purchaseDate) => {
      const normalizedPurchaseDate = normalizeDate(purchaseDate);
      const startOfToday = getStartOfLocalDay(today);
      const endOfToday = getEndOfLocalDay(today);

      return (
        normalizedPurchaseDate >= startOfToday &&
        normalizedPurchaseDate <= endOfToday
      );
    },
    filterWeek: (purchaseDate) => {
      const normalizedPurchaseDate = normalizeDate(purchaseDate);
      const dayOfWeek = today.getDay();
      const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() + offset);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startOfWeekLocal = getStartOfLocalDay(startOfWeek);
      const endOfWeekLocal = getEndOfLocalDay(endOfWeek);

      return (
        normalizedPurchaseDate >= startOfWeekLocal &&
        normalizedPurchaseDate <= endOfWeekLocal
      );
    },
    filterMonth: (purchaseDate) => {
      const normalizedPurchaseDate = normalizeDate(purchaseDate);
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
      const startOfMonthLocal = getStartOfLocalDay(startOfMonth);
      const endOfMonthLocal = getEndOfLocalDay(endOfMonth);

      return (
        normalizedPurchaseDate >= startOfMonthLocal &&
        normalizedPurchaseDate <= endOfMonthLocal
      );
    },
    filterYear: (purchaseDate) => {
      const normalizedPurchaseDate = normalizeDate(purchaseDate);
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31);
      const startOfYearLocal = getStartOfLocalDay(startOfYear);
      const endOfYearLocal = getEndOfLocalDay(endOfYear);

      return (
        normalizedPurchaseDate >= startOfYearLocal &&
        normalizedPurchaseDate <= endOfYearLocal
      );
    },
  };
}
