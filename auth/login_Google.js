import { signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { auth } from "../environment/firebaseConfig.js";
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

        // #1. Redirigir a home.html después de inicio de sesión exitoso
        setTimeout(() => {
            // Base URL para gestionar rutas dependiendo del entorno (local o GitHub Pages)

            // #1
            // https://tianshop.github.io/app/login
            // const baseUrl = window.location.origin.includes("github.io") ? "/app" : ""

            // #2
            // https://tianlehou.github.io/tianshop/login
            const baseUrl = window.location.origin.includes("github.io") ? "/tianshop" : "";

            window.location.href = `${baseUrl}/src/users/dev/pages/home.html`;
        }, 1500);
        // Muestra un mensaje de bienvenida al usuario
        showToast(`Bienvenido, ${user.displayName}!`);

        // #2. Redirige al usuario a la página de inicio
        // window.location.href = "https://tianlehou.github.io/tianshop/src/users/dev/pages/home.html";

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