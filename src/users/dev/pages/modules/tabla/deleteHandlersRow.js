import { ref, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database } from "../../../../../../environment/firebaseConfig.js";
import { showToast } from "../../components/toast/toastLoader.js";
import { getUserEmail } from "../../../../../modules/accessControl/getUserEmail.js";

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
      const currentSearchQuery = document.getElementById("searchInput")?.value || "";
      
      // Construir ruta de referencia
      const userEmailKey = email.replaceAll(".", "_");
      const refPath = isShared 
        ? `users/${userEmailKey}/shared/data/${sharedByUser}/productData/${productId}`
        : `users/${userEmailKey}/productData/${productId}`;

      // Eliminar de Firebase
      await remove(ref(database, refPath));

      // Mostrar feedback
      showToast(
        `Producto ${isShared ? "compartido " : ""}eliminado correctamente.`,
        "success"
      );

      // Disparar evento de actualización controlada
      window.dispatchEvent(new CustomEvent("refreshTable", {
        detail: {
          searchQuery: currentSearchQuery,
          action: "delete",
          source: "userAction" // Identificar que viene de una acción manual
        }
      }));

    } catch (error) {
      console.error("Error en eliminación:", {
        code: error.code,
        message: error.message
      });
      showToast(`Error al eliminar: ${error.message}`, "error");
    }
  });
}