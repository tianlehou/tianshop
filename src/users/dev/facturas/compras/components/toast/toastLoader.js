// toastLoader.js
// Este componente no necesita introducir ningun contenedor en ningun archivo html.
// Solo necesita importar showToast.

function createToastContainer() {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    const toastHTML = `
        <div id="toast-container" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="toast-header">
            <strong class="me-auto">Notificación</strong>
          </div>
          <div class="toast-body">
            <span></span>
          </div>
        </div>`;
    document.body.insertAdjacentHTML("beforeend", toastHTML);
    toastContainer = document.getElementById("toast-container");
  }
  return toastContainer;
}

export function showToast(message, type) {
  const toastContainer = createToastContainer();
  const toastBody = toastContainer.querySelector(".toast-body span");

  toastBody.textContent = message;

  const toastClasses = {
    success: "toast-success",
    error: "toast-error",
    info: "toast-info",
  };

  // Limpia las clases previas antes de añadir la nueva
  toastContainer.className = `toast ${toastClasses[type] || "toast-default"}`;

  toastContainer.classList.add("show");

  setTimeout(() => {
    toastContainer.classList.remove("show");
  }, 3000);
}
