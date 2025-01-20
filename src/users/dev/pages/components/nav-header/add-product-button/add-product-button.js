async function loadAddProductComponent() {
    try {
        const response = await fetch("./components/nav-header/add-product-button/add-product-button.html");
        if (!response.ok) {
            throw new Error(`Error al cargar el archivo: ${response.status} ${response.statusText}`);
        }
        const data = await response.text();
        const addProductContainer = document.getElementById("add-product-container");

        if (!addProductContainer) {
            console.error("Error: No se encontró el contenedor con el ID 'add-product-container'.");
            return;
        }

        addProductContainer.innerHTML = data;
    } catch (error) {
        console.error("Error al cargar el componente 'add-product-button':", error);
    }
};


loadAddProductComponent();