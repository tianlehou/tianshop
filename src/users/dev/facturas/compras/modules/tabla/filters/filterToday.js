import { auth, database } from "../../../../../../../../environment/firebaseConfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { createTableBody } from "../createTableElements.js";
import { initializePopovers } from "../../../components/popover/product-table/action-purchase-popover.js";

export function initializeFilterToday(buttonId, tableId) {
  const filterButton = document.getElementById(buttonId);
  const tableContainer = document.getElementById(tableId);

  if (!filterButton || !tableContainer) {
    console.error("No se encontró el botón o la tabla para el filtro de hoy.");
    return;
  }

  filterButton.addEventListener("click", async () => {
    const today = new Date().toISOString().split("T")[0]; // Fecha actual en formato YYYY-MM-DD

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
        tableContainer.innerHTML = "<tr><td colspan='6'>No hay datos disponibles para hoy.</td></tr>";
        return;
      }

      const purchases = snapshot.val();
      const filteredData = Object.entries(purchases).filter(([key, purchase]) => {
        // Asegúrate de que el campo `fecha` esté en el mismo formato (YYYY-MM-DD)
        return purchase.fecha && purchase.fecha.startsWith(today);
      });

      tableContainer.innerHTML = ""; // Limpia la tabla
      if (filteredData.length > 0) {
        let filaNumero = 1;
        filteredData.forEach(([key, purchase]) => {
          tableContainer.innerHTML += createTableBody({ id: key, ...purchase }, filaNumero++);
        });
        initializePopovers();
      } else {
        tableContainer.innerHTML = "<tr><td colspan='6'>No hay datos disponibles para hoy.</td></tr>";
      }
    } catch (error) {
      console.error("Error al filtrar los datos por la fecha de hoy:", error);
    }
  });
}
