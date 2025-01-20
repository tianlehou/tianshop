export function initializePopovers() {
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
  
    // Variable para mantener referencia al popover actualmente abierto
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
        // Si hay un popover abierto y es diferente al que se va a abrir
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
            if (
              e.target.classList.contains("edit-purchase-button") ||
              e.target.classList.contains("delete-purchase-button")
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
  