// search-purchase.js
import { database } from "../../../../../../../environment/firebaseConfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getUserEmail } from "../../../../../../modules/accessControl/getUserEmail.js";
import { showToast } from "../../components/toast/toastLoader.js";
import { createTableBody } from "./createPurchaseTableElements.js";
import { initializePopovers } from "../../components/popover/purchase-popover.js";
import { normalizeText } from "../../../../../../utils/normalize-text-utils.js";

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
    const query = normalizeText(searchInput.value.trim()); // Normaliza la consulta

    if (!query) {
        showToast("Por favor, ingresa un término para buscar.", "warning");
        return;
    }

    try {
        const email = await getUserEmail(); // Obtén el correo electrónico del usuario

        if (!email) {
            showToast("No se pudo obtener el correo del usuario.", "error");
            return;
        }

        // Guardar en la base de datos personal del usuario
        const userEmailKey = email.replaceAll(".", "_");
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
                (purchase.fecha && normalizeText(purchase.fecha).includes(query)) ||
                (factura.empresa && normalizeText(factura.empresa).includes(query)) ||
                (factura.monto && normalizeText(factura.monto.toString()).includes(query)) ||
                (factura.estado && normalizeText(factura.estado).includes(query))
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
