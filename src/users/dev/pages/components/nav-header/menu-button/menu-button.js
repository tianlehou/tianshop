import { auth } from "../../../../../../../environment/firebaseConfig.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

async function loadMenuComponent() {
    try {
        const response = await fetch("./components/nav-header/menu-button/menu-button.html");
        const data = await response.text();

        const menuContainer = document.getElementById("menu-container");
        if (!menuContainer) {
            console.error("No se encontró el contenedor del menú");
            return;
        }

        menuContainer.innerHTML = data;

        // Inicializa los dropdowns de Bootstrap si existen
        const dropdowns = document.querySelectorAll(".dropdown-toggle");
        if (dropdowns.length > 0) {
            dropdowns.forEach((dropdown) => new bootstrap.Dropdown(dropdown));
        }

        // Inicializa el evento de cierre de sesión
        initializeLogout();
    } catch (error) {
        console.error("Error al cargar el componente del menú:", error);
    }
}

function initializeLogout() {
    const logoutLink = document.querySelector("#logout");

    if (!logoutLink) {
        console.error("No se encontró el enlace de cierre de sesión");
        return;
    }

    logoutLink.addEventListener("click", async (e) => {
        e.preventDefault(); // Previene la recarga de la página

        try {
            await signOut(auth);
            console.log("Sesión cerrada");
            window.location.href = "../../../../login.html"; // Redirige a la página de login
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    });
}

// Carga el menú al inicio
loadMenuComponent();