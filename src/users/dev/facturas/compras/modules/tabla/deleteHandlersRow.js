import { ref, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database, auth } from "../../../../../../../environment/firebaseConfig.js";
import { showToast } from "../../components/toast/toastLoader.js";

export function initializeDeleteHandlers() {
  document.addEventListener("click", async (e) => {
    // Manejar el botón de eliminar producto
    const deletePurchaseButton = e.target.closest(".delete-purchase-button");
    if (deletePurchaseButton) {
      const purchaseId = deletePurchaseButton.dataset.id;
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          showToast("Debes iniciar sesión para eliminar una factura.", "error");
          return;
        }

        const userId = currentUser.uid;
        const purchaseRef = ref(database, `users/${userId}/recordData/purchaseData/${purchaseId}`);
        await remove(purchaseRef);

        const row = deletePurchaseButton.closest("tr");
        if (row) {
          row.remove();
        }

        showToast("Factura eliminado con éxito.", "success");
      } catch (error) {
        console.error("Error al eliminar la factura:", error);
        showToast("Hubo un error al eliminar la factura.", "error");
      }
    }
  });
}
