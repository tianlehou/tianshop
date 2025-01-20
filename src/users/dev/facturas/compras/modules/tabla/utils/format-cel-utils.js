// format-cel-utils.js
export function formatDateWithDay(fecha) {
    if (!fecha) return "";
    const [year, month, day] = fecha.split("-");
    const date = new Date(year, month - 1, day); // Crear objeto Date
    const monthShort = new Intl.DateTimeFormat("es-ES", { month: "short" })
        .format(date)
        .replace(/\./g, "");
    const weekday = new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(date);
    return `${year} ${monthShort}.${day} ${weekday}`;
}

export function formatWithSpaceBreaks(data) {
    return typeof data === "string" ? data.split(" ").join("<br>") : "";
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