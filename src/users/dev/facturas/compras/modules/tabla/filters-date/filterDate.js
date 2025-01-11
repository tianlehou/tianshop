import { auth, database } from "../../../../../../../../environment/firebaseConfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { createTableBody } from "../createTableElements.js";
import { initializePopovers } from "../../../components/popover/product-table/action-purchase-popover.js";

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
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.error("El usuario no está autenticado.");
          return;
        }

        const userId = currentUser.uid;
        const dbRef = ref(database, `users/${userId}/recordData/purchaseData`);
        const snapshot = await get(dbRef);

        if (!snapshot.exists()) {
          console.info("No hay datos para mostrar.");
          tableContainer.innerHTML = "<tr><td colspan='6'>No hay datos disponibles.</td></tr>";
          return;
        }

        const purchases = snapshot.val();
        const filteredData = Object.entries(purchases).filter(([key, purchase]) => {
          const purchaseDate = new Date(purchase.fecha);
          return filterFn(purchaseDate);
        });

        tableContainer.innerHTML = ""; // Limpia la tabla
        if (filteredData.length > 0) {
          let filaNumero = 1;
          filteredData.forEach(([key, purchase]) => {
            tableContainer.innerHTML += createTableBody({ id: key, ...purchase }, filaNumero++);
          });
          initializePopovers();
        } else {
          tableContainer.innerHTML = "<tr><td colspan='6'>No hay datos disponibles.</td></tr>";
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
  const currentDay = today.getDay();

  return {
    filterToday: (purchaseDate) => {
      const todayDate = today.toISOString().split("T")[0];
      return purchaseDate.toISOString().split("T")[0] === todayDate;
    },
    filterWeek: (purchaseDate) => {
      const dayOfWeek = today.getDay(); // 0 (domingo) a 6 (sábado)
      const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Ajusta para que lunes sea el inicio
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() + offset); // Lunes
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Domingo
    
      return purchaseDate >= startOfWeek && purchaseDate <= endOfWeek;
    },
    
    filterMonth: (purchaseDate) => {
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0); // Último día del mes
      return purchaseDate >= startOfMonth && purchaseDate <= endOfMonth;
    },
    filterYear: (purchaseDate) => {
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31); // Último día del año
      return purchaseDate >= startOfYear && purchaseDate <= endOfYear;
    },
  };
}
