// register-purchase.js
import { database } from "../../../../../../../environment/firebaseConfig.js";
import { ref, push, get, child } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getUserEmail } from "../../../../../../modules/accessControl/getUserEmail.js";
import { setTodayDate, formatInputAsDecimal } from "./utils/utils.js";
import { showToast } from "../../../../../../components/toast/toastLoader.js";

export function initializeRegisterPurchase() {
  const modalForm = document.getElementById("registerPurchaseForm");
  const modalElement = document.getElementById("registerPurchaseModal");
  if (!modalForm || !modalElement) {
    console.error(
      "No se encontró el formulario del modal o el elemento modal."
    );
    return;
  }

  // Obtener elementos del formulario
  const fecha = document.getElementById("fecha");
  const estado = document.getElementById("estado");
  const empresa = document.getElementById("empresa");
  const monto = document.getElementById("monto");

  // Función para reiniciar el formulario a su estado inicial
  const resetForm = () => {
    modalForm.reset();
    setTodayDate(fecha);
    estado.value = "Pagado";
    formatInputAsDecimal(monto);
  };

  // Establecer valores predeterminados al inicializar
  resetForm();

  // Manejo del envío del formulario
  modalForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (
      !fecha.value ||
      !estado.value.trim() ||
      !empresa.value.trim() ||
      isNaN(parseFloat(monto.value.replace(/,/g, "")))
    ) {
      showToast("Por favor, completa todos los campos obligatorios.", "error");
      return;
    }

    const purchaseData = {
      fecha: fecha.value,
      factura: {
        estado: estado.value.trim(),
        empresa: empresa.value.trim(),
        monto: new Intl.NumberFormat("en-US", {
          style: "decimal",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(parseFloat(monto.value.replace(/,/g, ""))),
      },
    };

    try {
      const email = await getUserEmail(); // Obtén el correo electrónico del usuario

      if (!email) {
        showToast("No se pudo obtener el correo del usuario.", "error");
        return;
      }

      // Guardar en la base de datos personal del usuario
      const userEmailKey = email.replaceAll(".", "_");
      const dbRef = ref(database);
      const userSnapshot = await get(child(dbRef, `users/${userEmailKey}`));

      if (!userSnapshot.exists()) {
        showToast("Usuario no encontrado en la base de datos.", "error");
        return;
      }

      const userPurchaseRef =
        ref(database, `users/${userEmailKey}/recordData/purchaseData`);
      await push(userPurchaseRef, purchaseData);

      showToast("Factura registrada con éxito.", "success");

      // Cerrar el modal después de un registro exitoso
      const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
      if (bootstrapModal) {
        bootstrapModal.hide();
      }
    } catch (error) {
      console.error("Error al guardar los datos:", error);
      showToast("Hubo un error al registrar la factura de compra.", "error");
    }
  });

  // Evento para reiniciar el formulario al cerrar el modal
  modalElement.addEventListener("hidden.bs.modal", () => {
    resetForm();
  });
}
