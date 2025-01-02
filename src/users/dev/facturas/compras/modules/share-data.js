// share-data.js
import { auth, database } from "../../../../../../environment/firebaseConfig.js";
import { ref, get, set, child } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { showToast } from "../components/toast/toastLoader.js";

export async function shareDataWithUser(targetEmail) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showToast("Debes iniciar sesión para compartir datos.", "error");
      return;
    }

    console.log('Iniciando proceso de compartir datos');

    // Obtener usuarios
    const dbRef = ref(database);
    const usersSnapshot = await get(child(dbRef, "users"));
    
    if (!usersSnapshot.exists()) {
      console.log('No se encontraron usuarios');
      showToast("Error al buscar usuarios.", "error");
      return;
    }

    // Buscar usuario destino
    let targetUserId = null;
    const users = usersSnapshot.val();
    
    for (const [uid, userData] of Object.entries(users)) {
      if (userData.email === targetEmail) {
        targetUserId = uid;
        break;
      }
    }

    if (!targetUserId) {
      console.log('Usuario destino no encontrado');
      showToast("Usuario no encontrado.", "error");
      return;
    }

    console.log('Usuario destino encontrado:', targetUserId);

    // Obtener datos a compartir
    const myDataRef = ref(database, `users/${currentUser.uid}/productData`);
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
        sharedBy: currentUser.uid,
        sharedByEmail: currentUser.email,
        sharedAt: new Intl.DateTimeFormat('es-PA', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/Panama'
        }).format(new Date())
      }
    };

    // Intentar actualizar directamente
    try {
      // Primero, crear el nodo sharedData si no existe
      await set(ref(database, `users/${targetUserId}/sharedData`), {
        [currentUser.uid]: sharedContent
      });

      console.log('Datos compartidos exitosamente');
      showToast(`Datos compartidos exitosamente con ${targetEmail}`, "success");
    } catch (writeError) {
      console.error('Error al escribir:', writeError);
      
      // Intentar método alternativo si el primero falla
      try {
        await set(ref(database, `users/${targetUserId}/sharedData/${currentUser.uid}`), sharedContent);
        console.log('Datos compartidos exitosamente (método alternativo)');
        showToast(`Datos compartidos exitosamente con ${targetEmail}`, "success");
      } catch (altError) {
        console.error('Error en método alternativo:', altError);
        throw altError;
      }
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
