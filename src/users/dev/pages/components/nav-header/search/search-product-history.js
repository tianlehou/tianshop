// search-product-history.js
import { ref, set, get, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { showConfirmModal } from "../../../../../../components/confirmation-modal/confirmModal.js";
import { showToast } from "../../../../../../components/toast/toastLoader.js";

function getFormattedTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export async function saveSearch(userEmailKey, query, database) {
  try {
    const timestamp = getFormattedTimestamp();
    const productsSearchesRef = ref(database, `users/${userEmailKey}/recentSearches/products/${query}`);
    // Guardar solo el timestamp directamente
    await set(productsSearchesRef, timestamp);
  } catch (error) {
    console.error("Error al guardar la búsqueda:", error);
  }
}

let delegatedListenersInitialized = false;
let _database = null;

function initDelegatedListeners() {
  const recentSearchesContainer = document.getElementById("recentSearches");
  if (!recentSearchesContainer) return;

  recentSearchesContainer.addEventListener("click", async (e) => {
    const deleteBtn = e.target.closest('.delete-searches-btn');
    if (deleteBtn && recentSearchesContainer.contains(deleteBtn)) {
      e.stopPropagation();
      const query = deleteBtn.dataset.query;
      const userEmailKey = recentSearchesContainer.dataset.userEmailKey;
      if (!userEmailKey) return;
      showConfirmModal(
        "¿Estás seguro de que quieres eliminar esta búsqueda?",
        async () => {
          try {
            const searchRef = ref(_database, `users/${userEmailKey}/recentSearches/products/${query}`);
            await remove(searchRef);
            showToast("Búsqueda eliminada correctamente", "success");
            displayRecentSearches(userEmailKey, _database);
          } catch (error) {
            console.error("Error al eliminar la búsqueda:", error);
            showToast("Error al eliminar la búsqueda", "error");
          }
        },
        () => {
          console.log("Eliminación cancelada");
        }
      );
      return;
    }

    const searchItem = e.target.closest('.recent-search-item');
    if (searchItem && recentSearchesContainer.contains(searchItem)) {
      const query = searchItem.querySelector("span")?.textContent.trim();
      if (query) {
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
          searchInput.value = query;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        recentSearchesContainer.classList.add("hidden");
        const searchButton = document.getElementById("searchButton");
        if (searchButton) {
          searchButton.click();
        }
      }
    }
  });
  delegatedListenersInitialized = true;
}

export async function displayRecentSearches(userEmailKey, database) {
  try {
    const productsSearchesRef = ref(database, `users/${userEmailKey}/recentSearches/products`);
    const snapshot = await get(productsSearchesRef);

    const recentSearchesContainer = document.getElementById("recentSearches");
    if (!recentSearchesContainer) return;

    if (snapshot.exists()) {
      const productsSearches = snapshot.val();

      // Convertir en array de entradas [query, timestamp] y ordenar por timestamp descendente
      const sortedSearches = Object.entries(productsSearches)
        .sort((a, b) => new Date(b[1]) - new Date(a[1]))
        .slice(0, 10); // Limitar a 10 búsquedas

      // Renderizar la lista
      recentSearchesContainer.innerHTML = sortedSearches
        .map(
          ([query]) => `
            <div class="recent-search-item items-center p-2 hover:bg-gray-100 cursor-pointer">
              <span class="flex-grow">${query}</span>
              <i class="bi bi-x delete-searches-btn px-2" data-query="${query}"></i>
            </div>
          `
        )
        .join("");

      // Guardar el userEmailKey en el contenedor para usarlo en la delegación
      recentSearchesContainer.dataset.userEmailKey = userEmailKey;
      _database = database;

      if (!delegatedListenersInitialized) {
        initDelegatedListeners();
      }

      recentSearchesContainer.classList.remove("hidden");
    } else {
      recentSearchesContainer.classList.add("hidden");
    }
  } catch (error) {
    console.error("Error al mostrar las búsquedas recientes:", error);
  }
}