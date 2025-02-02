// search-component.js
function loadSearchComponent() {
    fetch('./components/nav-header/search/search-component.html')
        .then(response => response.text())
        .then(html => {
            const searchContainer = document.getElementById('search-container');
            if (!searchContainer) return;

            searchContainer.innerHTML = html;

            const searchInput = document.getElementById("searchInput");
            const clearButton = document.getElementById("clearInputButton");
            const recentSearchesContainer = document.getElementById("recentSearches");

            // Función para mostrar u ocultar el botón de limpiar
            const updateClearButtonVisibility = () => {
                if (clearButton) {
                    clearButton.style.visibility = searchInput.value.trim() !== "" ? "visible" : "hidden";
                }
            };

            // Inicialmente, ocultar el botón clear si el input está vacío
            if (clearButton && searchInput) {
                updateClearButtonVisibility();
            }

            // Mostrar u ocultar el botón según el valor del input
            if (searchInput) {
                searchInput.addEventListener("input", updateClearButtonVisibility);
                searchInput.addEventListener("change", updateClearButtonVisibility);
            }

            // Limpiar el input al hacer clic en el botón clear
            if (clearButton) {
                clearButton.addEventListener("click", () => {
                    if (searchInput) {
                        searchInput.value = ""; // Limpia el input
                        searchInput.focus(); // Devuelve el foco al input
                        if (recentSearchesContainer) {
                            recentSearchesContainer.classList.add("hidden"); // Cierra la lista de búsquedas
                        }
                    }
                    if (clearButton) {
                        clearButton.style.visibility = "hidden"; // Oculta el botón clear
                    }
                });
            }

            // Mostrar botón cuando se selecciona una búsqueda reciente
            document.addEventListener("click", (e) => {
                if (e.target.classList.contains("recent-search-item")) {
                    updateClearButtonVisibility();
                }
            });

            // Ajustar el tamaño del input dinámicamente
            const updateInputWidth = () => {
                if (searchInput) {
                    const screenWidth = window.innerWidth;
                    const minWidth = 180; // Tamaño mínimo del input
                    const maxWidth = 400; // Tamaño máximo del input
                    const baseWidth = 180; // Tamaño base del input
                    const scaleFactor = 0.5; // Factor de escalado

                    // Calcular el nuevo ancho
                    let newWidth = baseWidth + (screenWidth - 400) * scaleFactor;
                    newWidth = Math.min(Math.max(newWidth, minWidth), maxWidth); // Restringir entre minWidth y maxWidth
                    searchInput.style.width = `${newWidth}px`;
                }
            };

            // Llamar a la función al cargar la página y en cada cambio de tamaño
            updateInputWidth();
            window.addEventListener('resize', updateInputWidth);
        })
        .catch(error => {
            console.error("Error loading search component:", error);
        });
}

// Cargar el componente al iniciar
loadSearchComponent();
