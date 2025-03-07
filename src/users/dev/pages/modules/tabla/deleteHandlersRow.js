import { database } from "../../../../../../environment/firebaseConfig.js";
import { ref, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getUserEmail } from "../../../../../modules/accessControl/getUserEmail.js";
import { showConfirmModal } from "../../../../../components/confirmation-modal/confirmModal.js";
import { showToast } from "../../../../../components/toast/toastLoader.js";

export function initializeDeleteHandlers() {
  document.addEventListener("click", async (e) => {
    const deleteButton = e.target.closest(".delete-product-button, .delete-shared-button");
    if (!deleteButton) return;

    try {
      const email = await getUserEmail();
      if (!email) {
        showToast("Debes iniciar sesión para realizar esta acción.", "error");
        return;
      }

      // Obtener parámetros necesarios
      const productId = deleteButton.dataset.id;
      const sharedByUser = deleteButton.dataset.sharedBy;
      const isShared = deleteButton.classList.contains("delete-shared-button");

      // Construir ruta de referencia
      const userEmailKey = email.replaceAll(".", "_");
      const refPath = isShared 
        ? `users/${userEmailKey}/shared/data/${sharedByUser}/productData/${productId}`
        : `users/${userEmailKey}/productData/${productId}`;

      // Mostrar el modal de confirmación
      showConfirmModal(
        "¿Estás seguro de que deseas eliminar este registro?", // Mensaje del modal
        async () => {
          // Acción al confirmar
          await remove(ref(database, refPath));
          showToast(`Producto ${isShared ? "compartido " : ""}eliminado correctamente.`, "success");
          window.dispatchEvent(new CustomEvent("refreshTable"));
        },
        () => {
          // Acción al cancelar (opcional)
          showToast("Eliminación cancelada.", "info");
        }
      );

    } catch (error) {
      console.error("Error en eliminación:", {
        code: error.code,
        message: error.message
      });
      showToast(`Error al eliminar: ${error.message}`, "error");
    }
  });
}