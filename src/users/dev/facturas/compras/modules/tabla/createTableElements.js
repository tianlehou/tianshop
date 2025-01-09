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
  "Método",
];

export function renderTableHeaders(tableHeadersElement) {
  tableHeadersElement.innerHTML = `
    <tr>
      ${tableHeaders.map((header) => `<th>${header}</th>`).join("")}
    </tr>
  `;
}

export function createTableBody(purchaseData, filaNumero) {
  const factura = purchaseData.factura || {};
  const empresa = factura.empresa || "N/A";
  const metodo = factura.metodo || "N/A";
  const monto = factura.monto || "N/A";

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
      <td>${formatWithSpaceBreaks(formatDateWithDay(purchaseData.fecha))}</td>
      <td>${empresa}</td>
      <td class="clr-cel f500 monto-celda">${monto}</td>
      <td>${metodo}</td>
    </tr>
  `;
}

// Función para calcular y actualizar el total de "Monto"
export function updateTotalMonto() {
  const montoCeldas = document.querySelectorAll(".monto-celda");
  const total = Array.from(montoCeldas).reduce((sum, cell) => {
    // Limpia el texto de la celda (elimina comas) y conviértelo a número
    const value = parseFloat(cell.textContent.replace(/,/g, "")) || 0;
    return sum + value;
  }, 0);

  const totalMontoElement = document.getElementById("total-monto");
  if (totalMontoElement) {
    totalMontoElement.textContent = `(${total.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })})`; // Formatea con separadores y 2 decimales
  }
}
