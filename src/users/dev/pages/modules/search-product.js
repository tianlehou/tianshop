// search-product.js
import { auth, database } from "../../../../../environment/firebaseConfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { saveSearch, displayRecentSearches } from "../components/nav-header/search/searchHistory.js";
import { showToast } from "../components/toast/toastLoader.js";
import { renderTableBody } from "./tabla/createTableElements.js";
import { initializePopovers } from "../components/popover/popover.js";

let currentSearchQuery = "";
let currentFilteredResults = [];

export function initializeSearchProduct() {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const recentSearchesContainer = document.getElementById("recentSearches");

  if (!searchInput || !searchButton || !recentSearchesContainer) return;

  // Actualizar currentSearchQuery en tiempo real con cada cambio en el input
  searchInput.addEventListener("input", () => {
    currentSearchQuery = searchInput.value.trim();
  });

  const handleSearch = async () => {
    currentSearchQuery = searchInput.value.trim(); // Sincronizar con el input actual

    if (!currentSearchQuery) {
      showToast("Ingresa un término de búsqueda", "warning");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        showToast("Debes iniciar sesión", "error");
        return;
      }

      const userEmailKey = user.email.replaceAll(".", "_");
      await saveSearch(userEmailKey, currentSearchQuery, database);

      const [userProductsSnapshot, sharedSnapshot] = await Promise.all([
        get(ref(database, `users/${userEmailKey}/productData`)),
        get(ref(database, `users/${userEmailKey}/shared/data`))
      ]);

      currentFilteredResults = processSearchResults(
        userProductsSnapshot,
        sharedSnapshot,
        currentSearchQuery
      );

      if (currentFilteredResults.length === 0) {
        showToast("No se encontraron resultados", "info");
      } else {
        displaySearchResults(currentFilteredResults);
      }
    } catch (error) {
      console.error("Error en búsqueda:", error);
      showToast("Error al buscar productos", "error");
    }
  };

  searchButton.addEventListener("click", handleSearch);
  searchInput.addEventListener("keydown", (e) => e.key === "Enter" && handleSearch());

  // Mostrar búsquedas recientes al enfocar el input
  searchInput.addEventListener("focus", async () => {
    if (auth.currentUser) {
      recentSearchesContainer.classList.remove("hidden");
      await displayRecentSearches(auth.currentUser.email.replaceAll(".", "_"), database);
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
}

function processSearchResults(userProductsSnapshot, sharedSnapshot, query) {
  const results = [];
  const lowerQuery = query.toLowerCase();

  if (userProductsSnapshot.exists()) {
    Object.entries(userProductsSnapshot.val()).forEach(([key, product]) => {
      if (matchesQuery(product, lowerQuery)) {
        results.push({ id: key, ...product });
      }
    });
  }

  if (sharedSnapshot.exists()) {
    Object.entries(sharedSnapshot.val()).forEach(([sharedBy, sharedContent]) => {
      const { productData, metadata } = sharedContent;
      if (!productData || !metadata) return;

      Object.entries(productData).forEach(([key, value]) => {
        const combinedData = {
          id: key,
          ...value,
          sharedByEmail: metadata.sharedByEmail,
          sharedAt: metadata.sharedAt,
          sharedBy
        };

        if (matchesQuery(combinedData, lowerQuery)) {
          results.push(combinedData);
        }
      });
    });
  }

  return results.sort((a, b) =>
    a.producto.empresa.localeCompare(b.producto.empresa) ||
    a.producto.marca.localeCompare(b.producto.marca) ||
    a.producto.descripcion.localeCompare(b.producto.descripcion)
  );
}

function matchesQuery(item, lowerQuery) {
  return (
    item.producto.empresa?.toLowerCase().includes(lowerQuery) ||
    item.producto.marca?.toLowerCase().includes(lowerQuery) ||
    item.producto.descripcion?.toLowerCase().includes(lowerQuery) ||
    item.fecha?.includes(lowerQuery)
  );
}

export function displaySearchResults(results) {
  const resultsContainer = document.getElementById("tableContent");
  if (!resultsContainer) return;

  renderTableBody(resultsContainer, results);
  initializePopovers();
}

export function getCurrentSearchQuery() {
  return currentSearchQuery;
}

// Función global para re-aplicar la búsqueda
window.reapplySearch = () => {
  if (currentSearchQuery) {
    document.getElementById("searchInput").value = currentSearchQuery;
    document.getElementById("searchButton").click();
  }
};