function loadNavHeaderComponent() {
    fetch('./components/nav-header/nav-header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al cargar nav-header.html: ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
        .then(html => {
            const navHeaderContainer = document.getElementById('nav-header-container');
            if (!navHeaderContainer) {
                throw new Error("No se encontró el contenedor 'nav-header-container' en el DOM.");
            }

            // Inserta el contenido del HTML
            navHeaderContainer.innerHTML = html;

            // Encuentra y ejecuta los scripts del archivo cargado
            const scripts = navHeaderContainer.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                if (script.type) newScript.type = script.type;
                if (script.src) {
                    // Si el script tiene src, se carga dinámicamente
                    newScript.src = script.src;
                } else {
                    // Si el script es inline, copia su contenido
                    newScript.textContent = script.textContent;
                }
                document.body.appendChild(newScript); // Asegura la ejecución del script
            });
        })
        .catch(error => console.error("Error al cargar el componente nav-header:", error));
}

loadNavHeaderComponent();
