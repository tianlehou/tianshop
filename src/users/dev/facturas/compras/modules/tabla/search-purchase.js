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

  searchButton.addEventListener("click", async () => {
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
      const dbRef = ref(database, `users/${userId}/productData`);
      const snapshot = await get(dbRef);

      if (!snapshot.exists()) {
        showToast("No se encontraron productos en la base de datos.", "info");
        return;
      }

      const products = snapshot.val();
      const results = Object.entries(products).filter(([key, product]) => {
        return (
          product.producto.empresa.toLowerCase().includes(query.toLowerCase()) ||
          product.producto.marca.toLowerCase().includes(query.toLowerCase()) ||
          product.producto.descripcion.toLowerCase().includes(query.toLowerCase()) ||
          (product.fecha && product.fecha.includes(query)) // Buscar por fecha
        );
      });

      if (results.length === 0) {
        showToast("No se encontraron resultados para tu búsqueda.", "info");
      } else {
        // Ordenar los resultados
        results.sort((a, b) => {
          const productA = a[1];
          const productB = b[1];
          const empresaDiff = productA.producto.empresa.localeCompare(productB.producto.empresa);
          if (empresaDiff !== 0) return empresaDiff;
        
          const marcaDiff = productA.producto.marca.localeCompare(productB.producto.marca);
          if (marcaDiff !== 0) return marcaDiff;
        
          const descripcionDiff = productA.producto.descripcion.localeCompare(productB.producto.descripcion);
          if (descripcionDiff !== 0) return descripcionDiff;
        
          return productA.precio.venta.localeCompare(productB.precio.venta);
        });

        displaySearchResults(results);
      }
    } catch (error) {
      console.error("Error al buscar productos:", error);
      showToast("Hubo un error al buscar los productos.", "error");
    }
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

  results.forEach(([key, product]) => {
    // Usar createTableRow para mantener la consistencia
    const tableBodyHTML = createTableBody({ id: key, ...product }, filaNumero++);
    resultsContainer.innerHTML += tableBodyHTML;
  });

  // Inicializar popovers después de renderizar la tabla
  initializePopovers();
}
