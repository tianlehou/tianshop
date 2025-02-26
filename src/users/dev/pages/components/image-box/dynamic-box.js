// Dymamic-box.js
import { initializeMicHandler } from "./mic/micHandler.js";

document.addEventListener("DOMContentLoaded", async () => {
    const dynamicContent = document.getElementById("dynamic-content");
    const buttonContainer = document.getElementById("mic-button-container");

    if (!dynamicContent || !buttonContainer) {
        console.error("Los contenedores dinámicos no se encontraron");
        return;
    }

    // Función para cargar contenido HTML dinámico
    async function loadHTML(filePath, container) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`Error al cargar ${filePath}`);
            container.innerHTML = await response.text();
        } catch (error) {
            console.error(`Error al cargar el archivo: ${filePath}`, error);
        }
    }

    // Inicialmente cargar los botones de micrófono y el carrusel
    await loadHTML("./components/image-box/mic/mic-button.html", buttonContainer);
    await loadHTML("./components/image-box/carrucel/carrucel.html", dynamicContent);

    // Configurar eventos de micrófono pasando la función loadHTML como callback
    const setupMicEvents = initializeMicHandler(loadHTML);
    setupMicEvents();

    // Restaurar visibilidad de botones después de cargar contenido (si es necesario)
    function restoreButtonVisibility() {
        const startMicButton = document.getElementById("start-mic");
        const stopMicButton = document.getElementById("stop-mic");
        if (startMicButton) startMicButton.classList.remove("hide");
        if (stopMicButton) stopMicButton.classList.add("hide");
    }

    restoreButtonVisibility();
});