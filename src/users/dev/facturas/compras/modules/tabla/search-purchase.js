// search-purchase.js
import { auth, database } from "../../../../../../../environment/firebaseConfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { showToast } from "../../components/toast/toastLoader.js";
import { createTableBody } from "./createTableElements.js";
import { initializePopovers } from "../../components/popover/product-table/action-purchase-popover.js";

export function initializeSearchPurchase() {
  // Esperar a que el DOM esté completamente cargado
  document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");

    if (!searchInput || !searchButton) {
      console.error("No se encontró el componente de búsqueda en el DOM.");
      return;
    }

    searchButton.addEventListener("click", async () => {
      const query = searchInput.value.trim();

      if (!query) {
        showToast("Por favor, ingresa un término para buscar.", "warning");
        return;
      }

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          showToast("Debes iniciar sesión para buscar registro de facturas.", "error");
          return;
        }

        const userId = currentUser.uid;
        const dbRef = ref(database, `users/${userId}/recordData/purchaseData`);
        const snapshot = await get(dbRef);

        if (!snapshot.exists()) {
          showToast("No se encontraron registros de facturas en la base de datos.", "info");
          return;
        }

        const purchases = snapshot.val();
        const results = Object.entries(purchases).filter(([key, purchase]) => {
          return (
            purchase.factura.empresa.toLowerCase().includes(query.toLowerCase()) ||
            purchase.factura.metodo.toLowerCase().includes(query.toLowerCase()) ||
            purchase.factura.monto.toLowerCase().includes(query.toLowerCase()) ||
            (purchase.fecha && purchase.fecha.includes(query)) // Buscar por fecha
          );
        });

        if (results.length === 0) {
          showToast("No se encontraron resultados para tu búsqueda.", "info");
        } else {
          displaySearchResults(results);
        }
      } catch (error) {
        console.error("Error al buscar registros de facturas:", error);
        showToast("Hubo un error al buscar registros de facturas.", "error");
      }
    });
  });
}

function displaySearchResults(results) {
  const resultsContainer = document.getElementById("contenidoTabla"); // Usar la tabla principal
  if (!resultsContainer) {
    console.error("No se encontró el contenedor para mostrar los resultados.");
    return;
  }

  resultsContainer.innerHTML = ""; // Limpiar resultados anteriores
  let filaNumero = 1;

  results.forEach(([key, purchase]) => {
    // Usar createTableRow para mantener la consistencia
    const tableBodyHTML = createTableBody({ id: key, ...purchase }, filaNumero++);
    resultsContainer.innerHTML += tableBodyHTML;
  });

  // Inicializar popovers después de renderizar la tabla
  initializePopovers();
}
