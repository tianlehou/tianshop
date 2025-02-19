// createTableElements.js
import {
  formatDate,
  formatEmptyCell,
  formatItbmsCell,
  formatWithLineBreaks,
  formatWithSpaceBreaks,
} from "./utils/format-cel-utils.js";
import { initializePopovers } from "../../components/popover/popover.js";

// Encabezados de la tabla
const tableHeaders = [
  "<th>#</th>",
  '<th class="sticky-col-2 z-5"><i class="bi bi-chat-square-dots"></i></th>',
  "<th>Empresa</th>",
  "<th>Marca</th>",
  "<th>Descripción</th>",
  "<th>Venta</th>",
  "<th>Costo<br> Unitario</th>",
  "<th>Ganancia</th>",
  "<th>%</th>",
  "<th>Unidad</th>",
  "<th>Costo</th>",
  "<th>Descuento</th>",
  "<th>Itbms</th>",
  "<th>Costo<br> Final</th>",
  "<th>Fecha</th>",
];

export function renderTableHeaders(tableHeadersElement) {
  tableHeadersElement.innerHTML = `
    <tr>
      ${tableHeaders.join("")}
    </tr>
  `;
}

export async function renderTableBody(tableBodyElement, productDataArray) {
  try {
    const tableBodyHTML = productDataArray
      .map((productData, index) => createTableBody(productData, index + 1))
      .join("");

    tableBodyElement.innerHTML = tableBodyHTML;

    initializePopoversOnce(); // Optimización de inicialización
  } catch (error) {
    console.error("Error al renderizar el cuerpo de la tabla:", error);
  }
}

function initializePopoversOnce() {
  const popoversExist = !!document.querySelector("[data-bs-toggle='popover']");
  if (!popoversExist) initializePopovers();
}

function generateSharedInfoPopover({ sharedByEmail, sharedBy, id, sharedAt, expiresAt }) {
  if (!sharedByEmail) return "";
  return `
    <button class="btn custom-button circle-btn"
        data-bs-toggle="popover"
        data-bs-html="true" data-bs-placement="right"
        title="<span class='info-shared-popover-header'>Información Compartida</span>"
        data-bs-content="
          <div class='info-shared-popover-body'>
            Compartido por: <strong>${sharedByEmail}</strong><br>
            Fecha: <strong>${sharedAt || "No definido"}</strong><br>
            Expiración: <strong style='color: red;'>${expiresAt || "Sin fecha de expiración"}</strong>
          </div>
          <button class='btn btn-sm btn-danger delete-shared-button' 
                  data-shared-by='${sharedBy}' 
                  data-id='${id}'>
            Eliminar
          </button>
        ">  
      <i class="bi bi-card-heading"></i>
    </button>`;
}

function generateActionButton({ id, sharedByEmail }) {
  if (sharedByEmail) return "";
  return `
    <button class="btn custom-button square-btn"
        type="button"
        data-bs-toggle="popover" 
        data-bs-html="true" data-bs-placement="right"
        data-bs-content="
          <div class='d-flex flex-row gap-2 p-1'>
            <button class='btn btn-sm btn-warning edit-product-button' data-id='${id}'>Editar</button>
            <button class='btn btn-sm btn-danger delete-product-button' data-id='${id}'>Eliminar</button>
            <button class='btn btn-sm btn-secondary duplicate-product-button' data-id='${id}'>Duplicar</button>
          </div>
        ">
      <i class="bi bi-three-dots-vertical"></i>
    </button>`;
}

export function createTableBody(productData, filaNumero) {
  const {
    producto: { empresa, marca, descripcion },
    precio: { venta, costoUnitario, ganancia, porcentaje, unidades, costo },
    impuesto_descuento: { descuento, itbms, costoConItbmsDescuento },
    fecha,
  } = productData;

  const sharedInfoPopover = generateSharedInfoPopover(productData);
  const actionButton = generateActionButton(productData);

  return `
    <tr>
      <td class="clr-cel">${filaNumero}</td>
      <td class="sticky-col-2 clr-cel">
        ${actionButton}
        ${sharedInfoPopover}
      </td>
      <td>${formatWithSpaceBreaks(empresa)}</td>
      <td>${formatWithSpaceBreaks(marca)}</td>
      <td>${formatWithLineBreaks(descripcion)}</td>
      <td class="clr-cel f500">${venta}</td>
      <td>${costoUnitario}</td>
      <td>${ganancia}</td>
      <td>${porcentaje}%</td>
      <td>${unidades}</td>
      <td>${costo}</td>
      <td>${formatEmptyCell(descuento)}</td>
      <td>${formatItbmsCell(itbms)}</td>
      <td class="clr-cel f500">${costoConItbmsDescuento}</td>
      <td>${formatWithSpaceBreaks(formatDate(fecha))}</td>
    </tr>
  `;
};
