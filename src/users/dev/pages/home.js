// home.js
import {
  get,
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database, auth } from "../../../../environment/firebaseConfig.js";
import { checkAuth } from "../../../modules/accessControl/authCheck.js";
import { getUserEmail } from "../../../modules/accessControl/getUserEmail.js";

// Importaciones adicionales
import { setupInstallPrompt } from "../../../modules/installPrompt.js";
import { initializePopovers } from "./components/popover/popover.js";
import { initializePagination } from "./components/pagination/pagination.js";
import { initializeSearchProduct } from "./modules/search-product.js";
import {
  renderTableHeaders,
  createTableBody,
} from "./modules/tabla/createTableElements.js";
import { initializeDuplicateProductRow } from "./modules/tabla/duplicateProductRow.js";
import { initializeDeleteHandlers } from "./modules/tabla/deleteHandlersRow.js";
// import { initGraph } from "./modules/graph.js";

// Constantes
const tableContent = document.getElementById("tableContent");
const tableHeadersElement = document.getElementById("table-headers");

// Función principal para mostrar datos
export async function mostrarDatos(callback) {
  const email = await getUserEmail();

  if (!email) {
    console.error("No se pudo obtener el correo del usuario.");
    return;
  }

  // Ruta personal de los datos del usuario
  const userProductsRef = ref(database, `users/${email.replaceAll(".", "_")}/productData`);
  const sharedDataRef = ref(database, `users/${email.replaceAll(".", "_")}/sharedData`);

  const updateTable = async () => {
    try {
      tableContent.innerHTML = ""; // Limpia la tabla antes de renderizar
      const [userProductsSnapshot, sharedSnapshot] = await Promise.all([
        get(userProductsRef),
        get(sharedDataRef),
      ]);

      const data = [];

      // Procesar datos del usuario
      if (userProductsSnapshot.exists()) {
        userProductsSnapshot.forEach((childSnapshot) => {
          data.push({ id: childSnapshot.key, ...childSnapshot.val() });
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

            data.push(combinedData);
          }
        }
      }

      // Ordenar los datos
      data.sort((a, b) => {
        const empresaDiff = a.producto.empresa.localeCompare(b.producto.empresa);
        if (empresaDiff !== 0) return empresaDiff;

        const marcaDiff = a.producto.marca.localeCompare(b.producto.marca);
        if (marcaDiff !== 0) return marcaDiff;

        const descripcionDiff = a.producto.descripcion.localeCompare(b.producto.descripcion);
        if (descripcionDiff !== 0) return descripcionDiff;

        return a.precio.venta.localeCompare(b.precio.venta);
      });

      // Renderizar filas de la tabla
      let filaNumero = 1;
      for (const productData of data) {
        tableContent.innerHTML += createTableBody(productData, filaNumero++);
      }

      // initGraph(data);
      initializePopovers(); // Inicializar popovers después de renderizar
      if (callback) callback();
    } catch (error) {
      console.error("Error al mostrar los datos:", error);
    }
  };

  onValue(ref(database, `users/${email.replaceAll(".", "_")}`), updateTable);
}

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();

  auth.onAuthStateChanged((user) => {
    if (user) {
      initializeUserSession(user);
    } else {
      console.error("Usuario no autenticado.");
    }
  });
});

function initializeUserSession(user) {
  if (!document.getElementById("tableContent")) {
    console.error("El contenedor de la tabla no está presente en el DOM.");
    return;
  }

  renderTableHeaders(tableHeadersElement);
  const { updatePagination } = initializePagination("tableContent", 10);

  mostrarDatos(() => {
    updatePagination();
  });

  // Intentar inicializar los elementos de búsqueda con reintentos
  const searchRetryLimit = 10; // Número máximo de intentos
  let retryCount = 0;

  const checkSearchElements = setInterval(() => {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");

    if (searchInput && searchButton) {
      clearInterval(checkSearchElements);
      initializeSearchProduct();
      console.log("Elementos de búsqueda inicializados correctamente.");
    } else {
      console.warn(`Intento ${retryCount + 1}: No se encontraron los elementos de búsqueda.`);
      retryCount++;

      if (retryCount >= searchRetryLimit) {
        clearInterval(checkSearchElements);
        console.error("No se encontraron los elementos de búsqueda tras varios intentos. Refrescando la página...");
        window.location.reload();
      }
    }
  }, 1000); // Intervalo de 1 segundo entre intentos

  initializeDuplicateProductRow();
  setupInstallPrompt("installButton");
  initializeDeleteHandlers();

  getUserEmail()
    .then((email) => {
      console.log(`Correo del usuario: ${email}`);
    })
    .catch((error) => {
      console.error("Error al obtener el correo del usuario:", error);
    });
}

