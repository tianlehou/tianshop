// filter-by-date.js
import { database } from "../../../../../../../../environment/firebaseConfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getUserEmail } from "../../../../../../../modules/accessControl/getUserEmail.js";
import { showToast } from "../../toast/toastLoader.js";
import { createTableBody } from "../../../modules/tabla/createTableElements.js";
import { initializePopovers } from "../../../components/popover/product-table/action-purchase-popover.js";
import { updateTotalMonto } from "../../../modules/tabla/createTableElements.js";

export async function filterByDate(selectedDate) {
    try {
        const email = await getUserEmail();
        if (!email) {
            showToast("No se pudo obtener el correo del usuario.", "error");
            return;
        }

        const userEmailKey = email.replaceAll(".", "_");
        const dbRef = ref(database, `users/${userEmailKey}/recordData/purchaseData`);
        const snapshot = await get(dbRef);

        if (!snapshot.exists()) {
            showToast("No hay registros para esta fecha.", "info");
            return;
        }

        const formattedSelectedDate = selectedDate.toISOString().split('T')[0];
        const results = Object.entries(snapshot.val()).filter(([key, purchase]) => {
            return purchase.fecha === formattedSelectedDate;
        });

        displayFilteredResults(results);
    } catch (error) {
        console.error("Error al filtrar por fecha:", error);
        showToast("Error al buscar registros por fecha", "error");
    }
}

function displayFilteredResults(results) {
    const resultsContainer = document.getElementById("contenidoTabla");
    if (!resultsContainer) {
        console.error("No se encontró el contenedor de resultados");
        return;
    }

    resultsContainer.innerHTML = "";
    let filaNumero = 1;

    results.forEach(([key, purchase]) => {
        const tableBodyHTML = createTableBody({ id: key, ...purchase }, filaNumero++);
        resultsContainer.innerHTML += tableBodyHTML;
    });

    initializePopovers();
    updateTotalMonto();
}