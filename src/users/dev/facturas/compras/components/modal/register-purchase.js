import { auth, database } from "../../../../../../../environment/firebaseConfig.js";
import { ref, push, get, child } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { showToast } from "../toast/toastLoader.js";

export function initializeRegisterPurchase() {
  const modalForm = document.getElementById("registerPurchaseForm");
  if (!modalForm) {
    console.error("No se encontró el formulario del modal.");
    return;
  }

  // Obtener elementos del formulario
  const venta = document.getElementById("venta");
  const costo = document.getElementById("costo");
  const unidades = document.getElementById("unidades");
  const fecha = document.getElementById("fecha");
  const empresa = document.getElementById("empresa");
  const marca = document.getElementById("marca");
  const descripcion = document.getElementById("descripcion");

  // Manejo del envío del formulario
  modalForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!fecha.value || !empresa.value.trim() || !marca.value.trim() || !descripcion.value.trim() || 
        isNaN(parseFloat(venta.value)) || isNaN(parseFloat(costo.value)) || isNaN(parseInt(unidades.value, 10))) {
      showToast("Por favor, completa todos los campos obligatorios.", "error");
      return;
    }

    const purchaseData = {
      fecha: fecha.value,
      producto: {
        empresa: empresa.value.trim(),
        marca: marca.value.trim(),
        descripcion: descripcion.value.trim(),
      },
      precio: {
        venta: parseFloat(venta.value).toFixed(2),
        costo: parseFloat(costo.value).toFixed(2),
        unidades: parseInt(unidades.value, 10),
      },
    };

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showToast("Debes iniciar sesión para registrar una factura de compra.", "error");
        return;
      }

      const userId = currentUser.uid;
      const dbRef = ref(database);
      const userSnapshot = await get(child(dbRef, `users/${userId}`));

      if (!userSnapshot.exists()) {
        showToast("Usuario no encontrado en la base de datos.", "error");
        return;
      }

      const userPurchaseRef = ref(database, `users/${userId}/recordData/purchaseData`);
      await push(userPurchaseRef, purchaseData);

      showToast("Factura registrado con éxito.", "success");
      modalForm.reset();

      const modalElement = document.getElementById("registerPurchaseModal");
      const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
      bootstrapModal.hide();
    } catch (error) {
      console.error("Error al guardar los datos:", error);
      showToast("Hubo un error al registrar la factura de compra.", "error");
    }
  });
}
