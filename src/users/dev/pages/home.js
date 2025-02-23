// [file name]: home.js
import { get, ref, onValue } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database, auth } from "../../../../environment/firebaseConfig.js";
import { checkAuth } from "../../../modules/accessControl/authCheck.js";
import { getUserEmail } from "../../../modules/accessControl/getUserEmail.js";
import { autoDeleteExpiredShares } from "./components/popover/share-popover/autoDeleteExpiredShares.js";
import { setupInstallPrompt } from "../../../modules/installPrompt.js";
import { initializePopovers } from "./components/popover/action-popover/action-popover.js";
import { initializePagination } from "./components/pagination/pagination.js";
import { initializeSearchProduct } from "./modules/search-product.js";
import { renderTableHeaders, renderTableBody } from "./modules/tabla/createTableElements.js";
import { initializeDuplicateProductRow } from "./modules/tabla/duplicateProductRow.js";
import { initializeDeleteHandlers } from "./modules/tabla/deleteHandlersRow.js";

const tableContent = document.getElementById("tableContent");
const tableHeadersElement = document.getElementById("table-headers");
let currentData = [];  // Almacena los datos actuales de la tabla
let currentSearchQuery = "";  // Mantiene el estado de la búsqueda actual

// Función principal para cargar y mostrar datos desde Firebase
export async function mostrarDatos(callback, customData = null) {
  const email = await getUserEmail();

  if (!email) {
    console.error("No se pudo obtener el correo del usuario.");
    return;
  }

  // Normaliza el email para uso en Firebase
  const userEmailKey = email.replaceAll(".", "_");
  const userProductsRef = ref(database, `users/${userEmailKey}/productData`);  // Referencia a productos del usuario
  const sharedDataRef = ref(database, `users/${userEmailKey}/shared/data`);  // Referencia a datos compartidos

  // Actualiza la tabla con datos en tiempo real
  const updateTable = async () => {
    try {
      tableContent.innerHTML = "";  // Limpia la tabla
      // Obtiene datos en paralelo: productos propios y compartidos
      const [userProductsSnapshot, sharedSnapshot] = await Promise.all([
        get(userProductsRef),
        get(sharedDataRef),
      ]);

      // Procesa datos solo si no se proveen datos customizados
      if (!customData) {
        currentData = await processData(userProductsSnapshot, sharedSnapshot);
      }

      const dataToShow = customData || currentData;
      renderData(dataToShow);  // Renderiza los datos procesados
      
      if (callback) callback();  // Ejecuta callback post-renderizado
      
      // Mantiene el estado de la búsqueda tras actualizaciones
      if (currentSearchQuery) {
        document.getElementById("searchInput").value = currentSearchQuery;
      }
    } catch (error) {
      console.error("Error al mostrar datos:", error);
    }
  };

  // Escucha cambios en tiempo real en la base de datos
  onValue(ref(database, `users/${userEmailKey}`), updateTable);
}

// Procesa y combina datos de productos propios y compartidos
async function processData(userProductsSnapshot, sharedSnapshot) {
  const data = [];

  // Agrega productos del usuario
  if (userProductsSnapshot.exists()) {
    userProductsSnapshot.forEach((childSnapshot) => {
      data.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
  }

  // Agrega productos compartidos por otros usuarios
  if (sharedSnapshot.exists()) {
    const sharedData = sharedSnapshot.val();
    for (const [sharedByUserId, sharedContent] of Object.entries(sharedData)) {
      const { productData, metadata } = sharedContent;
      if (!productData || !metadata) continue;

      // Combina metadatos de compartición con los datos del producto
      for (const [key, value] of Object.entries(productData)) {
        data.push(createCombinedData(key, value, metadata, sharedByUserId));
      }
    }
  }

  return data;
}

// Renderiza los datos en la tabla con ordenamiento específico
function renderData(data) {
  // Ordena por empresa -> marca -> descripción
  data.sort((a, b) => {
    const empresaDiff = a.producto.empresa.localeCompare(b.producto.empresa);
    return empresaDiff !== 0 ? empresaDiff : 
           a.producto.marca.localeCompare(b.producto.marca) || 
           a.producto.descripcion.localeCompare(b.producto.descripcion);
  });

  // Usa renderTableBody para renderizar el cuerpo, pasando tableHeadersElement
  renderTableBody(tableHeadersElement, tableContent, data);
  initializePopovers(tableHeadersElement, tableContent, data);  // Inicializa popovers con parámetros
}

// Crea objeto unificado para productos compartidos
function createCombinedData(key, value, metadata, sharedByUserId) {
  return {
    id: key,
    ...value,
    sharedByEmail: metadata.sharedByEmail,  // Email del usuario que compartió
    sharedBy: sharedByUserId,  // ID del usuario que compartió
    sharedAt: metadata.sharedAt,  // Fecha de compartición
    expiresAt: metadata.expiresAt  // Fecha de expiración
  };
}

// Inicialización al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();  // Verifica autenticación

  // Maneja cambios de estado de autenticación
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      console.log("Usuario autenticado:", user.email);
      await initializeUserSession(user);  // Configura sesión del usuario
    } else {
      console.error("Usuario no autenticado.");
    }
  });
});

// Maneja eventos personalizados para refrescar la tabla
window.addEventListener("refreshTable", (e) => {
  currentSearchQuery = e.detail?.searchQuery || "";  // Preserva búsqueda
  if (currentSearchQuery) {
    document.getElementById("searchInput").value = currentSearchQuery;
    document.getElementById("searchButton").click();  // Dispara búsqueda
  }
});

// Configuración inicial de la sesión del usuario
async function initializeUserSession(user) {
  if (!tableContent || !tableHeadersElement) {
    console.error("Contenedor de tabla o encabezados no encontrados");
    return;
  }

  renderTableHeaders(tableHeadersElement);  // Renderiza encabezados de tabla
  const { updatePagination } = initializePagination("tableContent", 10);  // Paginación con 10 items/página

  mostrarDatos(() => updatePagination());  // Carga datos iniciales

  // Verifica existencia de elementos de búsqueda (maneja carga asincrónica)
  const searchRetryLimit = 10;
  let retryCount = 0;

  const checkSearchElements = setInterval(() => {
    const tableHeadersElement = document.getElementById("tableHeaders");
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");

    if (searchInput && searchButton) {
      clearInterval(checkSearchElements);
      initializeSearchProduct(tableHeadersElement);
    } else if (++retryCount >= searchRetryLimit) {
      clearInterval(checkSearchElements);
      window.location.reload();  // Recarga como fallback
    }
  }, 1000);

  // Configuraciones adicionales
  initializeDuplicateProductRow();  // Habilita duplicación de filas
  setupInstallPrompt("installButton");  // Maneja instalación PWA
  initializeDeleteHandlers();  // Habilita eliminación de productos

  // Limpieza automática de shares expirados
  try {
    const email = await getUserEmail();
    if (email) await autoDeleteExpiredShares(email);
  } catch (error) {
    console.error("Error en limpieza automática:", error);
  }
}