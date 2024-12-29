export function initializePagination(tableBodyId, rowsPerPage) {
    const tableBody = document.getElementById(tableBodyId);
    const paginationContainer = document.getElementById("pagination-container");

    let currentPage = 1;
    let totalRows = 0;

    // Crear contenedor para la paginación y el dropdown
    const paginationWrapper = document.createElement("div");
    paginationWrapper.className = "display-flex-center";
    paginationContainer.parentNode.replaceChild(paginationWrapper, paginationContainer);
    paginationWrapper.appendChild(paginationContainer);

    // Crear dropdown para seleccionar filas por página
    const rowsPerPageContainer = document.createElement("div");
    rowsPerPageContainer.innerHTML = `
        <select id="rowsPerPageSelect" class="form-select" style="width: auto; display: inline-block;">
            <option value="5">5</option>
            <option value="10" selected>10</option>
            <option value="25">25</option>
            <option value="50">50</option>
        </select>
    `;
    rowsPerPageContainer.className = "display-flex-center";
    paginationWrapper.appendChild(rowsPerPageContainer);

    // Manejar cambio en el dropdown
    const rowsPerPageSelect = rowsPerPageContainer.querySelector("#rowsPerPageSelect");
    rowsPerPageSelect.addEventListener("change", (event) => {
        rowsPerPage = parseInt(event.target.value, 10); // Actualiza el número de filas por página
        currentPage = 1; // Reinicia a la primera página
        updateTable(); // Actualiza la tabla
    });

    function renderPaginationButtons() {
        paginationContainer.innerHTML = ""; // Limpiar botones previos

        const totalPages = Math.ceil(totalRows / rowsPerPage);
        const maxVisiblePages = 3;

        // Determinar el rango de páginas visibles
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Botón de Inicio
        const startButton = document.createElement("button");
        startButton.className = "btn custom-button mx-1 pagination-custom";
        startButton.innerHTML = '<i class="bi bi-chevron-double-left"></i>';
        startButton.disabled = currentPage === 1;
        startButton.addEventListener("click", () => {
            currentPage = 1;
            updateTable();
        });
        paginationContainer.appendChild(startButton);

        // Botón de Atrás
        const prevButton = document.createElement("button");
        prevButton.className = "btn custom-button mx-1 pagination-custom";
        prevButton.innerHTML = '<i class="bi bi-chevron-left"></i>';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                updateTable();
            }
        });
        paginationContainer.appendChild(prevButton);

        // Botones de páginas visibles
        for (let i = startPage; i <= endPage; i++) {
            const button = document.createElement("button");
            button.className = "btn custom-button mx-1 pagination-custom";
            button.textContent = i;

            button.addEventListener("click", () => {
                currentPage = i;
                updateTable();
            });

            if (i === currentPage) {
                button.classList.add("active");
            }

            paginationContainer.appendChild(button);
        }

        // Botón de Adelante
        const nextButton = document.createElement("button");
        nextButton.className = "btn custom-button mx-1 pagination-custom";
        nextButton.innerHTML = '<i class="bi bi-chevron-right"></i>';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++;
                updateTable();
            }
        });
        paginationContainer.appendChild(nextButton);

        // Botón de Final
        const endButton = document.createElement("button");
        endButton.className = "btn custom-button mx-1 pagination-custom";
        endButton.innerHTML = '<i class="bi bi-chevron-double-right"></i>';
        endButton.disabled = currentPage === totalPages;
        endButton.addEventListener("click", () => {
            currentPage = totalPages;
            updateTable();
        });
        paginationContainer.appendChild(endButton);
    }

    function updateTable() {
        const rows = Array.from(tableBody.children);
        totalRows = rows.length;

        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        rows.forEach((row, index) => {
            row.style.display = index >= start && index < end ? "" : "none";
        });

        renderPaginationButtons();
    }

    return {
        updatePagination: updateTable,
    };
}
