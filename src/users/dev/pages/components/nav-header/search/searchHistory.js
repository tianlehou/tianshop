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

export async function displayRecentSearches(userEmailKey, database) {
  try {
    const recentSearchesRef = ref(database, `users/${userEmailKey}/recentSearches`);
    const snapshot = await get(recentSearchesRef);

    if (snapshot.exists()) {
      const recentSearches = snapshot.val();

      // Convertir en array de entradas [clave, valor] y ordenar
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

      const recentSearchesContainer = document.getElementById("recentSearches");
      if (recentSearchesContainer) {
        // Agregar botón de eliminar con data attribute
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

        // Agregar event listeners para los botones de eliminar
        recentSearchesContainer.querySelectorAll('.delete-searches-btn').forEach(button => {
          button.addEventListener('click', async (e) => {
            e.stopPropagation(); // Evitar que se active el click del item
            const key = button.dataset.key;

            // Mostrar modal de confirmación
            showConfirmModal(
              "¿Estás seguro de que quieres eliminar esta búsqueda?",
              async () => {
                try {
                  const searchRef = ref(database, `users/${userEmailKey}/recentSearches/${key}`);
                  await remove(searchRef);
                  showToast("Búsqueda eliminada correctamente", "success"); // Mostrar toast
                  displayRecentSearches(userEmailKey, database); // Refrescar la lista
                } catch (error) {
                  console.error("Error al eliminar la búsqueda:", error);
                  showToast("Error al eliminar la búsqueda", "error"); // Mostrar toast de error
                }
              },
              () => {
                console.log("Eliminación cancelada");
              }
            );
          });
        });

        // Mostrar el contenedor de búsquedas recientes
        recentSearchesContainer.classList.remove("hidden");
      }
    } else {
      // Si no hay búsquedas recientes, ocultar el contenedor
      const recentSearchesContainer = document.getElementById("recentSearches");
      if (recentSearchesContainer) {
        recentSearchesContainer.classList.add("hidden");
      }
    }
  } catch (error) {
    console.error("Error al mostrar las búsquedas recientes:", error);
  }
}