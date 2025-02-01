// searchHistory.js
import { ref, set, get, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { showConfirmModal } from "../../modal/confirm-modal/confirmModal.js";
import { showToast } from "../../toast/toastLoader.js";

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
    const recentSearchesRef = ref(database, `users/${userEmailKey}/recentSearches`);
    const snapshot = await get(recentSearchesRef);

    if (snapshot.exists()) {
      const recentSearches = snapshot.val();

      // Buscar si el término ya existe
      const existingEntryKey = Object.keys(recentSearches).find(
        (key) => recentSearches[key].query === query
      );

      if (existingEntryKey) {
        // Si existe, actualizar el timestamp
        const existingEntryRef = ref(database, `users/${userEmailKey}/recentSearches/${existingEntryKey}`);
        await set(existingEntryRef, { query, timestamp });
      } else {
        // Si no existe, crear un nuevo registro
        const newKey = Date.now(); // Usado como clave única
        const newEntryRef = ref(database, `users/${userEmailKey}/recentSearches/${newKey}`);
        await set(newEntryRef, { query, timestamp });
      }
    } else {
      // Si no hay búsquedas previas, crear la primera entrada
      const newKey = Date.now(); // Usado como clave única
      const searchRef = ref(database, `users/${userEmailKey}/recentSearches/${newKey}`);
      await set(searchRef, { query, timestamp });
    }
  } catch (error) {
    console.error("Error al guardar la búsqueda:", error);
  }
}

let delegatedListenersInitialized = false;
let _database = null;

/**
 * Inicializa la delegación de eventos sobre el contenedor de búsquedas recientes.
 * Gestiona tanto clics en el botón de eliminación como en el item de búsqueda.
 */
function initDelegatedListeners() {
  const recentSearchesContainer = document.getElementById("recentSearches");
  if (!recentSearchesContainer) return;

  recentSearchesContainer.addEventListener("click", async (e) => {
    // Si se hace clic en el botón de eliminar
    const deleteBtn = e.target.closest('.delete-searches-btn');
    if (deleteBtn && recentSearchesContainer.contains(deleteBtn)) {
      e.stopPropagation(); // Evita que se active el clic del item
      const key = deleteBtn.dataset.key;
      const userEmailKey = recentSearchesContainer.dataset.userEmailKey;
      if (!userEmailKey) return;
      showConfirmModal(
        "¿Estás seguro de que quieres eliminar esta búsqueda?",
        async () => {
          try {
            const searchRef = ref(_database, `users/${userEmailKey}/recentSearches/${key}`);
            await remove(searchRef);
            showToast("Búsqueda eliminada correctamente", "success");
            // Refrescar la lista de búsquedas
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

    // Si se hace clic en un item de búsqueda (excluyendo el botón de eliminación)
    const searchItem = e.target.closest('.recent-search-item');
    if (searchItem && recentSearchesContainer.contains(searchItem)) {
      const query = searchItem.querySelector("span")?.textContent.trim();
      if (query) {
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
          searchInput.value = query;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        // Cerrar la lista de búsquedas recientes
        recentSearchesContainer.classList.add("hidden");

        // Simular clic en el botón de búsqueda para ejecutar la búsqueda
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
    const recentSearchesRef = ref(database, `users/${userEmailKey}/recentSearches`);
    const snapshot = await get(recentSearchesRef);

    const recentSearchesContainer = document.getElementById("recentSearches");
    if (!recentSearchesContainer) return;

    if (snapshot.exists()) {
      const recentSearches = snapshot.val();

      // Convertir en array de entradas [clave, valor] y ordenar por timestamp descendente
      const sortedSearches = Object.entries(recentSearches)
        .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp));

      // Eliminar duplicados manteniendo claves únicas
      const uniqueSearches = [];
      const seenQueries = new Set();

      for (const [key, search] of sortedSearches) {
        if (!seenQueries.has(search.query)) {
          uniqueSearches.push({ key, ...search });
          seenQueries.add(search.query);
        }
      }

      const topSearches = uniqueSearches.slice(0, 10); // Limitar a 10 búsquedas

      // Renderizar la lista
      recentSearchesContainer.innerHTML = topSearches
        .map(
          (search) => `
            <div class="recent-search-item items-center p-2 hover:bg-gray-100 cursor-pointer">
              <span class="flex-grow">${search.query}</span>
              <i class="bi bi-x delete-searches-btn px-2" data-key="${search.key}"></i>
            </div>
          `
        )
        .join("");

      // Guardar el userEmailKey en el contenedor para usarlo en la delegación
      recentSearchesContainer.dataset.userEmailKey = userEmailKey;
      _database = database;

      // Inicializar el event delegation si aún no se ha hecho
      if (!delegatedListenersInitialized) {
        initDelegatedListeners();
      }

      // Mostrar el contenedor de búsquedas recientes
      recentSearchesContainer.classList.remove("hidden");
    } else {
      // Si no hay búsquedas recientes, ocultar el contenedor
      recentSearchesContainer.classList.add("hidden");
    }
  } catch (error) {
    console.error("Error al mostrar las búsquedas recientes:", error);
  }
}
