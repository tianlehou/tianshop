async function loadregisterProductButtonComponent() {
    try {
        const response = await fetch("./components/nav-header/register-product-button/register-product-button.html");
        if (!response.ok) {
            throw new Error(`Error al cargar el archivo: ${response.status} ${response.statusText}`);
        }
        const data = await response.text();
        const registerProductButtonContainer = document.getElementById("register-product-button-container");

        if (!registerProductButtonContainer) {
            console.error("Error: No se encontró el contenedor con el ID 'register-product-button-container'.");
            return;
        }

        registerProductButtonContainer.innerHTML = data;
    } catch (error) {
        console.error("Error al cargar el componente 'register-product-button':", error);
    }
};


loadregisterProductButtonComponent();