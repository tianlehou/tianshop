import { ref, get, push, set } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database, auth } from "../../../../../environment/firebaseConfig.js";
import { showToast } from "../../components/toast/toastLoader.js";

export function initializeDuplicateProductRow() {
  // Delegar el evento para manejar clics en botones de duplicar
  document.addEventListener("click", async (e) => {
    const duplicateButton = e.target.closest(".duplicate-product-button");
    if (!duplicateButton) return;

    const productId = duplicateButton.dataset.id; // Obtener el ID del producto a duplicar

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showToast("Debes iniciar sesión para duplicar un producto.", "error");
        return;
      }

      const userId = currentUser.uid;

      // Leer los datos del producto original
      const productRef = ref(database, `users/${userId}/productData/${productId}`);
      const snapshot = await get(productRef);
      if (!snapshot.exists()) {
        showToast("El producto no existe.", "error");
        return;
      }

      const productData = snapshot.val();

      // Crear un nuevo ID para el producto duplicado
      const newProductId = push(ref(database, `users/${userId}/productData`)).key;

      // Guardar el producto duplicado
      const newProductRef = ref(database, `users/${userId}/productData/${newProductId}`);
      await set(newProductRef, {
        ...productData,
        id: newProductId, // Asignar nuevo ID
      });

      showToast("Producto duplicado con éxito.", "success");
    } catch (error) {
      console.error("Error al duplicar el producto:", error);
      showToast("Hubo un error al duplicar el producto.", "error");
    }
  });
}
