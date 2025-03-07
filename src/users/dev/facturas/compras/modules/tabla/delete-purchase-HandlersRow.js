import { ref, remove } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database } from "../../../../../../../environment/firebaseConfig.js";
import { getUserEmail } from "../../../../../../modules/accessControl/getUserEmail.js";
import { showConfirmModal } from "../../../../../../components/confirmation-modal/confirmModal.js";
import { showToast } from "../../../../../../components/toast/toastLoader.js";
import { currentSearchQuery } from "./search-purchase.js";

export function initializeDeleteHandlers() {
  document.addEventListener("click", async (e) => {
    const deletePurchaseButton = e.target.closest(".delete-purchase-button");
    if (deletePurchaseButton) {
      const purchaseId = deletePurchaseButton.dataset.id;

      showConfirmModal(
        "¿Estás seguro de que deseas eliminar esta factura?",
        async () => {
          try {
            const email = await getUserEmail();
            if (!email) {
              showToast("No se pudo obtener el correo del usuario.", "error");
              return;
            }

            const userEmailKey = email.replaceAll(".", "_");
            const purchaseRef = ref(database, `users/${userEmailKey}/recordData/purchaseData/${purchaseId}`);
            await remove(purchaseRef);

            showToast("Factura eliminada con éxito.", "success");

            // Disparar evento con la consulta de búsqueda actual
            window.dispatchEvent(new CustomEvent("refreshTable", { 
              detail: { searchQuery: currentSearchQuery } 
            }));
          } catch (error) {
            console.error("Error al eliminar la factura:", error);
            showToast("Hubo un error al eliminar la factura.", "error");
          }
        },
        () => {
          showToast("Eliminación cancelada.", "info");
        }
      );
    }
  });
}