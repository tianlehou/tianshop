import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

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

export async function saveSearch(userId, query, database) {
  try {
    const timestamp = getFormattedTimestamp();
    const recentSearchesRef = ref(database, `users/${userId}/recentSearches`);
    const snapshot = await get(recentSearchesRef);

    if (snapshot.exists()) {
      const recentSearches = snapshot.val();

      // Buscar si el término ya existe
      const existingEntryKey = Object.keys(recentSearches).find(
        (key) => recentSearches[key].query === query
      );

      if (existingEntryKey) {
        // Si existe, actualizar el timestamp
        const existingEntryRef = ref(database, `users/${userId}/recentSearches/${existingEntryKey}`);
        await set(existingEntryRef, { query, timestamp });
      } else {
        // Si no existe, crear un nuevo registro
        const newKey = Date.now(); // Usado como clave única
        const newEntryRef = ref(database, `users/${userId}/recentSearches/${newKey}`);
        await set(newEntryRef, { query, timestamp });
      }
    } else {
      // Si no hay búsquedas previas, crear la primera entrada
      const newKey = Date.now(); // Usado como clave única
      const searchRef = ref(database, `users/${userId}/recentSearches/${newKey}`);
      await set(searchRef, { query, timestamp });
    }
  } catch (error) {
    console.error("Error al guardar la búsqueda:", error);
  }
}

export async function displayRecentSearches(userId, database) {
  try {
    const recentSearchesRef = ref(database, `users/${userId}/recentSearches`);
    const snapshot = await get(recentSearchesRef);

    if (snapshot.exists()) {
      const recentSearches = snapshot.val();

      // Convertir en array y ordenar por timestamp (descendente)
      const sortedSearches = Object.values(recentSearches)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Usar un Set para eliminar duplicados (manteniendo el más reciente)
      const uniqueSearches = [];
      const seenQueries = new Set();

      for (const search of sortedSearches) {
        if (!seenQueries.has(search.query)) {
          uniqueSearches.push(search);
          seenQueries.add(search.query);
        }
      }

      // Limitar a los primeros 10 resultados únicos
      const topSearches = uniqueSearches.slice(0, 10);

      // Actualizar la lista en el HTML
      const dataList = document.getElementById("recentSearchesList");
      if (dataList) {
        dataList.innerHTML = topSearches
          .map(
            (search) =>
              `<option value="${search.query}"></option>`
          )
          .join("");
      }
    }
  } catch (error) {
    console.error("Error al mostrar las búsquedas recientes:", error);
  }
}
