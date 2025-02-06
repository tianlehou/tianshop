async function loadregisterPurchaseButtonComponent() {
    try {
        const response = await fetch("./components/nav-header/register-purchase-button/register-purchase-button.html");
        if (!response.ok) {
            throw new Error(`Error al cargar el archivo: ${response.status} ${response.statusText}`);
        }
        const data = await response.text();
        const registerPurchaseButtonContainer = document.getElementById("register-purchase-button-container");

        if (!registerPurchaseButtonContainer) {
            console.error("Error: No se encontró el contenedor con el ID 'register-purchase-button-container'.");
            return;
        }

        registerPurchaseButtonContainer.innerHTML = data;
    } catch (error) {
        console.error("Error al cargar el componente 'register-purchase-button':", error);
    }
};


loadregisterPurchaseButtonComponent();