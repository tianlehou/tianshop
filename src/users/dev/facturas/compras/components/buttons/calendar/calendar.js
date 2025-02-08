// calendar.js
import { mostrarDatos } from "../../../purchase.js";
import { clearChart } from "../../../modules/chart.js";

function loadCalendarComponent() {
    // Cargar el HTML
    fetch('./components/buttons/calendar/calendar-modal.html')
        .then(response => response.text())
        .then(html => {
            const container = document.getElementById('calendar-container');
            container.innerHTML = html;

            // Cargar el CSS dinámicamente
            const cssPath = './components/buttons/calendar/calendar.css';
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            document.head.appendChild(link);

            // Asignar eventos después de cargar el HTML
            assignCalendarEvents();
        })
        .catch(error => console.error('Error cargando el componente:', error));
}

// Llamar la función para cargar el componente
loadCalendarComponent();

// Variables globales
let currentDate = new Date();
let selectedDate = null;

// Función para asignar eventos
function assignCalendarEvents() {
    // Asignar evento al botón de abrir calendario
    const openButton = document.querySelector('#calendar-container button');
    if (openButton) {
        openButton.onclick = openCalendar;
    }

    // Asignar eventos a los botones de navegación
    const prevButton = document.querySelector('.nav-button[onclick="changeMonth(-1)"]');
    const nextButton = document.querySelector('.nav-button[onclick="changeMonth(1)"]');
    if (prevButton && nextButton) {
        prevButton.onclick = () => changeMonth(-1);
        nextButton.onclick = () => changeMonth(1);
    }

    // Asignar evento para cerrar el modal al hacer clic fuera
    const modal = document.getElementById('calendarModal');
    if (modal) {
        modal.onclick = function (event) {
            if (event.target === modal) {
                closeCalendar();
            }
        };
    }
}

// Función para actualizar la fecha seleccionada en el span
function updateSelectedDateDisplay(date) {
    const selectedDateDisplay = document.getElementById('selected-date');
    if (selectedDateDisplay) {
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const dayName = dayNames[date.getUTCDay()];
        const day = date.getUTCDate();
        const month = monthNames[date.getUTCMonth()];
        const year = date.getUTCFullYear();
        selectedDateDisplay.textContent = `${dayName} ${day} de ${month} de ${year}`;
    }
}

// Llamar a la función para actualizar la fecha al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    updateSelectedDateDisplay(new Date());
});

// Funciones del calendario
function openCalendar() {
    const modal = document.getElementById('calendarModal');
    if (modal) {
        modal.style.display = 'block';
        generateCalendar(currentDate);
    }
}

function closeCalendar() {
    const modal = document.getElementById('calendarModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function generateCalendar(date) {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYear = document.getElementById('currentMonthYear');

    if (!calendarGrid || !monthYear) return;

    // Configurar mes y año actual
    const month = date.getMonth();
    const year = date.getFullYear();

    // Crear el selector de mes
    const monthSelect = document.createElement('select');
    monthSelect.id = 'monthSelect';

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    monthNames.forEach((monthName, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = monthName;
        if (index === month) {
            option.selected = true;
        }
        monthSelect.appendChild(option);
    });

    // Crear el selector de año
    const yearSelect = document.createElement('select');
    yearSelect.id = 'yearSelect';

    // Rango de años (ajusta según tus necesidades)
    const startYear = 2020;
    const endYear = new Date().getFullYear() + 25;

    for (let y = startYear; y <= endYear; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        if (y === year) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }

    // Limpiar el contenido actual y agregar los selectores de mes y año
    monthYear.innerHTML = '';
    monthYear.appendChild(monthSelect);
    monthYear.appendChild(yearSelect);

    // Asignar eventos al cambiar el mes y el año
    monthSelect.addEventListener('change', (e) => {
        const selectedMonth = parseInt(e.target.value, 10);
        currentDate.setMonth(selectedMonth);
        generateCalendar(currentDate);
    });

    yearSelect.addEventListener('change', (e) => {
        const selectedYear = parseInt(e.target.value, 10);
        currentDate.setFullYear(selectedYear);
        generateCalendar(currentDate);
    });

    // Limpiar calendario
    calendarGrid.innerHTML = '';

    // Añadir días de la semana (Lun primero, Dom último)
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    days.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    });

    // Obtener primer día del mes
    const firstDay = new Date(year, month, 1);
    // Ajustar startingDay para que Lunes sea el primer día (0 = Lunes, 6 = Domingo)
    const startingDay = (firstDay.getDay() === 0) ? 6 : firstDay.getDay() - 1;

    // Obtener último día del mes
    const lastDay = new Date(year, month + 1, 0).getDate();

    // Rellenar días del mes actual
    const today = new Date();
    for (let i = 1; i <= lastDay; i++) {
        const dateElement = document.createElement('div');
        dateElement.className = 'calendar-date';
        dateElement.textContent = i;

        // Añadir offset para posicionamiento correcto
        if (i === 1) dateElement.style.gridColumnStart = startingDay + 1;

        // Verificar si el día es domingo
        const dayOfWeek = new Date(year, month, i).getDay();
        if (dayOfWeek === 0) {
            dateElement.classList.add('sunday');
        }

        // Resaltar fecha actual
        if (i === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()) {
            dateElement.classList.add('current-date');
        }

        dateElement.onclick = () => {
            selectedDate = new Date(Date.UTC(year, month, i));
            closeCalendar();
            clearChart();
            applyDateFilter(selectedDate);
            updateSelectedDateDisplay(selectedDate);
        };

        calendarGrid.appendChild(dateElement);
    }
}

function changeMonth(change) {
    currentDate.setMonth(currentDate.getMonth() + change);
    generateCalendar(currentDate);
}

// Nueva función para aplicar filtro de fecha
function applyDateFilter(selectedDate) {
  // Ajustar a UTC
  const startDate = new Date(selectedDate);
  startDate.setUTCHours(0, 0, 0, 0);

  const endDate = new Date(selectedDate);
  endDate.setUTCHours(23, 59, 59, 999);

  const filterFunction = (purchaseDate) => {
    const date = new Date(purchaseDate);
    return date >= startDate && date <= endDate;
  };

  mostrarDatos(null, filterFunction);
}