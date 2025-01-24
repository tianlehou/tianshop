export function showScanResultModal(code) {
    // Obtener referencias a los elementos del modal
    const modalElement = document.getElementById("scan-result-modal");
    const resultElement = document.getElementById("modal-barcode-result") || document.getElementById("modal-scan-result");

    // Verificar y actualizar el contenido del modal
    if (resultElement) {
        resultElement.textContent = `Código detectado: ${code}`;
    }

    // Mostrar el modal usando Bootstrap
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // Configurar eventos de los botones
    const linkProductBtn = document.getElementById("linkProductBtn") || document.getElementById("link-product-btn");
    const createProductBtn = document.getElementById("createProductBtn") || document.getElementById("create-product-btn");

    if (linkProductBtn) {
        linkProductBtn.onclick = () => {
            console.log("Vincular a producto seleccionado:", code);
            modal.hide();
        };
    }

    if (createProductBtn) {
        createProductBtn.onclick = () => {
            console.log("Crear nuevo registro con código:", code);
            modal.hide();
        };
    }
}

export async function loadScanResultModal() {
    const container = document.getElementById("scan-result-modal-container"); // Contenedor donde se cargará el modal dinámicamente
    if (!container) {
        console.error("Contenedor del modal no encontrado.");
        return;
    }

    try {
        const response = await fetch("./components/image-box/scanner-button/modal/scan-result-modal.html");
        const modalHTML = await response.text();
        container.innerHTML = modalHTML;
        console.log("Modal cargado correctamente.");
    } catch (err) {
        console.error("Error al cargar el modal:", err);
    }
}
