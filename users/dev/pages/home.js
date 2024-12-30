// Importaciones principales
import {
  get,
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database, auth } from "../../../environment/firebaseConfig.js";
import { checkAuth } from "../../../modules/accessControl/authCheck.js";
import { getUserEmail } from "../../../modules/accessControl/getUserEmail.js";

// Importaciones de módulos adicionales
import { setupInstallPrompt } from "../../../modules/installPrompt.js";
import { initializePopovers } from "./components/popover/popover.js";

// Importaciones de funcionalidades específicas
import { initializePagination } from "./components/pagination/pagination.js";
import { initializeSearchProduct } from "./modules/tabla/search-product.js";
import { createTableRow } from "./modules/tabla/createTableRow.js";
import { initializeDuplicateProductRow } from "./modules/tabla/duplicateProductRow.js";
import { initializeDeleteHandlers } from "./modules/tabla/deleteHandlersRow.js"; // Importar el manejador de eliminación

// Constantes y variables de estado
const tablaContenido = document.getElementById("contenidoTabla");

// Función principal para mostrar datos
export function mostrarDatos(callback) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error("El usuario no ha iniciado sesión.");
    return;
  }

  const userId = currentUser.uid;
  const userProductsRef = ref(database, `users/${userId}/productData`);
  const sharedDataRef = ref(database, `users/${userId}/sharedData`);

  const updateTable = async () => {
    try {
      tablaContenido.innerHTML = ""; // Limpia la tabla antes de renderizar

      // Obtener datos de ambas referencias en paralelo
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

      // Ordenar datos por fecha descendente
      data.sort((b, a) => new Date(a.fecha) - new Date(b.fecha));

      // Renderizar datos en la tabla
      let filaNumero = 1;
      for (const productData of data) {
        tablaContenido.innerHTML += createTableRow(productData, filaNumero++);
      }

      // Inicializar popovers después de renderizar la tabla
      initializePopovers();

      // Llama al callback para actualizar la paginación
      if (callback) callback();
    } catch (error) {
      console.error("Error al mostrar los datos:", error);
    }
  };

  // Usar `onValue` en el nivel raíz para escuchar cambios en ambas referencias
  onValue(ref(database, `users/${userId}`), updateTable);
}

// Inicializar sesión del usuario
function initializeUserSession(user) {
  // Inicializar paginación
  const { updatePagination } = initializePagination("contenidoTabla", 5);

  mostrarDatos(() => {
    updatePagination(); // Actualiza la paginación después de mostrar los datos
  });

  // Inicializar funcionalidades adicionales
  initializeSearchProduct();
  initializeDuplicateProductRow();

  setupInstallPrompt("installButton");

  // Inicializar manejadores de eliminación
  initializeDeleteHandlers();

  getUserEmail()
    .then((email) => {
      console.log(`Correo del usuario: ${email}`);
    })
    .catch((error) => {
      console.error("Error al obtener el correo del usuario:", error);
    });
}

// Inicializa la tabla y eventos al cargar el documento
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
