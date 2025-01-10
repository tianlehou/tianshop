
// script-pages-02.js
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database } from "../../../environment/firebaseConfig.js";

import "./modules/newRegister.js";
import { checkAuth } from '../../../modules/accessControl/authCheck.js';
import { getUserRole } from "../../../modules/accessControl/getUserRole.js";
import { checkUserAccess } from "../../../modules/accessControl/roleAccessControl.js";

import "./modules/downloadToExcel.js";
import { addEditEventListeners } from "./modules/editRow.js";
import { handleFileUpload } from "../modules/Excel/uploadExcelHandler.js";
import { formatWithArrobaBreaks } from "../../../modules/tabla/format/formatCel.js";

import { initializeSearch } from "./modules/searchFunction.js";
import { initScrollButtons } from "../modules/scrollButtons.js";
import { includeHTML } from "./components/includeHTML/includeHTML.js";
import { updateSelectElements } from "./modules/updateSelectElements.js";
import { getMonthAndYearFromDataCollection, generateCalendarHeaders, generateColumnTotals,
    generateCalendarDays } from "./modules/calendarUtils.js";

export let collection = null;

// Asigna automáticamente la colección en función del mes actual
export function setCollectionByCurrentMonth() {
    const month = new Date().getMonth() + 1;
    collection = `cobros-de-zarpe-${month.toString().padStart(2, '0')}`;
    console.log("Colección asignada automáticamente:", collection);
}

// Actualizar colección manualmente si es necesario
export function updateCollection(value) {
    collection = value;
    console.log("Colección actualizada manualmente a:", collection);
}

// Función para mostrar los datos en la tabla
export function mostrarDatos() {
    const tabla = document.getElementById("contenidoTabla");
    const thead = document.querySelector("#miTabla thead");
    const mainHeader = document.querySelector("#miTabla thead tr.main-header");

    if (!tabla || !thead || !mainHeader) {
        console.error("Elemento 'contenidoTabla', 'thead' o 'main-header' no encontrado.");
        return;
    }

    if (!collection) {
        console.error("La colección no está definida.");
        return;
    }

    const { month, year } = getMonthAndYearFromDataCollection(collection);

    // Generar encabezado dinámico
    mainHeader.innerHTML = `
        <th>Nombre</th>
        <th>Acciones</th>
        ${generateCalendarHeaders(month, year)}
        <th>Conductor</th>
        <th>Propietario</th>
    `;

    onValue(ref(database, collection), (snapshot) => {
        tabla.innerHTML = ""; // Limpia la tabla
        let data = [];

        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            data.push({ id: childSnapshot.key, ...user });
        });

        // Ordenar los datos alfabéticamente por nombre
        data.sort((a, b) => a.nombre.localeCompare(b.nombre));

        // Generar encabezado de totales
        let totalsRow = document.querySelector("#miTabla thead tr.totales-row");
        const totalsHTML = generateColumnTotals(data, month, year);

        if (totalsRow) {
            // Si ya existe la fila de totales, actualízala
            totalsRow.innerHTML = totalsHTML;
        } else {
            // Si no existe, crea una nueva fila de totales
            totalsRow = document.createElement("tr");
            totalsRow.classList.add("totales-row");
            totalsRow.innerHTML = totalsHTML;
            thead.appendChild(totalsRow);
        }

        // Agregar filas de datos
        data.forEach((user) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${user.nombre}</td>
                <td class="display-flex-center action-col">
                <button class="btn btn-primary mg-05em edit-user-button" data-id="${user.id}">
                <i class="bi bi-pencil"></i>
                </button>
                </td>
                ${generateCalendarDays(month, year, user)}
                <td>${formatWithArrobaBreaks(user.correoConductor || '')}</td>
                <td>${formatWithArrobaBreaks(user.correoPropietario || '')}</td>
            `;
            tabla.appendChild(row);
        });

        updateSelectElements(database, collection);
        addEditEventListeners(database, collection);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    setCollectionByCurrentMonth();
    checkAuth();
    checkUserAccess();

    try {
        const role = await getUserRole();
        console.log("Rol del usuario autenticado:", role);
    } catch (error) {
        console.error("Error al obtener el rol del usuario:", error);
    }

    includeHTML();
    mostrarDatos();
    handleFileUpload();
    initializeSearch(document.getElementById("contenidoTabla"));
    initScrollButtons(document.getElementById("contenidoTabla"));
});

console.log(database);