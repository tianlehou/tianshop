import { signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js"; // Importa ref y set
import { auth, database } from "../environment/firebaseConfig.js"; // Importa database
import { showToast } from "../src/modules/toast/toastLoader.js";

// Configura el proveedor de Google
const provider = new GoogleAuthProvider();

// Función para manejar el inicio de sesión con Google
async function handleGoogleLogin() {
    try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const user = result.user;

        console.log("Usuario autenticado:", user);

        // Prepara los datos del usuario para la base de datos
        const newUserData = {
            name: user.displayName, // Usa el nombre proporcionado por Google
            email: user.email // Usa el correo proporcionado por Google
        };

        // Reemplaza puntos por guiones bajos en el correo para usarlo como clave
        const emailKey = user.email.replace(/\./g, "_");

        // Guarda los datos del usuario en Firebase Realtime Database bajo la clave del correo
        const userRef = ref(database, `users/${emailKey}`);
        await set(userRef, newUserData);

        console.log("Datos del usuario guardados en la base de datos.");

        // Muestra un mensaje de bienvenida al usuario
        showToast(`¡Bienvenido, ${user.displayName}!`, "success");

        // Redirige al usuario a la página de inicio
        setTimeout(() => {
            // #1. https://tianshop.github.io/app/login
            // const baseUrl = window.location.origin.includes("github.io") ? "/app" : ""

            // #2. https://tianlehou.github.io/tianshop/login
            const baseUrl = window.location.origin.includes("github.io") ? "/tianshop" : "";
            window.location.href = `${baseUrl}/src/users/dev/pages/home.html`;
        }, 2500);

        
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;

        console.error("Error durante el inicio de sesión:", errorCode, errorMessage);

        // Muestra un mensaje de error al usuario
        showToast(`Error durante el inicio de sesión: ${errorMessage}`);
    }
}

// Asigna el evento al botón de Google
const googleLoginBtn = document.getElementById("google-login-btn");
googleLoginBtn.addEventListener("click", handleGoogleLogin);