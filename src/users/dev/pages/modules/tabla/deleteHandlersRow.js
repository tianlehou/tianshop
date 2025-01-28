// deleteHandlersRow.js
import { ref, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database } from "../../../../../../environment/firebaseConfig.js";
import { showToast } from "../../components/toast/toastLoader.js";
import { getUserEmail } from "../../../../../modules/accessControl/getUserEmail.js";

export function initializeDeleteHandlers() {
  document.addEventListener("click", async (e) => {
    try {
      // Obtener el botón clicado
      const deleteProductButton = e.target.closest(".delete-product-button");
      const deleteSharedButton = e.target.closest(".delete-shared-button");

      // Obtener correo del usuario actual
      const email = await getUserEmail();
      if (!email) {
        showToast("Debes iniciar sesión para realizar esta acción.", "error");
        return;
      }

      // Reemplazar puntos en el correo con guiones bajos para usarlo como clave
      const emailKey = email.replaceAll(".", "_");

      // Eliminar producto (propio)
      if (deleteProductButton) {
        const productId = deleteProductButton.dataset.id;
        if (!productId) {
          console.warn("ID de producto no encontrado.");
          return;
        }

        const productRef = ref(database, `users/${emailKey}/productData/${productId}`);
        await remove(productRef);

        const row = deleteProductButton.closest("tr");
        if (row) {
          row.remove();
        }

        showToast("Producto eliminado con éxito.", "success");
        return;
      }

      // Eliminar producto compartido
      if (deleteSharedButton) {
        const sharedByUser = deleteSharedButton.dataset.sharedBy;
        const productId = deleteSharedButton.dataset.id;

        if (!sharedByUser || !productId) {
          console.warn("Datos incompletos para eliminar información compartida.");
          return;
        }

        const sharedRef = ref(database, `users/${emailKey}/shared/data/${sharedByUser}/productData/${productId}`);
        console.log(`Intentando eliminar nodo en la ruta: users/${emailKey}/shared/data/${sharedByUser}/productData/${productId}`);

        await remove(sharedRef);

        const row = deleteSharedButton.closest("tr");
        if (row) {
          row.remove();
        }

        showToast("Producto compartido eliminado con éxito.", "success");
        return;
      }
    } catch (error) {
      console.error("Error al procesar la acción de eliminación:", error);
      showToast("Hubo un error al intentar eliminar el producto.", "error");
    }
  });
}
