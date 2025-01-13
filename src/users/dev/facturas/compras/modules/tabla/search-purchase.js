// search-purchase.js
import { auth, database } from "../../../../../../../environment/firebaseConfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { showToast } from "../../components/toast/toastLoader.js";
import { createTableBody } from "./createTableElements.js";
import { initializePopovers } from "../../components/popover/product-table/action-purchase-popover.js";

export function initializeSearchPurchase() {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");

  if (!searchInput || !searchButton) {
    console.error("No se encontró el componente de búsqueda.");
    return;
  }

  searchButton.addEventListener("click", () => handleSearch());
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") handleSearch();
  });

  async function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();

    if (!query) {
      showToast("Por favor, ingresa un término para buscar.", "warning");
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showToast("Debes iniciar sesión para buscar registros de facturas.", "error");
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
        const factura = purchase.factura || {};
        return (
          (purchase.fecha && purchase.fecha.toLowerCase().includes(query)) ||
          (factura.empresa && factura.empresa.toLowerCase().includes(query)) ||
          (factura.monto && factura.monto.toString().toLowerCase().includes(query)) ||
          (factura.estado && factura.estado.toLowerCase().includes(query))
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
  }

  function displaySearchResults(results) {
    const resultsContainer = document.getElementById("contenidoTabla");
    if (!resultsContainer) {
      console.error("No se encontró el contenedor para mostrar los resultados.");
      return;
    }

    resultsContainer.innerHTML = ""; // Limpiar resultados anteriores
    let filaNumero = 1;

    results.forEach(([key, purchase]) => {
      const tableBodyHTML = createTableBody({ id: key, ...purchase }, filaNumero++);
      resultsContainer.innerHTML += tableBodyHTML;
    });

    initializePopovers();
  }
}
