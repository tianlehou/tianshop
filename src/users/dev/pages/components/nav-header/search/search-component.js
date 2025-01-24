function loadSearchComponent() {
    fetch('./components/nav-header/search/search-component.html')
        .then(response => response.text())
        .then(html => {
            const modalContainer = document.getElementById('search-container');
            modalContainer.innerHTML = html;

            const searchInput = document.getElementById("searchInput");
            const clearButton = document.getElementById("clearInputButton");

            // Inicialmente, ocultar el botón clear
            clearButton.style.visibility = "hidden";

            // Mostrar u ocultar el botón según el valor del input
            searchInput.addEventListener("input", () => {
                if (searchInput.value.trim() !== "") {
                    clearButton.style.visibility = "visible";
                } else {
                    clearButton.style.visibility = "hidden";
                }
            });

            // Limpiar el input al hacer clic en el botón clear
            clearButton.addEventListener("click", () => {
                searchInput.value = ""; // Limpia el input
                clearButton.style.visibility = "hidden"; // Oculta el botón clear
                searchInput.focus(); // Devuelve el foco al input
            });

            // Ajustar el tamaño del input dinámicamente
            const updateInputWidth = () => {
                const screenWidth = window.innerWidth;
                let newWidth = 180 + (screenWidth - 400); // Aumentar 1px por cada 1px de aumento en pantalla
                newWidth = Math.min(Math.max(newWidth, 100), 400); // Restringir entre 180px y 500px
                searchInput.style.width = `${newWidth}px`;
            };

            // Llamar a la función al cargar la página y en cada cambio de tamaño
            updateInputWidth();
            window.addEventListener('resize', updateInputWidth);
        });
}

loadSearchComponent();
