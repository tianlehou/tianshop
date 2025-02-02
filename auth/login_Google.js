import { signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { auth } from "../environment/firebaseConfig.js";

// Configura el proveedor de Google
const provider = new GoogleAuthProvider();

// Función para manejar el inicio de sesión con Google
async function handleGoogleLogin() {
    try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const user = result.user;

        console.log("Usuario autenticado:", user);

        // Redirige al usuario a la página de inicio
        window.location.href = "https://tianshop.github.io/app/src/users/dev/pages/home.html";
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;

        console.error("Error durante el inicio de sesión:", errorCode, errorMessage);

        // Muestra un mensaje de error al usuario
        alert(`Error durante el inicio de sesión: ${errorMessage}`);
    }
}

// Asigna el evento al botón de Google
const googleLoginBtn = document.getElementById("google-login-btn");
googleLoginBtn.addEventListener("click", handleGoogleLogin);