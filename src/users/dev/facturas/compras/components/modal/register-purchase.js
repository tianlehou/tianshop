import {
  auth,
  database,
} from "../../../../../../../environment/firebaseConfig.js";
import {
  ref,
  push,
  get,
  child,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { showToast } from "../toast/toastLoader.js";
import { setTodayDate, formatInputAsDecimal } from "./utils/utils.js"; // Ajusta la ruta según tu estructura de archivos

export function initializeRegisterPurchase() {
  const modalForm = document.getElementById("registerPurchaseForm");
  const modalElement = document.getElementById("registerPurchaseModal"); // El ID del modal
  if (!modalForm || !modalElement) {
    console.error(
      "No se encontró el formulario del modal o el elemento modal."
    );
    return;
  }

  // Obtener elementos del formulario
  const fecha = document.getElementById("fecha");
  const metodo = document.getElementById("metodo");
  const empresa = document.getElementById("empresa");
  const monto = document.getElementById("monto");

  // Establecer valores predeterminados
  setTodayDate(fecha); // Establece la fecha de hoy en el input de fecha
  metodo.value = "efectivo"; // Establece el valor por defecto del select a "efectivo"
  formatInputAsDecimal(monto);

  // Manejo del envío del formulario
  modalForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (
      !fecha.value ||
      !metodo.value.trim() ||
      !empresa.value.trim() ||
      isNaN(parseFloat(monto.value.replace(/,/g, "")))
    ) {
      showToast("Por favor, completa todos los campos obligatorios.", "error");
      return;
    }

    const purchaseData = {
      fecha: fecha.value,
      factura: {
        metodo: metodo.value.trim(),
        empresa: empresa.value.trim(),
        monto: new Intl.NumberFormat("en-US", {
          style: "decimal",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(parseFloat(monto.value.replace(/,/g, ""))),
      },
    };

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showToast(
          "Debes iniciar sesión para registrar una factura de compra.",
          "error"
        );
        return;
      }

      const userId = currentUser.uid;
      const dbRef = ref(database);
      const userSnapshot = await get(child(dbRef, `users/${userId}`));

      if (!userSnapshot.exists()) {
        showToast("Usuario no encontrado en la base de datos.", "error");
        return;
      }

      const userPurchaseRef = ref(
        database,
        `users/${userId}/recordData/purchaseData`
      );
      await push(userPurchaseRef, purchaseData);

      showToast("Factura registrada con éxito.", "success");

      // Cerrar el modal después de un registro exitoso
      const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
      if (bootstrapModal) {
        bootstrapModal.hide();
      }

      modalForm.reset();
      setTodayDate(fecha); // Restablecer la fecha al valor actual después de limpiar el formulario
      metodo.value = "efectivo"; // Restablecer el valor predeterminado del select
    } catch (error) {
      console.error("Error al guardar los datos:", error);
      showToast("Hubo un error al registrar la factura de compra.", "error");
    }
  });
}
