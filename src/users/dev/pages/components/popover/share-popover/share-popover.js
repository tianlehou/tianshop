import { shareDataWithUser } from "../../../modules/share-data.js";
import { showToast } from "../../toast/toastLoader.js";

// Cargar el HTML del popover
function loadSharePopover() {
  fetch('./components/popover/share-popover/share-popover.html')
    .then((response) => response.text())
    .then((html) => {
      const sharePopoverContainer = document.getElementById('share-popover-container');
      sharePopoverContainer.innerHTML = html;

      // Inicializar los popovers después de cargar el HTML
      initializePopovers();
    });
}

function initializePopovers() {
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  const popoverList = popoverTriggerList.map((popoverTriggerEl) => {
    return new bootstrap.Popover(popoverTriggerEl, {
      trigger: 'focus',
      sanitize: false, // Permite HTML dentro del contenido
    });
  });
}

// Escuchar eventos en el documento
document.addEventListener('click', async (event) => {
  if (event.target && event.target.id === 'sendEmailButton') {
    // Capturar el correo electrónico
    const emailInput = document.querySelector('#targetEmailPopover');
    const targetEmail = emailInput?.value.trim();

    if (!targetEmail) {
      showToast("Por favor, ingresa un correo electrónico válido.", "error");
      return;
    }

    // Llamar a la función para compartir datos
    try {
      await shareDataWithUser(targetEmail);
      emailInput.value = ''; // Limpiar el campo de entrada

      // Mostrar mensaje de éxito
      showToast("Datos compartidos exitosamente.", "success");

      // Cerrar el popover
      const popoverElement = document.querySelector('[data-bs-toggle="popover"]');
      if (popoverElement) {
        const popoverInstance = bootstrap.Popover.getInstance(popoverElement);
        if (popoverInstance) {
          popoverInstance.hide(); // Ocultar el popover
        }
      }
    } catch (error) {
      console.error("Error al compartir datos:", error);
      showToast("Hubo un error al compartir los datos. Intenta nuevamente.", "error");
    }
  }
});

// Cargar el popover al iniciar
loadSharePopover();
