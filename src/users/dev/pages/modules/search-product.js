// search-product.js
import { auth, database } from "../../../../../environment/firebaseConfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { saveSearch, displayRecentSearches } from "../components/nav-header/search/searchHistory.js";
import { showToast } from "../components/toast/toastLoader.js";
import { renderTableBody } from "./tabla/createTableElements.js";
import { initializePopovers } from "../components/popover/action-popover/action-popover.js";

let currentSearchQuery = "";
let currentFilteredResults = [];

export function initializeSearchProduct(tableHeadersElement) {
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
        // Verificar la existencia de tableHeadersElement y resultsContainer antes de llamar a displaySearchResults
        const tableHeadersElement = document.getElementById("table-headers");
        const resultsContainer = document.getElementById("tableContent");
        if (tableHeadersElement && resultsContainer) {
          displaySearchResults(currentFilteredResults, tableHeadersElement);
        } else {
          console.error("tableHeadersElement or resultsContainer is undefined");
        }
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

// Función para normalizar texto: eliminar tildes y reemplazar guiones por espacios
function normalizeText(text) {
  return text
    .normalize("NFD") // Descompone caracteres con tildes
    .replace(/[\u0300-\u036f]/g, "") // Elimina tildes
    .replace(/-/g, " "); // Reemplaza guiones por espacios
}

function processSearchResults(userProductsSnapshot, sharedSnapshot, query) {
  const results = [];
  const normalizedQuery = normalizeText(query.toLowerCase());

  if (userProductsSnapshot.exists()) {
    Object.entries(userProductsSnapshot.val()).forEach(([key, product]) => {
      if (matchesQuery(product, normalizedQuery)) {
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

        if (matchesQuery(combinedData, normalizedQuery)) {
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

function matchesQuery(item, normalizedQuery) {
  // Normalizar los campos del item
  const empresaLower = item.producto.empresa ? normalizeText(item.producto.empresa.toLowerCase()) : "";
  const marcaLower = item.producto.marca ? normalizeText(item.producto.marca.toLowerCase()) : "";
  const descripcionLower = item.producto.descripcion ? normalizeText(item.producto.descripcion.toLowerCase()) : "";
  const fechaLower = item.fecha ? normalizeText(item.fecha.toLowerCase()) : "";

  return (
    empresaLower.includes(normalizedQuery) ||
    marcaLower.includes(normalizedQuery) ||
    descripcionLower.includes(normalizedQuery) ||
    fechaLower.includes(normalizedQuery)
  );
}

export function displaySearchResults(results, tableHeadersElement) {
  const resultsContainer = document.getElementById("tableContent");
  if (!resultsContainer || !tableHeadersElement) {
    console.error("tableHeadersElement or resultsContainer is undefined");
    return;
  }
  renderTableBody(tableHeadersElement, resultsContainer, results);
  initializePopovers(tableHeadersElement, resultsContainer, results);
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