import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { ref, get, child } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { auth, database } from "../../../environment/firebaseConfig.js";

// Función para obtener el correo del usuario autenticado
export function getUserEmail() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Directamente tomamos el correo del usuario autenticado desde `auth`
                const email = user.email;
                if (email) {
                    resolve(email); // Resuelve la promesa con el correo del usuario
                } else {
                    reject("No se pudo obtener el correo del usuario autenticado.");
                }
            } else {
                reject("No hay usuario autenticado.");
            }
        });
    });
}
