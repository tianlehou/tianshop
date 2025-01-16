// search-products.js
import { auth, database } from "../../../../../environment/firebaseConfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { saveSearch, displayRecentSearches } from "../components/buttons/search/searchHistory.js";

import { showToast } from "../components/toast/toastLoader.js";
import { createTableBody } from "./tabla/createTableElements.js";
import { initializePopovers } from "../components/popover/popover.js";

export function initializeSearchProduct() {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const recentSearchesContainer = document.getElementById("recentSearches");

  if (!searchInput || !searchButton || !recentSearchesContainer) {
    console.error("No se encontró el componente de búsqueda.");
    return;
  }

  const handleSearch = async () => {
    const query = searchInput.value.trim();

    if (!query) {
      showToast("Por favor, ingresa un término para buscar.", "warning");
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showToast("Debes iniciar sesión para buscar productos.", "error");
        return;
      }

      const userId = currentUser.uid;

      // Guardar la búsqueda reciente
      await saveSearch(userId, query, database);

      const userProductsRef = ref(database, `users/${userId}/productData`);
      const sharedDataRef = ref(database, `users/${userId}/sharedData`);

      const [userProductsSnapshot, sharedSnapshot] = await Promise.all([
        get(userProductsRef),
        get(sharedDataRef),
      ]);

      const results = [];

      // Procesar datos del usuario
      if (userProductsSnapshot.exists()) {
        const products = userProductsSnapshot.val();
        Object.entries(products).forEach(([key, product]) => {
          if (
            product.producto.empresa.toLowerCase().includes(query.toLowerCase()) ||
            product.producto.marca.toLowerCase().includes(query.toLowerCase()) ||
            product.producto.descripcion.toLowerCase().includes(query.toLowerCase()) ||
            (product.fecha && product.fecha.includes(query))
          ) {
            results.push({ id: key, ...product });
          }
        });
      }

      // Procesar datos compartidos
      if (sharedSnapshot.exists()) {
        const sharedData = sharedSnapshot.val();
        for (const [sharedByUserId, sharedContent] of Object.entries(sharedData)) {
          const { productData, metadata } = sharedContent;
          if (!productData || !metadata) continue;

          for (const [key, value] of Object.entries(productData)) {
            const combinedData = {
              id: key,
              ...value,
              sharedByEmail: metadata.sharedByEmail,
              sharedAt: metadata.sharedAt,
              sharedBy: sharedByUserId,
            };

            if (
              combinedData.producto.empresa.toLowerCase().includes(query.toLowerCase()) ||
              combinedData.producto.marca.toLowerCase().includes(query.toLowerCase()) ||
              combinedData.producto.descripcion.toLowerCase().includes(query.toLowerCase()) ||
              (combinedData.fecha && combinedData.fecha.includes(query))
            ) {
              results.push(combinedData);
            }
          }
        }
      }

      if (results.length === 0) {
        showToast("No se encontraron resultados para tu búsqueda.", "info");
      } else {
        // Ordenar los resultados
        results.sort((a, b) => {
          const empresaDiff = a.producto.empresa.localeCompare(b.producto.empresa);
          if (empresaDiff !== 0) return empresaDiff;

          const marcaDiff = a.producto.marca.localeCompare(b.producto.marca);
          if (marcaDiff !== 0) return marcaDiff;

          const descripcionDiff = a.producto.descripcion.localeCompare(b.producto.descripcion);
          if (descripcionDiff !== 0) return descripcionDiff;

          return a.precio.venta.localeCompare(b.precio.venta);
        });

        displaySearchResults(results);
      }
    } catch (error) {
      console.error("Error al buscar productos:", error);
      showToast("Hubo un error al buscar los productos.", "error");
    }
  };

  searchButton.addEventListener("click", handleSearch);

  searchInput.addEventListener("focus", async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userId = currentUser.uid;
      recentSearchesContainer.classList.remove("hidden"); // Mostrar el contenedor
      await displayRecentSearches(userId, database);
    }
  });

    // Detectar la tecla Enter
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  });
}

function displaySearchResults(results) {
  const resultsContainer = document.getElementById("contenidoTabla");
  if (!resultsContainer) {
    console.error("No se encontró el contenedor para mostrar los resultados.");
    return;
  }

  resultsContainer.innerHTML = "";
  let filaNumero = 1;

  results.forEach((productData) => {
    const tableBodyHTML = createTableBody(productData, filaNumero++);
    resultsContainer.innerHTML += tableBodyHTML;
  });

  initializePopovers();
}
