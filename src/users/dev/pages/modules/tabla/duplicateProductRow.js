import { getUserEmail } from "../../../../../modules/accessControl/getUserEmail.js";
import { database } from "../../../../../../environment/firebaseConfig.js";
import { ref, get, push, set } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { showConfirmModal } from "../../../../../components/confirmation-modal/confirmModal.js";
import { showToast } from "../../../../../components/toast/toastLoader.js";

export function initializeDuplicateProductRow() {
  document.addEventListener("click", async (e) => {
    const duplicateButton = e.target.closest(".duplicate-product-button");
    if (!duplicateButton) return;

    const productId = duplicateButton.dataset.id;

    try {
      const email = await getUserEmail();
      if (!email) {
        showToast("No se pudo obtener el correo del usuario.", "error");
        return;
      }

      const userEmailKey = email.replaceAll(".", "_");
      const productRef = ref(database, `users/${userEmailKey}/productData/${productId}`);
      const snapshot = await get(productRef);

      if (!snapshot.exists()) {
        showToast("El producto no existe.", "error");
        return;
      }

      // Mostrar el modal de confirmación antes de duplicar
      showConfirmModal(
        "¿Estás seguro de que deseas duplicar este producto?", // Mensaje del modal
        async () => {
          // Acción al confirmar
          const productData = snapshot.val();
          const newProductId = push(ref(database, `users/${userEmailKey}/productData`)).key;

          // Crear copia profunda para evitar mutaciones
          const duplicatedProductData = JSON.parse(JSON.stringify({
            ...productData,
            id: newProductId,
            metadata: {
              ...productData.metadata,
              duplicadoEl: new Date().toISOString()
            }
          }));

          // Guardar en ambas ubicaciones
          await Promise.all([
            set(ref(database, `users/${userEmailKey}/productData/${newProductId}`), duplicatedProductData),
            set(ref(database, `global/productData/${newProductId}`), {
              ...duplicatedProductData,
              duplicadoPor: email
            })
          ]);

          showToast("Producto duplicado con éxito.", "success");

          // Disparar evento personalizado para refrescar la tabla
          window.dispatchEvent(new CustomEvent("refreshTable"));
        },
        () => {
          // Acción al cancelar (opcional)
          showToast("Duplicación cancelada.", "info");
        }
      );

    } catch (error) {
      console.error("Error al duplicar:", error);
      showToast(`Error al duplicar: ${error.message}`, "error");
    }
  });
}