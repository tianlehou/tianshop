// createTableElements.js
import {
  formatDate,
  formatEmptyCell,
  formatItbmsCell,
  formatWithLineBreaks,
  formatWithSpaceBreaks,
} from "./utils/format-cel-utils.js";
import { initializePopovers } from "../../components/popover/initPopover.js";
import {
  generateViewModePopover,
  generateActionButton,
  generateSharedInfoPopover,
} from "../../components/popover/generateTablePopover.js";

import { sortData } from "./utils/tableSorting.js";

// Definimos los encabezados con data-key para cada modo
const fullHeaders = [
  `<th>#</th>`,
  `<th class="sticky-col-2 z-5">${generateViewModePopover()}</th>`, // Sin data-key, no ordenable
  `<th data-key="producto.empresa">Empresa</th>`,
  `<th data-key="producto.marca">Marca</th>`,
  `<th data-key="producto.descripcion">Descripción</th>`,
  `<th data-key="precio.venta">Venta</th>`,
  `<th data-key="precio.costoUnitario">Costo<br> Unitario</th>`,
  `<th data-key="precio.ganancia">Ganancia</th>`,
  `<th data-key="precio.porcentaje">%</th>`,
  `<th data-key="precio.unidades">Unidad</th>`,
  `<th data-key="precio.costo">Costo</th>`,
  `<th data-key="impuesto_descuento.descuento">Descuento</th>`,
  `<th data-key="impuesto_descuento.itbms">Itbms</th>`,
  `<th data-key="impuesto_descuento.costoConItbmsDescuento">Costo<br> Final</th>`,
  `<th data-key="fecha">Fecha</th>`,
];

const buyHeaders = [
  `<th>#</th>`,
  `<th class="sticky-col-2 z-5">${generateViewModePopover()}</th>`, // Sin data-key, no ordenable
  `<th data-key="producto.empresa">Empresa</th>`,
  `<th data-key="producto.marca">Marca</th>`,
  `<th data-key="producto.descripcion">Descripción</th>`,
  `<th data-key="impuesto_descuento.costoConItbmsDescuento">Costo<br> Final</th>`,
  `<th data-key="fecha">Fecha</th>`,
];

const sellHeaders = [
  `<th>#</th>`,
  `<th class="sticky-col-2 z-5">${generateViewModePopover()}</th>`, // Sin data-key, no ordenable
  `<th data-key="producto.empresa">Empresa</th>`,
  `<th data-key="producto.marca">Marca</th>`,
  `<th data-key="producto.descripcion">Descripción</th>`,
  `<th data-key="precio.venta">Venta</th>`,
  `<th data-key="precio.porcentaje">%</th>`,
  `<th data-key="fecha">Fecha</th>`,
];

// Variable para mantener el modo actual y los datos
let currentMode = "buy";
let currentData = []; // Almacena los datos actuales

export function setCurrentData(data) {
  currentData = data; // Permite actualizar los datos desde home.js
}

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

  // Hacer los <th> clickeables solo si tienen data-key
  const thElements = tableHeadersElement.querySelectorAll("th");
  thElements.forEach((th) => {
    const key = th.getAttribute("data-key");
    if (key) {
      th.style.cursor = "pointer"; // Indica que es clickeable
      th.addEventListener("click", () => {
        const key = th.getAttribute("data-key");
        if (!key) return;

        // Obtener la dirección actual (por defecto "asc" si no está definida)
        const currentDirection = th.getAttribute("data-direction") || "asc";
        // Alternar la dirección
        const newDirection = currentDirection === "asc" ? "desc" : "asc";
        th.setAttribute("data-direction", newDirection);

        // Obtener los datos filtrados actuales desde search-product.js
        const filteredData = window.currentFilteredResults || currentData;

        // Ordenar los datos filtrados
        const sortedData = sortData(filteredData, key, newDirection);

        // Volver a renderizar el cuerpo de la tabla con los datos ordenados
        renderTableBody(tableHeadersElement, document.getElementById("tableContent"), sortedData);

        // Resaltar la columna ordenada y agregar clase específica para la dirección
        thElements.forEach((otherTh) => {
          otherTh.classList.remove("sorted", "sorted-asc", "sorted-desc");
        });
        th.classList.add("sorted", `sorted-${newDirection}`);
      });
    }
  });
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
    initializePopovers(tableHeadersElement, tableBodyElement, productDataArray);
  } catch (error) {
    console.error("Error al renderizar el cuerpo de la tabla:", error);
    throw error;
  }
}

function createTableBody(productData, filaNumero) {
  const {
    fecha,
    producto: { empresa, marca, descripcion },
    precio: { venta, costoUnitario, ganancia, porcentaje, unidades, costo },
    impuesto_descuento: { descuento, itbms, costoConItbmsDescuento },
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
          <td>${formatWithSpaceBreaks(formatDate(fecha))}</td>
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
          <td>${formatWithSpaceBreaks(formatDate(fecha))}</td>
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

  if (callback) callback();
}