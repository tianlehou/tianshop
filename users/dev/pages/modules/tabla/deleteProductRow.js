import { ref, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database, auth } from "../../../../../environment/firebaseConfig.js";
import { showToast } from "../../components/toast/toastLoader.js";

export function initializeDeleteProductRow() {
  // Delegar el evento para manejar clics en botones de eliminar
  document.addEventListener("click", async (e) => {
    const deleteButton = e.target.closest(".delete-product-button");
    if (!deleteButton) return;

    const productId = deleteButton.dataset.id; // Obtener el ID del producto a eliminar

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showToast("Debes iniciar sesión para eliminar un producto.", "error");
        return;
      }

      const userId = currentUser.uid;

      // Referencia al producto a eliminar en la base de datos
      const productRef = ref(database, `users/${userId}/productData/${productId}`);

      // Eliminar el producto
      await remove(productRef);

      // Eliminar la fila correspondiente en la tabla
      const row = deleteButton.closest("tr");
      if (row) {
        row.remove();
      }

      showToast("Producto eliminado con éxito.", "success");
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      showToast("Hubo un error al eliminar el producto.", "error");
    }
  });
}
