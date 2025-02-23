// action-popover.js
import { setTableMode } from "../../../modules/tabla/createTableElements.js";
import { initializePagination } from "../../pagination/pagination.js";

const { updatePagination } = initializePagination("tableContent", 10);  // Paginación con 10 items/página
const modeButtonMap = { "mode-full-button": "full", "mode-buy-button": "buy", "mode-sell-button": "sell" };

// Función auxiliar para manejar el cambio de modo
function handleModeChange(mode, tableHeadersElement, tableBodyElement, productDataArray, popover) {
  setTableMode(mode, tableHeadersElement, tableBodyElement, productDataArray, () => {
    updatePagination();  // Actualiza la paginación después de cambiar el modo
  });
  popover.hide();  // Oculta el popover
}

export function initializePopovers(tableHeadersElement, tableBodyElement, productDataArray) {
  // Asegurarnos que Bootstrap está disponible
  if (typeof bootstrap === "undefined") {
    console.error("Bootstrap no está cargado");
    return;
  }

  // Destruir popovers existentes antes de reinicializarlos
  const existingPopovers = document.querySelectorAll('[data-bs-toggle="popover"]');
  existingPopovers.forEach((el) => {
    const popover = bootstrap.Popover.getInstance(el);
    if (popover) {
      popover.dispose();
    }
  });

  let currentOpenPopover = null;

  // Inicializar nuevos popovers
  const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
  const popoverList = [...popoverTriggerList].map((popoverTriggerEl) => {
    const popover = new bootstrap.Popover(popoverTriggerEl, {
      trigger: "click",
      placement: "right",
      html: true,
      sanitize: false,
    });

    // Evento al mostrar el popover
    popoverTriggerEl.addEventListener("show.bs.popover", () => {
      if (currentOpenPopover && currentOpenPopover !== popover) {
        currentOpenPopover.hide();
      }
      currentOpenPopover = popover;
    });

    // Evento para manejar botones dentro del popover
    popoverTriggerEl.addEventListener("shown.bs.popover", () => {
      const popoverElement = document.querySelector(".popover");
      if (popoverElement) {
        popoverElement.addEventListener("click", (e) => {
          const mode = Object.keys(modeButtonMap).find((className) =>
            e.target.classList.contains(className)
          );

          if (mode) {
            handleModeChange(modeButtonMap[mode], tableHeadersElement, tableBodyElement, productDataArray, popover);
          } else if (
            e.target.classList.contains("edit-product-button") ||
            e.target.classList.contains("delete-product-button") ||
            e.target.classList.contains("duplicate-product-button") ||
            e.target.classList.contains("delete-shared-button")
          ) {
            popover.hide();
            currentOpenPopover = null;
          }
        });
      }
    });

    return popover;
  });

  // Cerrar popovers al hacer clic fuera
  document.addEventListener("click", (e) => {
    if (
      !e.target.hasAttribute("data-bs-toggle") &&
      !e.target.closest('[data-bs-toggle="popover"]') &&
      !e.target.closest(".popover")
    ) {
      if (currentOpenPopover) {
        currentOpenPopover.hide();
        currentOpenPopover = null;
      }
    }
  });

  return popoverList;
}