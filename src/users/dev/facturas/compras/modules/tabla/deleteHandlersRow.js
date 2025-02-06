import { ref, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database } from "../../../../../../../environment/firebaseConfig.js";
import { getUserEmail } from "../../../../../../modules/accessControl/getUserEmail.js";
import { showToast } from "../../components/toast/toastLoader.js";

export function initializeDeleteHandlers() {
  document.addEventListener("click", async (e) => {
    // Manejar el botón de eliminar producto
    const deletePurchaseButton = e.target.closest(".delete-purchase-button");
    if (deletePurchaseButton) {
      const purchaseId = deletePurchaseButton.dataset.id;
      try {
        const email = await getUserEmail(); // Obtén el correo electrónico del usuario

        if (!email) {
          showToast("No se pudo obtener el correo del usuario.", "error");
          return;
        }
  
        // Guardar en la base de datos personal del usuario
        const userEmailKey = email.replaceAll(".", "_");
        const purchaseRef = ref(database, `users/${userEmailKey}/recordData/purchaseData/${purchaseId}`);
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
