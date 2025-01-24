// register-product-modal.js
import { initializeRegisterPurchase } from "./register-purchase.js";
import { initializeEditPurchase } from "./edit-purchase.js";

// Función genérica para cargar modales
function loadModal(htmlPath, containerId, initializeCallback) {
  fetch(htmlPath)
    .then((response) => response.text())
    .then((html) => {
      const modalContainer = document.getElementById(containerId);
      if (!modalContainer) {
        console.error(`No se encontró el contenedor con ID: ${containerId}`);
        return;
      }
      modalContainer.innerHTML = html;
      initializeCallback(); // Llamar a la función de inicialización específica
    })
    .catch((error) => console.error(`Error al cargar el modal desde ${htmlPath}:`, error));
}

document.addEventListener("DOMContentLoaded", () => {
  // Cargar y inicializar modales
  loadModal(
    "./components/modal/register-purchase-modal.html",
    "register-purchase-modal-container",
    initializeRegisterPurchase
  );

  loadModal(
    "./components/modal/edit-purchase-modal.html",
    "edit-purchase-modal-container",
    initializeEditPurchase
  );
});
