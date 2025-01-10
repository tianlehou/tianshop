
function loadGroupButtonsComponent() {
    // Cargar el HTML
    fetch('./components/buttons/group-buttons/group-buttons.html')
        .then(response => response.text())
        .then(html => {
            const container = document.getElementById('group-buttons-container');
            container.innerHTML = html;

            // Cargar el CSS dinámicamente
            const cssPath = './components/buttons/group-buttons/group-buttons.css';
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            document.head.appendChild(link);
        })
        .catch(error => console.error('Error cargando el componente:', error));
}

// Llamar la función para cargar el componente
loadGroupButtonsComponent();
