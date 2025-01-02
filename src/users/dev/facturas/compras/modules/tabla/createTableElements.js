// createTableElements.js
import { formatDate, formatWithLineBreaks, formatWithSpaceBreaks } from "./utils/format-cel-utils.js";

// Encabezados de la tabla
const tableHeaders = [
  "#", '<i class="bi bi-chat-square-dots"></i>',
  "Fecha", "Empresa", "Marca", "Descripción",
  "Venta", "Unidad", "Costo"
];

export function renderTableHeaders(tableHeadersElement) {
  tableHeadersElement.innerHTML = `
    <tr>
      ${tableHeaders.map((header) => `<th>${header}</th>`).join("")}
    </tr>
  `;
}

export function createTableBody(purchaseData, filaNumero) {
  const sharedInfoPopover = purchaseData.sharedByEmail
    ? `<button class="custom-button info-btn"
        data-bs-toggle="popover"
        data-bs-html="true"
        data-bs-placement="top"
        title="<span class='info-shared-popover-header'>Información Compartida</span>"
        data-bs-content="
          <div class='info-shared-popover-body'>
            Compartido por: <strong>${purchaseData.sharedByEmail}</strong><br>
            Fecha: <strong>${purchaseData.sharedAt}</strong>
          </div>
          <button class='btn btn-sm btn-danger delete-shared-button' 
                  data-shared-by='${purchaseData.sharedBy}' 
                  data-id='${purchaseData.id}'>
            Eliminar
          </button>
        ">  
      <i class="bi bi-info-circle"></i>
    </button>`
    : "";

  const actionButton = !purchaseData.sharedByEmail
    ? `<button class="btn custom-button" type="button" data-bs-toggle="popover" 
          data-bs-html="true" data-bs-placement="right"
          data-bs-content="
            <div class='d-flex flex-row gap-2 p-1'>
              <button class='btn btn-sm btn-warning edit-purchase-button' data-id='${purchaseData.id}'>Editar</button>
              <button class='btn btn-sm btn-danger delete-purchase-button' data-id='${purchaseData.id}'>Eliminar</button>
              <button class='btn btn-sm btn-secondary duplicate-purchase-button' data-id='${purchaseData.id}'>Duplicar</button>
            </div>
          ">
        <i class="bi bi-three-dots-vertical"></i>
      </button>`
    : "";

  return `
    <tr>
      <td class="clr-cel">${filaNumero}</td>
      <td class="sticky-col-2 clr-cel">
        ${actionButton}
        ${sharedInfoPopover}
      </td>
      <td>${formatWithSpaceBreaks(formatDate(purchaseData.fecha))}</td>
      <td>${formatWithSpaceBreaks(purchaseData.producto.empresa)}</td>
      <td>${formatWithSpaceBreaks(purchaseData.producto.marca)}</td>
      <td>${formatWithLineBreaks(purchaseData.producto.descripcion)}</td>
      <td class=" clr-cel f500">${purchaseData.precio.venta}</td>
      <td>${purchaseData.precio.unidades}</td>
      <td>${purchaseData.precio.costo}</td>
    </tr>
  `;
}
