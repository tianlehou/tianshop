// tableSorting.js
export function sortData(data, key, direction = "asc") {
    return [...data].sort((a, b) => {
        const aValue = getNestedValue(a, key);
        const bValue = getNestedValue(b, key);

        // Manejar valores indefinidos o nulos
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return direction === "asc" ? 1 : -1;
        if (bValue == null) return direction === "asc" ? -1 : 1;

        // Ordenar según tipo de dato
        if (typeof aValue === "number" && typeof bValue === "number") {
            return direction === "asc" ? aValue - bValue : bValue - aValue;
        }
        return direction === "asc"
            ? String(aValue).localeCompare(String(bValue))
            : String(bValue).localeCompare(String(aValue));
    });
}

function getNestedValue(obj, key) {
    return key.split(".").reduce((acc, part) => acc && acc[part], obj);
}