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
import { showToast } from "./components/toast/toastLoader.js";

// Importaciones de funcionalidades específicas
import { initializePagination } from "./components/pagination/pagination.js";
import { initializeSearchProduct } from "./modules/tabla/search-product.js";
import { createTableRow } from "./modules/tabla/createTableRow.js";
import { initializeDeleteProductRow } from "./modules/tabla/deleteProductRow.js";
import { initializeDuplicateProductRow } from "./modules/tabla/duplicateProductRow.js";

// Constantes y variables de estado
const tablaContenido = document.getElementById("contenidoTabla");

// Función principal para mostrar datos
export async function mostrarDatos(callback) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error("El usuario no ha iniciado sesión.");
    return;
  }

  const userId = currentUser.uid;
  const userProductsRef = ref(database, `users/${userId}/productData`);
  const sharedDataRef = ref(database, `users/${userId}/sharedData`);

  try {
    // Combinar los datos del usuario y los compartidos
    onValue(userProductsRef, async (snapshot) => {
      tablaContenido.innerHTML = "";

      const data = [];
      snapshot.forEach((childSnapshot) => {
        data.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });

      // Cargar datos compartidos
      const sharedSnapshot = await get(sharedDataRef);
      if (sharedSnapshot.exists()) {
        const sharedData = sharedSnapshot.val();
        for (const [sharedByUserId, sharedContent] of Object.entries(sharedData)) {
          const { productData, metadata } = sharedContent;

          if (!productData || !metadata) continue;

          for (const [key, value] of Object.entries(productData)) {
            data.push({
              id: key,
              ...value,
              sharedByEmail: metadata.sharedByEmail,
              sharedAt: metadata.sharedAt,
            });
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
    });
  } catch (error) {
    console.error("Error al mostrar los datos:", error);
  }
}

// Inicializar sesión del usuario
function initializeUserSession(user) {
  // Inicializar paginación
  const { updatePagination } = initializePagination("contenidoTabla", 5);

  mostrarDatos(() => {
    updatePagination(); // Actualiza la paginación después de mostrar los datos
  });

  // Inicializar funcionalidades adicionales
  initializeDeleteProductRow();
  initializeSearchProduct();
  initializeDuplicateProductRow();

  setupInstallPrompt("installButton");

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
