// utils.js
export function setTodayDate(inputElement) {
    if (!inputElement) {
        console.error("El elemento de entrada no es válido.");
        return;
    }
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    inputElement.value = `${yyyy}-${mm}-${dd}`;
}

export function formatInputAsDecimal(input) {
    input.addEventListener("input", () => {
        const rawValue = input.value.replace(/\D/g, "");
        const numericValue = parseFloat(rawValue) / 100;
        if (isNaN(numericValue)) {
            input.value = "";
            return;
        }

        input.value = new Intl.NumberFormat("en-US", {
            style: "decimal",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numericValue);
    });
}
