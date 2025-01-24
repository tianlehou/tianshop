import { ref, get, push, set } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database, auth } from "../../../../../../environment/firebaseConfig.js";
import { showToast } from "../../components/toast/toastLoader.js";
import { getUserEmail } from "../../../../../modules/accessControl/getUserEmail.js";

export function initializeDuplicateProductRow() {
  // Delegar el evento para manejar clics en botones de duplicar
  document.addEventListener("click", async (e) => {
    const duplicateButton = e.target.closest(".duplicate-product-button");
    if (!duplicateButton) return;

    const productId = duplicateButton.dataset.id; // Obtener el ID del producto a duplicar

    try {
      // Obtener el correo del usuario autenticado
      const email = await getUserEmail();
      if (!email) {
        showToast("No se pudo obtener el correo del usuario.", "error");
        return;
      }

      // Leer los datos del producto original desde la base de datos personal
      const productRef = ref(database, `users/${email.replaceAll(".", "_")}/productData/${productId}`);
      const snapshot = await get(productRef);
      if (!snapshot.exists()) {
        showToast("El producto no existe.", "error");
        return;
      }

      const productData = snapshot.val();

      // Crear un nuevo ID para el producto duplicado
      const newProductId = push(ref(database, `users/${email.replaceAll(".", "_")}/productData`)).key;

      // Preparar los datos para el producto duplicado
      const duplicatedProductData = {
        ...productData,
        id: newProductId, // Asignar nuevo ID
      };

      // Guardar el producto duplicado a nivel personal
      const newUserProductRef = ref(database, `users/${email.replaceAll(".", "_")}/productData/${newProductId}`);
      await set(newUserProductRef, duplicatedProductData);

      // Guardar el producto duplicado a nivel global
      const newGlobalProductRef = ref(database, `global/productData/${newProductId}`);
      await set(newGlobalProductRef, {
        ...duplicatedProductData,
        duplicadoPor: email, // Registrar quién duplicó el producto
      });

      showToast("Producto duplicado con éxito.", "success");
    } catch (error) {
      console.error("Error al duplicar el producto:", error);
      showToast("Hubo un error al duplicar el producto.", "error");
    }
  });
}
