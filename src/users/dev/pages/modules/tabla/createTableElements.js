// createTableElements.js
import {
  formatDate,
  formatEmptyCell,
  formatItbmsCell,
  formatWithLineBreaks,
  formatWithSpaceBreaks,
} from "./utils/format-cel-utils.js";
import {
  initializePopoversOnce,
  generateViewModePopover,
  generateActionButton,
  generateSharedInfoPopover,
} from "../../components/popover/generatePopover.js";

// Definimos los encabezados para cada modo
const fullHeaders = [
  "<th>#</th>",
  `<th class="sticky-col-2 z-5">${generateViewModePopover()}</th>`,
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
  "<th>Fecha</th>"
];

const buyHeaders = [
  "<th>#</th>",
  `<th class="sticky-col-2 z-5">${generateViewModePopover()}</th>`,
  "<th>Empresa</th>",
  "<th>Marca</th>",
  "<th>Descripción</th>",
  "<th>Costo<br> Final</th>"
];

const sellHeaders = [
  "<th>#</th>",
  `<th class="sticky-col-2 z-5">${generateViewModePopover()}</th>`,
  "<th>Empresa</th>",
  "<th>Marca</th>",
  "<th>Descripción</th>",
  "<th>Venta</th>",
  "<th>%</th>"
];

// Variable para mantener el modo actual
let currentMode = "buy";

export function renderTableHeaders(tableHeadersElement) {
  if (!tableHeadersElement) {
    console.error("tableHeadersElement is undefined");
    return;
  }
  let headers;
  switch (currentMode) {
    case "buy":
      headers = buyHeaders;
      break;
    case "sell":
      headers = sellHeaders;
      break;
    case "full":
    default:
      headers = fullHeaders;
      break;
  }
  tableHeadersElement.innerHTML = `
    <tr>
      ${headers.join("")}
    </tr>
  `;
}

export async function renderTableBody(tableHeadersElement, tableBodyElement, productDataArray) {
  if (!tableBodyElement) {
    console.error("tableBodyElement is undefined");
    return;
  }
  if (!productDataArray) {
    console.error("productDataArray is undefined");
    return;
  }
  if (!tableHeadersElement) {
    console.error("tableHeadersElement is undefined in renderTableBody");
    return;
  }
  try {
    const tableBodyHTML = productDataArray
      .map((productData, index) => createTableBody(productData, index + 1))
      .join("");
    tableBodyElement.innerHTML = tableBodyHTML;
    initializePopoversOnce(tableHeadersElement, tableBodyElement, productDataArray); // Pasamos los parámetros
  } catch (error) {
    console.error("Error al renderizar el cuerpo de la tabla:", error);
    throw error; // Re-lanzamos el error para que sea capturado por el llamador
  }
}

export function createTableBody(productData, filaNumero) {
  const {
    producto: { empresa, marca, descripcion },
    precio: { venta, costoUnitario, ganancia, porcentaje, unidades, costo },
    impuesto_descuento: { descuento, itbms, costoConItbmsDescuento },
    fecha,
  } = productData;

  switch (currentMode) {
    case "buy":
      return `
        <tr>
          <td class="clr-cel">${filaNumero}</td>
          <td class="sticky-col-2 clr-cel">
            ${generateActionButton(productData)}
            ${generateSharedInfoPopover(productData)}
          </td>
          <td>${formatWithSpaceBreaks(empresa)}</td>
          <td>${formatWithSpaceBreaks(marca)}</td>
          <td>${formatWithLineBreaks(descripcion)}</td>
          <td class="clr-cel f500">${costoConItbmsDescuento}</td>
        </tr>
      `;
    case "sell":
      return `
        <tr>
          <td class="clr-cel">${filaNumero}</td>
          <td class="sticky-col-2 clr-cel">
            ${generateActionButton(productData)}
            ${generateSharedInfoPopover(productData)}
          </td>
          <td>${formatWithSpaceBreaks(empresa)}</td>
          <td>${formatWithSpaceBreaks(marca)}</td>
          <td>${formatWithLineBreaks(descripcion)}</td>
          <td class="clr-cel f500">${venta}</td>
          <td>${porcentaje}%</td>
        </tr>
      `;
    case "full":
    default:
      return `
        <tr>
          <td class="clr-cel">${filaNumero}</td>
          <td class="sticky-col-2 clr-cel">
            ${generateActionButton(productData)}
            ${generateSharedInfoPopover(productData)}
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
  }
}

export function setTableMode(mode, tableHeadersElement, tableBodyElement, productDataArray, callback) {
  if (!tableHeadersElement || !tableBodyElement || !productDataArray) {
    console.error("setTableMode: Uno o más parámetros son undefined", { mode, tableHeadersElement, tableBodyElement, productDataArray });
    return;
  }
  currentMode = mode;
  renderTableHeaders(tableHeadersElement);
  renderTableBody(tableHeadersElement, tableBodyElement, productDataArray);

  // Ejecuta el callback si está definido
  if (callback) callback();
}