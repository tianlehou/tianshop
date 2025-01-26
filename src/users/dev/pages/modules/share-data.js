// share-data.js
import { auth, database } from "../../../../../environment/firebaseConfig.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { showToast } from "../components/toast/toastLoader.js";

export async function shareDataWithUser(targetEmail, expirationDate) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showToast("Debes iniciar sesión para compartir datos.", "error");
      return;
    }

    console.log('Iniciando proceso de compartir datos');

    // Convertir correos a claves válidas
    const currentUserKey = currentUser.email.replaceAll(".", "_");
    const targetEmailKey = targetEmail.replaceAll(".", "_");

    // Verificar existencia del usuario destino
    const targetUserRef = ref(database, `users/${targetEmailKey}`);
    const targetUserSnapshot = await get(targetUserRef);

    if (!targetUserSnapshot.exists()) {
      console.log('Usuario destino no encontrado');
      showToast("Usuario no encontrado.", "error");
      return;
    }

    console.log('Usuario destino encontrado:', targetEmail);

    // Obtener datos a compartir
    const myDataRef = ref(database, `users/${currentUserKey}/productData`);
    const myDataSnapshot = await get(myDataRef);

    if (!myDataSnapshot.exists()) {
      console.log('No hay datos para compartir');
      showToast("No tienes datos para compartir.", "error");
      return;
    }

    // Preparar datos
    const sharedContent = {
      productData: myDataSnapshot.val(),
      metadata: {
        sharedByEmail: currentUser.email,
        sharedAt: new Intl.DateTimeFormat('es-PA', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/Panama'
        }).format(new Date()),
        expiresAt: expirationDate, // Fecha de expiración ya formateada
      }
    };

    try {
      await set(ref(database, `users/${targetEmailKey}/sharedData/${currentUserKey}`), sharedContent);

      console.log('Datos compartidos exitosamente');
      showToast(`Datos compartidos exitosamente con ${targetEmail}`, "success");
    } catch (writeError) {
      console.error('Error al escribir:', writeError);
      showToast("Hubo un error al compartir los datos.", "error");
    }

  } catch (error) {
    console.error("Error completo:", {
      code: error.code,
      message: error.message,
      fullError: error
    });
    showToast(`Error al compartir datos: ${error.message}`, "error");
  }
}
