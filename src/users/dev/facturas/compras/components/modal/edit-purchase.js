// edit-purchase.js
import { ref, get, update } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getUserEmail } from "../../../../../../modules/accessControl/getUserEmail.js";
import { database } from "../../../../../../../environment/firebaseConfig.js";
import { showConfirmModal } from "../../../../../../components/confirmation-modal/confirmModal.js";
import { showToast } from "../../../../../../components/toast/toastLoader.js";
import { formatInputAsDecimal } from "./utils/utils.js";

export function initializeEditPurchase() {
  const editPurchaseModal = document.getElementById("editPurchaseModal");
  const editPurchaseForm = document.getElementById("editPurchaseForm");

  if (!editPurchaseModal || !editPurchaseForm) {
    console.error("No se encontró el modal o el formulario para editar facturas de compra.");
    return;
  }

  let currentPurchaseId = null; // Declaración de currentPurchaseId

  // Elementos del formulario
  const fecha = editPurchaseForm.fecha;
  const estado = editPurchaseForm.estado;
  const empresa = editPurchaseForm.empresa;
  const monto = editPurchaseForm.monto;

  formatInputAsDecimal(monto);

  // Asignar valores iniciales al abrir el modal
  document.addEventListener("click", async (e) => {
    if (e.target.closest(".edit-purchase-button")) {
      const button = e.target.closest(".edit-purchase-button");
      currentPurchaseId = button.dataset.id; // Asignar valor a currentPurchaseId

      const email = await getUserEmail(); // Obtén el correo electrónico del usuario

      // Verificar que email sea una cadena de texto
      if (typeof email !== "string" || !email) {
        showToast("No se pudo obtener el correo del usuario.", "error");
        return;
      }

      // Guardar en la base de datos personal del usuario
      const userEmailKey = email.replaceAll(".", "_");
      const purchaseRef = ref(database, `users/${userEmailKey}/recordData/purchaseData/${currentPurchaseId}`);

      try {
        const snapshot = await get(purchaseRef);
        if (snapshot.exists()) {
          const purchaseData = snapshot.val();

          // Asignar valores al formulario
          fecha.value = purchaseData.fecha || "";
          estado.value = purchaseData.factura?.estado || "";
          empresa.value = purchaseData.factura?.empresa || "";
          monto.value = purchaseData.factura?.monto || "";
          
          new bootstrap.Modal(editPurchaseModal).show();
        }
      } catch (error) {
        console.error("Error al cargar factura:", error);
        showToast("Error al cargar datos de la factura", "error");
      }
    }
  });

  // Manejar envío del formulario
  editPurchaseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    showConfirmModal(
      "¿Confirmas la actualización de esta factura?",
      async () => {
        try {
          const email = await getUserEmail();
          if (!email) {
            showToast("Debes iniciar sesión para editar", "error");
            return;
          }

          const updatedData = {
            fecha: fecha.value,
            factura: {
              estado: estado.value.trim(),
              empresa: empresa.value.trim(),
              monto: parseFloat(monto.value.replace(/,/g, "")).toFixed(2)
            }
          };

          const userEmailKey = email.replaceAll(".", "_");
          const purchaseRef = ref(database, `users/${userEmailKey}/recordData/purchaseData/${currentPurchaseId}`);
          
          await update(purchaseRef, updatedData);
          showToast("Factura actualizada exitosamente", "success");
          
          // Cerrar modal y refrescar tabla manteniendo la búsqueda
          const modalInstance = bootstrap.Modal.getInstance(editPurchaseModal);
          if (modalInstance) modalInstance.hide();
          editPurchaseForm.reset();
          
          // Disparar evento para refrescar resultados
          window.dispatchEvent(new CustomEvent("refreshTable", { detail: { searchQuery: window.currentSearchQuery } }));

        } catch (error) {
          console.error("Error al actualizar:", error);
          showToast("Error al actualizar la factura", "error");
        }
      },
      () => showToast("Actualización cancelada", "info")
    );
  });
}