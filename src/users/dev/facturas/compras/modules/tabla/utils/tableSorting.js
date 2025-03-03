// tableSorting.js
export function sortData(data, key, direction = "asc") {
    return [...data].sort((a, b) => {
        let aValue = getNestedValue(a, key);
        let bValue = getNestedValue(b, key);

        // Manejar valores nulos o indefinidos
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return direction === "asc" ? 1 : -1;
        if (bValue == null) return direction === "asc" ? -1 : 1;

        // Intentar convertir los valores a números
        const aNumber = parseFloat(aValue);
        const bNumber = parseFloat(bValue);

        // Verificar si ambos valores son numéricos (no NaN)
        const isNumeric = !isNaN(aNumber) && !isNaN(bNumber);

        // Ordenar numéricamente si ambos son números
        if (isNumeric) {
            return direction === "asc" ? aNumber - bNumber : bNumber - aNumber;
        }

        // Ordenar como texto si no son números
        return direction === "asc"
            ? String(aValue).localeCompare(String(bValue))
            : String(bValue).localeCompare(String(aValue));
    });
}

// Función auxiliar para acceder a propiedades anidadas
function getNestedValue(obj, key) {
    return key.split(".").reduce((acc, part) => acc && acc[part], obj);
}