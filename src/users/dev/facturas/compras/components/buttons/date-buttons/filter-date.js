// filter-date.js
import { database } from "../../../../../../../../environment/firebaseConfig.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getUserEmail } from "../../../../../../../modules/accessControl/getUserEmail.js";
import { createTableBody, updateTotalMonto } from "../../../modules/tabla/createPurchaseTableElements.js";
import { initializePopovers } from "../../popover/purchase-popover.js";
import { renderPurchaseChart, clearChart } from "../../../modules/chart.js";

// Estado para rastrear las fechas seleccionadas
let currentFilterType = 'today'; // Tipo de filtro actual
let currentStartDate = new Date(); // Fecha inicial para el rango seleccionado

export function initializeFilters(buttonConfig, tableId) {
  const tableContainer = document.getElementById(tableId);
  const chartContainer = document.getElementById("chartContainer");
  const selectedDateDisplay = document.getElementById("selected-date-display");
  const selectedDateSpan = document.getElementById("selected-date");
  const navigationButtonsContainer = document.getElementById("navigation-buttons-container");

  if (!tableContainer) {
    console.error("No se encontró la tabla para el filtro.");
    return;
  }

  if (!chartContainer) {
    console.error("No se encontró el contenedor de la gráfica.");
    return;
  }

  if (!selectedDateDisplay || !selectedDateSpan) {
    console.error("No se encontraron los elementos para mostrar la fecha seleccionada.");
    return;
  }

  if (!navigationButtonsContainer) {
    console.error("No se encontró el contenedor de botones de navegación.");
    return;
  }

  buttonConfig.forEach(({ buttonId, filterFn }) => {
    const button = document.getElementById(buttonId);

    if (!button) {
      console.error(`No se encontró el botón con ID: ${buttonId}`);
      return;
    }

    button.addEventListener("click", async () => {
      currentFilterType = buttonId.replace("Button", ""); // Ej: "today", "week", "month", "year"
      currentStartDate = new Date(); // Reiniciar al día actual al hacer clic
      await applyFilter(filterFn, buttonId, navigationButtonsContainer);
    });
  });

  // Función para aplicar el filtro y actualizar la UI
  async function applyFilter(filterFn, buttonId, navigationContainer) {
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
        tableContainer.innerHTML = "<tr><td colspan='6'>No hay datos disponibles.</td></tr>";
        updateTotalMonto();
        clearChart();
        chartContainer.classList.add("no-data");
        updateDateDisplay(buttonId);
        manageNavigationButtons(buttonId, navigationContainer);
        return;
      }

      const purchases = snapshot.val();
      const filteredData = Object.entries(purchases)
        .filter(([key, purchase]) => {
          const purchaseDate = new Date(purchase.fecha);
          return filterFn(purchaseDate);
        })
        .map(([key, purchase]) => ({ id: key, ...purchase }));

      filteredData.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

      tableContainer.innerHTML = "";
      if (filteredData.length > 0) {
        let filaNumero = 1;
        filteredData.forEach((purchase) => {
          tableContainer.innerHTML += createTableBody(purchase, filaNumero++);
        });
        initializePopovers();
        updateTotalMonto();

        let filterType = 'company';
        if (buttonId === 'weekButton') filterType = 'week';
        else if (buttonId === 'monthButton') filterType = 'month';
        else if (buttonId === 'yearButton') filterType = 'year';

        chartContainer.classList.remove("no-data");
        // Pasar currentStartDate para que la gráfica refleje el mes/año seleccionado
        renderPurchaseChart(filteredData, filterType, currentStartDate);
      } else {
        tableContainer.innerHTML = "<tr><td colspan='6'>No hay datos disponibles.</td></tr>";
        updateTotalMonto();
        clearChart();
        chartContainer.classList.add("no-data");
      }

      updateDateDisplay(buttonId);
      manageNavigationButtons(buttonId, navigationContainer);
    } catch (error) {
      console.error("Error al filtrar los datos:", error);
    }
  }

  // Función para gestionar los botones de navegación
  function manageNavigationButtons(buttonId, container) {
    container.innerHTML = ""; // Limpiar botones existentes

    if (buttonId === "todayButton") return; // No mostrar botones para "Hoy"

    const prevButton = document.createElement("button");
    prevButton.textContent = "◄ Atrás";
    prevButton.className = "btn btn-sm btn-secondary me-2";
    prevButton.addEventListener("click", () => navigateTime(-1));

    const nextButton = document.createElement("button");
    nextButton.textContent = "Adelante ►";
    nextButton.className = "btn btn-sm btn-secondary";
    nextButton.addEventListener("click", () => navigateTime(1));

    container.appendChild(prevButton);
    container.appendChild(nextButton);
  }

  // Función para navegar en el tiempo
  function navigateTime(direction) {
    const filters = createDateFilters(); // Obtener filtros base

    if (currentFilterType === "week") {
      currentStartDate.setDate(currentStartDate.getDate() + (direction * 7));
      applyFilter(createWeekFilter(currentStartDate), "weekButton", navigationButtonsContainer);
    } else if (currentFilterType === "month") {
      currentStartDate.setMonth(currentStartDate.getMonth() + direction);
      applyFilter(createMonthFilter(currentStartDate), "monthButton", navigationButtonsContainer);
    } else if (currentFilterType === "year") {
      currentStartDate.setFullYear(currentStartDate.getFullYear() + direction);
      applyFilter(createYearFilter(currentStartDate), "yearButton", navigationButtonsContainer);
    }
  }

  // Función para actualizar el texto del filtro
  function updateDateDisplay(buttonId) {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    if (buttonId === "todayButton") {
      selectedDateDisplay.childNodes[0].textContent = "Datos del día: ";
      const dayName = dayNames[currentStartDate.getDay()];
      const day = currentStartDate.getDate();
      const month = monthNames[currentStartDate.getMonth()];
      const year = currentStartDate.getFullYear();
      selectedDateSpan.textContent = `${dayName} ${day} de ${month} de ${year}`;
    } else if (buttonId === "weekButton") {
      selectedDateDisplay.childNodes[0].textContent = "Datos de la semana: ";
      const dayOfWeek = currentStartDate.getDay();
      const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Lunes como inicio
      const startOfWeek = new Date(currentStartDate);
      startOfWeek.setDate(currentStartDate.getDate() + offset);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startDayName = dayNames[startOfWeek.getDay()];
      const startDay = startOfWeek.getDate();
      const startMonth = monthNames[startOfWeek.getMonth()];
      const endDayName = dayNames[endOfWeek.getDay()];
      const endDay = endOfWeek.getDate();
      const endMonth = monthNames[endOfWeek.getMonth()];
      const year = startOfWeek.getFullYear();

      selectedDateSpan.textContent = `${startDayName} ${startDay} de ${startMonth} a ${endDayName} ${endDay} de ${endMonth} de ${year}`;
    } else if (buttonId === "monthButton") {
      selectedDateDisplay.childNodes[0].textContent = "Datos del mes: ";
      const month = monthNames[currentStartDate.getMonth()];
      selectedDateSpan.textContent = `${month}`;
    } else if (buttonId === "yearButton") {
      selectedDateDisplay.childNodes[0].textContent = "Datos del año: ";
      const year = currentStartDate.getFullYear();
      selectedDateSpan.textContent = `${year}`;
    }
  }
}

export function createDateFilters() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const getStartOfLocalDay = (date) => {
    const localDate = new Date(date);
    localDate.setHours(0, 0, 0, 0);
    return localDate;
  };

  const getEndOfLocalDay = (date) => {
    const localDate = new Date(date);
    localDate.setHours(23, 59, 59, 999);
    return localDate;
  };

  const normalizeDate = (purchaseDate) => {
    const utcDate = new Date(purchaseDate);
    return new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
  };

  return {
    filterToday: (purchaseDate) => {
      const normalizedPurchaseDate = normalizeDate(purchaseDate);
      const startOfToday = getStartOfLocalDay(today);
      const endOfToday = getEndOfLocalDay(today);
      return normalizedPurchaseDate >= startOfToday && normalizedPurchaseDate <= endOfToday;
    },
    filterWeek: (purchaseDate) => createWeekFilter(today)(purchaseDate),
    filterMonth: (purchaseDate) => createMonthFilter(today)(purchaseDate),
    filterYear: (purchaseDate) => createYearFilter(today)(purchaseDate),
  };
}

// Filtro para una semana específica
function createWeekFilter(baseDate) {
  return (purchaseDate) => {
    const normalizedPurchaseDate = new Date(purchaseDate.getTime() + purchaseDate.getTimezoneOffset() * 60000);
    const dayOfWeek = baseDate.getDay();
    const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() + offset);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startOfWeekLocal = new Date(startOfWeek);
    startOfWeekLocal.setHours(0, 0, 0, 0);
    const endOfWeekLocal = new Date(endOfWeek);
    endOfWeekLocal.setHours(23, 59, 59, 999);

    return normalizedPurchaseDate >= startOfWeekLocal && normalizedPurchaseDate <= endOfWeekLocal;
  };
}

// Filtro para un mes específico
function createMonthFilter(baseDate) {
  return (purchaseDate) => {
    const normalizedPurchaseDate = new Date(purchaseDate.getTime() + purchaseDate.getTimezoneOffset() * 60000);
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const startOfMonthLocal = new Date(startOfMonth);
    startOfMonthLocal.setHours(0, 0, 0, 0);
    const endOfMonthLocal = new Date(endOfMonth);
    endOfMonthLocal.setHours(23, 59, 59, 999);

    return normalizedPurchaseDate >= startOfMonthLocal && normalizedPurchaseDate <= endOfMonthLocal;
  };
}

// Filtro para un año específico
function createYearFilter(baseDate) {
  return (purchaseDate) => {
    const normalizedPurchaseDate = new Date(purchaseDate.getTime() + purchaseDate.getTimezoneOffset() * 60000);
    const year = baseDate.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const startOfYearLocal = new Date(startOfYear);
    startOfYearLocal.setHours(0, 0, 0, 0);
    const endOfYearLocal = new Date(endOfYear);
    endOfYearLocal.setHours(23, 59, 59, 999);

    return normalizedPurchaseDate >= startOfYearLocal && normalizedPurchaseDate <= endOfYearLocal;
  };
}