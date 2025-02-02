export function formatDate(fecha) {
    if (!fecha) return "";
    const [year, month, day] = fecha.split("-");
    const date = new Date(year, month - 1, day); // Crear objeto Date
    const monthShort = new Intl.DateTimeFormat("es-ES", { month: "short" })
        .format(date)
        .replace(/\./g, "");
    return `${year} ${monthShort}.${day}`;
}

export function formatWithSpaceBreaks(data) {
    return typeof data === "string" ? data.split(" ").join("<br>") : "";
}

export function formatWithLineBreaks(data) {
    return typeof data === "string" ? data.split(" - ").join("<br>") : "";
}

export function formatEmptyCell(data) {
    const value = data != null ? String(data) : ""; // Convertir a cadena o manejar null/undefined
    return value.trim() !== "0.00" ? value : "---";
}

export function formatItbmsCell(value) {
    if (value === 0) return "---"; // Mostrar "---" si el valor es 0
    return value ? `${value}%` : "---"; // Agregar "%" si hay un valor, de lo contrario mostrar "---"
}
