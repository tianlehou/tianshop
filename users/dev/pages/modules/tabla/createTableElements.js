import {
  formatDate,
  formatEmptyCell,
  formatItbmsCell,
  formatWithLineBreaks,
  formatWithSpaceBreaks,
} from "./utils/format-cel-utils.js";

// Encabezados de la tabla
const tableHeaders = [
  "#", '<i class="bi bi-chat-square-dots"></i>',
  "Fecha", "Empresa", "Marca", "Descripción",
  "Venta", "Costo<br> Unitario", "Ganancia", "%", "Unidad", "Costo",
  "Descuento", "Itbms", "Costo<br> Final",
];

export function renderTableHeaders(tableHeadersElement) {
  tableHeadersElement.innerHTML = `
    <tr>
      ${tableHeaders.map((header) => `<th>${header}</th>`).join("")}
    </tr>
  `;
}

export function createTableBody(productData, filaNumero) {
  const sharedInfoPopover = productData.sharedByEmail
    ? `<button class="custom-button info-btn"
        data-bs-toggle="popover"
        data-bs-html="true"
        data-bs-placement="top"
        title="<span class='info-shared-popover-header'>Información Compartida</span>"
        data-bs-content="
          <div class='info-shared-popover-body'>
            Compartido por: <strong>${productData.sharedByEmail}</strong><br>
            Fecha: <strong>${productData.sharedAt}</strong>
          </div>
          <button class='btn btn-sm btn-danger delete-shared-button' 
                  data-shared-by='${productData.sharedBy}' 
                  data-id='${productData.id}'>
            Eliminar
          </button>
        ">  
      <i class="bi bi-info-circle"></i>
    </button>`
    : "";

  const actionButton = !productData.sharedByEmail
    ? `<button class="btn custom-button" type="button" data-bs-toggle="popover" 
          data-bs-html="true" data-bs-placement="right"
          data-bs-content="
            <div class='d-flex flex-row gap-2 p-1'>
              <button class='btn btn-sm btn-warning edit-product-button' data-id='${productData.id}'>Editar</button>
              <button class='btn btn-sm btn-danger delete-product-button' data-id='${productData.id}'>Eliminar</button>
              <button class='btn btn-sm btn-secondary duplicate-product-button' data-id='${productData.id}'>Duplicar</button>
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
      <td>${formatWithSpaceBreaks(formatDate(productData.fecha))}</td>
      <td>${formatWithSpaceBreaks(productData.producto.empresa)}</td>
      <td>${formatWithSpaceBreaks(productData.producto.marca)}</td>
      <td>${formatWithLineBreaks(productData.producto.descripcion)}</td>
      <td class=" clr-cel f500">${productData.precio.venta}</td>
      <td>${productData.precio.costoUnitario}</td>
      <td>${productData.precio.ganancia}</td>
      <td>${productData.precio.porcentaje}%</td>
      <td>${productData.precio.unidades}</td>
      <td>${productData.precio.costo}</td>
      <td>${formatEmptyCell(productData.impuesto_descuento.descuento)}</td>
      <td>${formatItbmsCell(productData.impuesto_descuento.itbms)}</td>
      <td class="clr-cel f500">${
        productData.impuesto_descuento.costoConItbmsDescuento
      }</td>
    </tr>
  `;
}
