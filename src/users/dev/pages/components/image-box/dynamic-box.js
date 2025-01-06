import { initializeScanner, stopScanning } from "./scanner/scanner.js";

document.addEventListener('DOMContentLoaded', async () => {
    const dynamicContent = document.getElementById('dynamic-content');
    const buttonContainer = document.getElementById('scan-button-container');

    if (!dynamicContent || !buttonContainer) {
        console.error('Los contenedores dinámicos no se encontraron');
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

    // Inicialmente cargar los botones y el carrusel
    await loadHTML('./components/image-box/scanner-button/scanner-button.html', buttonContainer);
    await loadHTML('./components/image-box/carrucel/carrucel.html', dynamicContent);

    // Agregar eventos a los botones
    function setupButtonEvents() {
        const startScanButton = document.getElementById('start-scan');
        const stopScanButton = document.getElementById('stop-scan');

        if (!startScanButton || !stopScanButton) {
            console.error('Botones de escaneo no encontrados.');
            return;
        }

        // Mostrar el escáner y ocultar el carrusel
        startScanButton.addEventListener('click', async () => {
            await loadHTML('./components/image-box/scanner/scanner.html', dynamicContent);

            // Esperar a que el DOM cargado esté listo antes de inicializar el escáner
            setTimeout(() => {
                initializeScanner();
            }, 0);

            startScanButton.classList.add('hide');
            stopScanButton.classList.remove('hide');
        });

        // Mostrar el carrusel y ocultar el escáner
        stopScanButton.addEventListener('click', async () => {
            stopScanning(); // Detener la cámara y Quagga
            await loadHTML('./components/image-box/carrucel/carrucel.html', dynamicContent);
            stopScanButton.classList.add('hide');
            startScanButton.classList.remove('hide');
        });
    }

    // Configurar eventos después de cargar los botones
    setupButtonEvents();
});
