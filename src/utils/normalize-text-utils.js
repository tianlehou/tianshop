// normalize-text-utils.js
// Función para eliminar tildes y normalizar texto
function removeAccents(text) {
    return text
        .normalize("NFD") // Descompone los caracteres en su base y signos diacríticos
        .replace(/[\u0300-\u036f]/g, ""); // Elimina los signos diacríticos
}

// Función para normalizar texto a minúsculas, sin tildes, sin espacios extra y reemplazar guiones por espacios
export function normalizeText(text) {
    return removeAccents(text)
        .toLowerCase() // Convierte a minúsculas
        .replace(/-/g, ' ') // Reemplaza guiones por espacios
        .replace(/\s+/g, ' ') // Elimina espacios extra
        .trim(); // Elimina espacios al inicio y al final
}