import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { ref, get, child } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { auth, database } from "../../environment/firebaseConfig.js";

// Función para obtener el correo del usuario autenticado
export function getUserEmail() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const uid = user.uid;

                try {
                    // Consultar el correo del usuario en la base de datos usando su UID como clave
                    const userSnapshot = await get(child(ref(database), `users/${uid}`));
                    if (userSnapshot.exists()) {
                        const email = userSnapshot.val().email;
                        resolve(email); // Resuelve la promesa con el correo del usuario
                    } else {
                        reject("No se encontró información para este usuario.");
                    }
                } catch (error) {
                    reject(error); // Rechaza la promesa si hay un error en la consulta
                }
            } else {
                reject("No hay usuario autenticado.");
            }
        });
    });
}
