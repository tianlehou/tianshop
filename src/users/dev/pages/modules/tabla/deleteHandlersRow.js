import { ref, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database } from "../../../../../../environment/firebaseConfig.js";
import { showToast } from "../../components/toast/toastLoader.js";
import { getUserEmail } from "../../../../../modules/accessControl/getUserEmail.js";

export function initializeDeleteHandlers() {
  document.addEventListener("click", async (e) => {
    // Manejar el botón de eliminar producto
    const deleteProductButton = e.target.closest(".delete-product-button");
    if (deleteProductButton) {
      const productId = deleteProductButton.dataset.id;
      try {
        const email = await getUserEmail();
        if (!email) {
          showToast("Debes iniciar sesión para eliminar un producto.", "error");
          return;
        }

        // Ajustar la ruta para incluir el correo del usuario
        const productRef = ref(database, `users/${email.replaceAll(".", "_")}/productData/${productId}`);
        await remove(productRef);

        const row = deleteProductButton.closest("tr");
        if (row) {
          row.remove();
        }

        showToast("Producto eliminado con éxito.", "success");
      } catch (error) {
        console.error("Error al eliminar el producto:", error);
        showToast("Hubo un error al eliminar el producto.", "error");
      }
    }

    // Manejar el botón de eliminar información compartida
    const deleteSharedButton = e.target.closest(".delete-shared-button");
    if (deleteSharedButton) {
      const sharedByUserId = deleteSharedButton.dataset.sharedBy;
      const productId = deleteSharedButton.dataset.id;
      try {
        const email = await getUserEmail();
        if (!email) {
          showToast("Debes iniciar sesión para eliminar información compartida.", "error");
          return;
        }

        // Ajustar la ruta para incluir el correo del usuario
        const productRef = ref(database, `users/${email.replaceAll(".", "_")}/sharedData/${sharedByUserId}/productData/${productId}`);
        
        console.log(`Intentando eliminar nodo en la ruta: users/${email.replaceAll(".", "_")}/sharedData/${sharedByUserId}/productData/${productId}`);

        // Eliminar el producto compartido
        await remove(productRef);

        // Eliminar la fila de la tabla
        const row = deleteSharedButton.closest("tr");
        if (row) {
          row.remove();
        }

        showToast("Producto compartido eliminado con éxito.", "success");
      } catch (error) {
        console.error("Error al eliminar el producto compartido:", error);
        showToast("Hubo un error al eliminar el producto compartido.", "error");
      }
    }
  });
}
