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
import { initializeSearchProduct } from "./modules/tabla/search-product.js";
import { renderTableHeaders, createTableBody } from "./modules/tabla/createTableElements.js";
import { initializeDuplicateProductRow } from "./modules/tabla/duplicateProductRow.js";
import { initializeDeleteHandlers } from "./modules/tabla/deleteHandlersRow.js";

// Constantes
const tablaContenido = document.getElementById("contenidoTabla");
const tableHeadersElement = document.getElementById("table-headers");

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

      data.sort((a, b) => {
        const empresaDiff = a.producto.empresa.localeCompare(b.producto.empresa);
        if (empresaDiff !== 0) return empresaDiff;

        const marcaDiff = a.producto.marca.localeCompare(b.producto.marca);
        if (marcaDiff !== 0) return marcaDiff;

        const descripcionDiff = a.producto.descripcion.localeCompare(b.producto.descripcion);
        if (descripcionDiff !== 0) return descripcionDiff;

        return a.precio.venta.localeCompare(b.precio.venta);
      });

      let filaNumero = 1;
      for (const productData of data) {
        tablaContenido.innerHTML += createTableBody(productData, filaNumero++);
      }

      initializePopovers();
      if (callback) callback();
    } catch (error) {
      console.error("Error al mostrar los datos:", error);
    }
  };

  onValue(ref(database, `users/${userId}`), updateTable);
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
  renderTableHeaders(tableHeadersElement); // Renderizar cabeceras al inicio
  const { updatePagination } = initializePagination("contenidoTabla", 5);

  mostrarDatos(() => {
    updatePagination(); // Actualiza la paginación después de mostrar los datos
  });

  // Mover todas las inicializaciones dependientes aquí
  initializeSearchProduct();
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

