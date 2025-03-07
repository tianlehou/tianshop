// createTableElements.js
import {
  formatDateWithDay,
  formatWithSpaceBreaks,
} from "./utils/format-cel-utils.js";
import { initializePopovers, generateActionButton } from "../../components/popover/purchase-popover.js";
import { sortData } from "../../../../../../utils/tableSorting.js";

// Encabezados de la tabla con data-key para columnas ordenables
const tableHeaders = [
  "<th>#</th>",
  '<th class="sticky-col-2 z-5"><i class="bi bi-chat-square-dots"></i></th>',
  '<th data-key="fecha">Fecha</th>',
  '<th data-key="factura.empresa">Empresa</th>',
  '<th data-key="factura.monto">Monto<br> <span id="total-monto"></span></th>',
  '<th data-key="factura.estado">Estado</th>',
];

// Función para renderizar los encabezados de la tabla
export function renderTableHeaders(tableHeadersElement, tableBodyElement, currentData) {
  tableHeadersElement.innerHTML = `
    <tr>
      ${tableHeaders.join("")}
    </tr>
  `;

  const thElements = tableHeadersElement.querySelectorAll("th");
  thElements.forEach((th) => {
    const key = th.getAttribute("data-key");
    if (key) {
      th.style.cursor = "pointer";
      th.addEventListener("click", () => {
        if (!Array.isArray(currentData)) {
          console.error("currentData no es un arreglo:", currentData);
          return;
        }

        const currentDirection = th.getAttribute("data-direction") || "asc";
        const newDirection = currentDirection === "asc" ? "desc" : "asc";
        th.setAttribute("data-direction", newDirection);

        const sortedData = sortData(currentData, key, newDirection);
        renderTableBody(tableBodyElement, sortedData);
        initializePopovers();

        thElements.forEach((otherTh) => {
          otherTh.classList.remove("sorted", "sorted-asc", "sorted-desc");
        });
        th.classList.add("sorted", `sorted-${newDirection}`);

        updateTotalMonto();
      });
    }
  });
}

// Función para crear una fila de la tabla
export function createTableBody(purchaseData, filaNumero) {
  const factura = purchaseData.factura || {};
  const estado = factura.estado || "";
  const empresa = factura.empresa || "";
  const monto = factura.monto || "";

  // Convertir la fecha para determinar si es domingo
  const fecha = new Date(purchaseData.fecha);
  const isSunday = fecha.getDay() === 6;
  const fechaFormateada = formatWithSpaceBreaks(formatDateWithDay(purchaseData.fecha));
  const actionButton = generateActionButton({ id: purchaseData.id });

  return `
    <tr>
      <td class="clr-cel">${filaNumero}</td>
      <td class="sticky-col-2 clr-cel">${actionButton}</td>
      <td style="color: ${isSunday ? "red" : "inherit"};">${fechaFormateada}</td>
      <td>${empresa}</td>
      <td class="clr-cel f500 monto-celda">${monto}</td>
      <td>${formatWithSpaceBreaks(estado)}</td>
    </tr>
  `;
}

// Función para renderizar el cuerpo de la tabla
export function renderTableBody(tableBodyElement, data) {
  tableBodyElement.innerHTML = data
    .map((purchaseData, index) => createTableBody(purchaseData, index + 1, index === 0))
    .join("");
  initializePopovers();
}

// Función para calcular y actualizar el total de "Monto"
export function updateTotalMonto() {
  const visibleRows = Array.from(document.querySelectorAll("#contenidoTabla tr:not(.d-none)"));

  const total = visibleRows.reduce((sum, row) => {
    const montoCell = row.querySelector(".monto-celda");
    if (!montoCell) return sum;

    const value = parseFloat(montoCell.textContent.replace(/[^0-9.-]+/g, "")) || 0;
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