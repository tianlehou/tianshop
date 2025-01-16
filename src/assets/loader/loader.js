export function loaderComponent() {
    // Ruta del archivo HTML y CSS
    const htmlPath = '../../../assets/loader/ui-loader.html';
    const cssPath = '../../../assets/loader/ui-loader.css';

    // Cargar el archivo HTML
    fetch(htmlPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al cargar el HTML: ${response.statusText}`);
            }
            return response.text();
        })
        .then(html => {
            const loaderContainer = document.getElementById('loader-container');
            if (!loaderContainer) {
                throw new Error("El contenedor 'loader-container' no existe en el DOM.");
            }
            loaderContainer.innerHTML = html;

            // Cargar el archivo CSS
            const linkElement = document.createElement('link');
            linkElement.rel = 'stylesheet';
            linkElement.href = cssPath;
            linkElement.onload = () => console.log('CSS cargado correctamente.');
            linkElement.onerror = () =>
                console.error(`Error al cargar el CSS desde ${cssPath}`);
            document.head.appendChild(linkElement);
        })
        .catch(error => console.error('Error al cargar el componente:', error));
}

loaderComponent();

// Mostrar el loader
export function showLoader() {
    const loader = document.getElementById("loader-container");
    if (loader) {
        loader.style.display = "flex";
    } else {
        console.warn("No se encontró el elemento con id 'loader'.");
    }
}

// Ocultar el loader
export function hideLoader() {
    const loader = document.getElementById("loader-container");
    if (loader) {
        loader.style.display = "none";
    } else {
        console.warn("No se encontró el elemento con id 'loader'.");
    }
}
