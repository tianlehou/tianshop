// register-product-modal.js
import { initializeRegisterAndSaveProduct } from "./register-product.js";
import { initializeEditProductModal } from "./edit-product.js";

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
    "./components/modal/register-product-modal.html",
    "register-product-modal-container",
    initializeRegisterAndSaveProduct
  );

  loadModal(
    "./components/modal/edit-product-modal.html",
    "edit-product-modal-container",
    initializeEditProductModal
  );
});
