// search-purchase.js
import { database } from "../../../../../../../environment/firebaseConfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getUserEmail } from "../../../../../../modules/accessControl/getUserEmail.js";
import { showToast } from "../../../../../../components/toast/toastLoader.js";
import { createTableBody, updateTotalMonto } from "./createPurchaseTableElements.js";
import { initializePopovers } from "../../components/popover/purchase-popover.js";
import { normalizeText } from "../../../../../../utils/normalize-text-utils.js";
import { saveSearch, displayRecentSearches } from "../../components/nav-header/search/search-purchase-history.js";
import { renderPurchaseChart } from "../chart.js";

export let currentSearchQuery = ""; // Variable para mantener la consulta actual
export let currentFilteredResults = []; // Variable para mantener los resultados filtrados

// Función para inicializar la funcionalidad de búsqueda
export function initializeSearchPurchase() {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const recentSearchesContainer = document.getElementById("recentSearches");

  if (!searchInput || !searchButton || !recentSearchesContainer) {
    console.error("No se encontró el componente de búsqueda o el contenedor de búsquedas recientes.");
    return;
  }

  // Actualizar currentSearchQuery en tiempo real con cada cambio en el input
  searchInput.addEventListener("input", () => {
    currentSearchQuery = searchInput.value.trim();
  });

  const handleSearch = async () => {
    currentSearchQuery = searchInput.value.trim(); // Sincronizar con el input actual

    if (!currentSearchQuery) {
      showToast("Por favor, ingresa un término para buscar.", "warning");
      return;
    }

    try {
      const email = await getUserEmail(); // Obtén el correo electrónico del usuario
      if (!email) {
        showToast("No se pudo obtener el correo del usuario.", "error");
        return;
      }

      const userEmailKey = email.replaceAll(".", "_");
      // Guardar la búsqueda en el historial
      await saveSearch(userEmailKey, currentSearchQuery, database);

      const dbRef = ref(database, `users/${userEmailKey}/recordData/purchaseData`);
      const snapshot = await get(dbRef);

      if (!snapshot.exists()) {
        showToast("No se encontraron registros de facturas en la base de datos.", "info");
        return;
      }

      const purchases = snapshot.val();
      const results = Object.entries(purchases).filter(([key, purchase]) => {
        const factura = purchase.factura || {};
        return (
          (purchase.fecha && normalizeText(purchase.fecha).includes(normalizeText(currentSearchQuery))) ||
          (factura.empresa && normalizeText(factura.empresa).includes(normalizeText(currentSearchQuery))) ||
          (factura.monto && normalizeText(factura.monto.toString()).includes(normalizeText(currentSearchQuery))) ||
          (factura.estado && normalizeText(factura.estado).includes(normalizeText(currentSearchQuery)))
        );
      });

      if (results.length === 0) {
        showToast("No se encontraron resultados para tu búsqueda.", "info");
      } else {
        currentFilteredResults = results; // Guardar resultados filtrados
        displaySearchResults(results);
      }
    } catch (error) {
      console.error("Error al buscar registros de facturas:", error);
      showToast("Hubo un error al buscar registros de facturas.", "error");
    }
  };

  searchButton.addEventListener("click", handleSearch);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") handleSearch();
  });

  // Mostrar búsquedas recientes al enfocar el input
  searchInput.addEventListener("focus", async () => {
    const email = await getUserEmail();
    if (email) {
      recentSearchesContainer.classList.remove("hidden");
      await displayRecentSearches(email.replaceAll(".", "_"), database);
    }
  });

  // Ocultar lista de búsquedas al hacer clic fuera
  document.addEventListener("click", (e) => {
    const isInput = e.target === searchInput;
    const isSearchItem = e.target.closest(".recent-search-item");
    const isContainer = recentSearchesContainer.contains(e.target);
    if (!isInput && !isContainer && !isSearchItem) {
      recentSearchesContainer.classList.add("hidden");
    }
  });

  // Escuchar evento para refrescar la tabla con el término actual
  window.addEventListener("refreshTable", () => {
    if (currentSearchQuery) {
      searchInput.value = currentSearchQuery; // Forzar sincronización visual
      handleSearch(); // Re-ejecutar búsqueda
    }
  });

  // Manejar nueva factura registrada
  window.addEventListener("newPurchaseRegistered", (e) => {
    const newPurchase = e.detail;
    // Agregar la nueva factura al inicio de los resultados filtrados
    currentFilteredResults.unshift([newPurchase.id, newPurchase]);
    displaySearchResults(currentFilteredResults);
  });
}

function displaySearchResults(results) {
  const resultsContainer = document.getElementById("contenidoTabla");
  if (!resultsContainer) {
    console.error("No se encontró el contenedor para mostrar los resultados.");
    return;
  }

  resultsContainer.innerHTML = ""; // Limpiar resultados anteriores
  let filaNumero = 1;

  results.forEach(([key, purchase], index) => {
    const tableBodyHTML = createTableBody({ id: key, ...purchase }, filaNumero++, index === 0);
    resultsContainer.innerHTML += tableBodyHTML;
  });

  initializePopovers();
  updateTotalMonto(); // Calcular y mostrar el total de los montos después de renderizar

  // Actualizar el texto de #selected-date-display con el término de búsqueda
  const selectedDateDisplay = document.getElementById("selected-date-display");
  const selectedDateSpan = document.getElementById("selected-date");
  if (selectedDateDisplay && selectedDateSpan) {
    selectedDateDisplay.childNodes[0].textContent = "Datos de: ";
    selectedDateSpan.textContent = currentSearchQuery; // Usar la consulta actual
  }

  // Renderizar la gráfica con los datos filtrados por la búsqueda
  const chartContainer = document.getElementById("chartContainer");
  if (chartContainer) {
    chartContainer.classList.remove("no-data"); // Remover clase cuando hay datos
    // Pasar isSearchFilter = true para mostrar una barra por cada compra
    renderPurchaseChart(results.map(([key, purchase]) => ({ id: key, ...purchase })), 'company', new Date(), true);
  }
}

// Función global para re-aplicar la búsqueda
window.reapplySearch = () => {
  if (currentSearchQuery) {
    document.getElementById("searchInput").value = currentSearchQuery;
    document.getElementById("searchButton").click();
  }
};