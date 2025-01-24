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
        </div>
        
        <style>
          .toast {
            position: fixed;
            top: 1rem;
            right: 1rem;
            padding: 1rem;
            z-index: 9999;
            border-radius: 0.25rem;
            box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.1);
            display: none;
          }

          .toast.show {
            display: block;
            animation: fadeIn 0.5s ease-in-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

/* Estilo para cada tipo de toast */
          .toast-success {
            background-color: #198754;
            color: #fff;
          }

          .toast-error {
            background-color: #dc3545;
            color: #fff;
          }

          .toast-info {
            background-color: #0d6efd;
            color: #fff;
          }

          .toast-default {
            background-color: #6c757d;
            color: #fff;
          }

          .toast .btn-close {
            color: #fff;
            opacity: 0.75;
          }
        </style>`;
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