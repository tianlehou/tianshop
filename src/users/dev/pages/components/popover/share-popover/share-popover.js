import { shareDataWithUser } from "../../../modules/share-data.js";
import { showToast } from "../../toast/toastLoader.js";

function loadSharePopover() {
  fetch('./components/popover/share-popover/share-popover.html')
    .then((response) => response.text())
    .then((html) => {
      const sharePopoverContainer = document.getElementById('share-popover-container');
      sharePopoverContainer.innerHTML = html;
      initializePopovers();
    });
}

function initializePopovers() {
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  const popoverList = popoverTriggerList.map((popoverTriggerEl) => {
    return new bootstrap.Popover(popoverTriggerEl, {
      trigger: 'focus',
      sanitize: false,
    });
  });
}

// Función para calcular la fecha de expiración
function calculateExpiration(durationInDays) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + durationInDays);

  return new Intl.DateTimeFormat('es-PA', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Panama',
  }).format(expirationDate);
}

// Escuchar eventos en el documento
document.addEventListener('click', async (event) => {
  if (event.target && event.target.id === 'sendEmailButton') {
    const emailInput = document.querySelector('#targetEmailPopover');
    const targetEmail = emailInput?.value.trim();

    if (!targetEmail) {
      showToast("Por favor, ingresa un correo electrónico válido.", "error");
      return;
    }

    // Capturar la duración seleccionada
    const selectedDuration = document.querySelector('input[name="shareDuration"]:checked');
    if (!selectedDuration) {
      showToast("Por favor, selecciona un tiempo de compartido.", "error");
      return;
    }

    const durationInDays = parseInt(selectedDuration.value, 10); // Convertir a número
    const expirationDate = calculateExpiration(durationInDays);

    try {
      // Compartir los datos con la duración
      await shareDataWithUser(targetEmail, expirationDate);

      emailInput.value = '';
      showToast("Datos compartidos exitosamente.", "success");

      const popoverElement = document.querySelector('[data-bs-toggle="popover"]');
      if (popoverElement) {
        const popoverInstance = bootstrap.Popover.getInstance(popoverElement);
        if (popoverInstance) {
          popoverInstance.hide();
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
