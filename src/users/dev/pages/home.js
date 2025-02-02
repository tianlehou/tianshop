// home.js
import { get, ref, onValue } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database, auth } from "../../../../environment/firebaseConfig.js";
import { checkAuth } from "../../../modules/accessControl/authCheck.js";
import { getUserEmail } from "../../../modules/accessControl/getUserEmail.js";
import { autoDeleteExpiredShares } from "./components/popover/share-popover/autoDeleteExpiredShares.js";
import { setupInstallPrompt } from "../../../modules/installPrompt.js";
import { initializePopovers } from "./components/popover/popover.js";
import { initializePagination } from "./components/pagination/pagination.js";
import { initializeSearchProduct } from "./modules/search-product.js";
import { renderTableHeaders, createTableBody } from "./modules/tabla/createTableElements.js";
import { initializeDuplicateProductRow } from "./modules/tabla/duplicateProductRow.js";
import { initializeDeleteHandlers } from "./modules/tabla/deleteHandlersRow.js";

const tableContent = document.getElementById("tableContent");
const tableHeadersElement = document.getElementById("table-headers");
let currentData = [];
let currentSearchQuery = "";

export async function mostrarDatos(callback, customData = null) {
  const email = await getUserEmail();

  if (!email) {
    console.error("No se pudo obtener el correo del usuario.");
    return;
  }

  const userEmailKey = email.replaceAll(".", "_");
  const userProductsRef = ref(database, `users/${userEmailKey}/productData`);
  const sharedDataRef = ref(database, `users/${userEmailKey}/shared/data`);

  const updateTable = async () => {
    try {
      tableContent.innerHTML = "";
      const [userProductsSnapshot, sharedSnapshot] = await Promise.all([
        get(userProductsRef),
        get(sharedDataRef),
      ]);

      if (!customData) {
        currentData = await processData(userProductsSnapshot, sharedSnapshot);
      }

      const dataToShow = customData || currentData;
      renderData(dataToShow);
      
      if (callback) callback();
      
      // Mantener búsqueda activa
      if (currentSearchQuery) {
        document.getElementById("searchInput").value = currentSearchQuery;
      }
    } catch (error) {
      console.error("Error al mostrar datos:", error);
    }
  };

  onValue(ref(database, `users/${userEmailKey}`), updateTable);
}

async function processData(userProductsSnapshot, sharedSnapshot) {
  const data = [];

  if (userProductsSnapshot.exists()) {
    userProductsSnapshot.forEach((childSnapshot) => {
      data.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
  }

  if (sharedSnapshot.exists()) {
    const sharedData = sharedSnapshot.val();
    for (const [sharedByUserId, sharedContent] of Object.entries(sharedData)) {
      const { productData, metadata } = sharedContent;
      if (!productData || !metadata) continue;

      for (const [key, value] of Object.entries(productData)) {
        data.push(createCombinedData(key, value, metadata, sharedByUserId));
      }
    }
  }

  return data;
}

function renderData(data) {
  data.sort((a, b) => {
    const empresaDiff = a.producto.empresa.localeCompare(b.producto.empresa);
    return empresaDiff !== 0 ? empresaDiff : 
           a.producto.marca.localeCompare(b.producto.marca) || 
           a.producto.descripcion.localeCompare(b.producto.descripcion);
  });

  let filaNumero = 1;
  tableContent.innerHTML = data.map(productData => 
    createTableBody(productData, filaNumero++)
  ).join("");

  initializePopovers();
}

function createCombinedData(key, value, metadata, sharedByUserId) {
  return {
    id: key,
    ...value,
    sharedByEmail: metadata.sharedByEmail,
    sharedBy: sharedByUserId,
    sharedAt: metadata.sharedAt,
    expiresAt: metadata.expiresAt
  };
}

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      console.log("Usuario autenticado:", user.email);
      await initializeUserSession(user);
    } else {
      console.error("Usuario no autenticado.");
    }
  });
});

window.addEventListener("refreshTable", (e) => {
  currentSearchQuery = e.detail?.searchQuery || "";
  if (currentSearchQuery) {
    document.getElementById("searchInput").value = currentSearchQuery;
    document.getElementById("searchButton").click();
  }
});

async function initializeUserSession(user) {
  if (!document.getElementById("tableContent")) {
    console.error("Contenedor de tabla no encontrado");
    return;
  }

  renderTableHeaders(tableHeadersElement);
  const { updatePagination } = initializePagination("tableContent", 10);

  mostrarDatos(() => updatePagination());

  const searchRetryLimit = 10;
  let retryCount = 0;

  const checkSearchElements = setInterval(() => {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");

    if (searchInput && searchButton) {
      clearInterval(checkSearchElements);
      initializeSearchProduct();
    } else if (++retryCount >= searchRetryLimit) {
      clearInterval(checkSearchElements);
      window.location.reload();
    }
  }, 1000);

  initializeDuplicateProductRow();
  setupInstallPrompt("installButton");
  initializeDeleteHandlers();

  try {
    const email = await getUserEmail();
    if (email) await autoDeleteExpiredShares(email);
  } catch (error) {
    console.error("Error en limpieza automática:", error);
  }
}