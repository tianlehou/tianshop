// createTableElements.js
import {
  formatDateWithDay,
  formatWithSpaceBreaks,
} from "./utils/format-cel-utils.js";

// Encabezados de la tabla
const tableHeaders = [
  "#",
  '<i class="bi bi-chat-square-dots"></i>',
  "Fecha",
  "Empresa",
  `Monto<br> <span id="total-monto"></span>`, // Ajuste aquí
  "Estado",
];

// Función para renderizar los encabezados de la tabla
export function renderTableHeaders(tableHeadersElement) {
  tableHeadersElement.innerHTML = `
    <tr>
      ${tableHeaders.map((header) => `<th>${header}</th>`).join("")}
    </tr>
  `;
}

// Función para crear una fila de la tabla
export function createTableBody(purchaseData, filaNumero) {
  const factura = purchaseData.factura || {};
  const estado = factura.estado || "---";
  const empresa = factura.empresa || "---";
  const monto = factura.monto || "---";

  // Convertir la fecha para determinar si es domingo
  const fecha = new Date(purchaseData.fecha);
  const isSunday = fecha.getDay() === 6;
  const fechaFormateada = formatWithSpaceBreaks(formatDateWithDay(purchaseData.fecha));

  const actionButton = `<button class="btn custom-button" type="button" data-bs-toggle="popover" 
          data-bs-html="true" data-bs-placement="right"
          data-bs-content=" 
            <div class='d-flex flex-row gap-2 p-1'>
              <button class='btn btn-sm btn-warning edit-purchase-button' data-id='${purchaseData.id}'>Editar</button>
              <button class='btn btn-sm btn-danger delete-purchase-button' data-id='${purchaseData.id}'>Eliminar</button>
            </div>
          ">
        <i class="bi bi-three-dots-vertical"></i>
      </button>`;

  return `
    <tr>
      <td class="clr-cel">${filaNumero}</td>
      <td class="sticky-col-2 clr-cel">
        ${actionButton}
      </td>
      <td style="color: ${isSunday ? "red" : "inherit"};">${fechaFormateada}</td>
      <td>${empresa}</td>
      <td class="clr-cel f500 monto-celda">${monto}</td>
      <td>${formatWithSpaceBreaks(estado)}</td>
    </tr>
  `;
}

// Función para renderizar el cuerpo de la tabla con las fechas ordenadas
export function renderTableBody(tableBodyElement, data) {
  // Ordenar los datos por fecha en orden ascendente
  const sortedData = [...data].sort((a, b) => {
    const fechaA = new Date(a.fecha).getTime();
    const fechaB = new Date(b.fecha).getTime();
    return fechaA - fechaB; // Ascendente
  });

  // Generar las filas de la tabla
  tableBodyElement.innerHTML = sortedData
    .map((purchaseData, index) => createTableBody(purchaseData, index + 1))
    .join("");
}

// Función para calcular y actualizar el total de "Monto"
export function updateTotalMonto() {
  const montoCeldas = document.querySelectorAll(".monto-celda");
  const total = Array.from(montoCeldas).reduce((sum, cell) => {
    const value = parseFloat(cell.textContent.replace(/,/g, "")) || 0;
    return sum + value;
  }, 0);

  const totalMontoElement = document.getElementById("total-monto");
  if (totalMontoElement) {
    totalMontoElement.textContent = `(${total.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })})`;
  }
}
