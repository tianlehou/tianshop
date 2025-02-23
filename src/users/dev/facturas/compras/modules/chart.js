// chart.js
let purchaseChartInstance = null; // Variable privada

// Función para limpiar el gráfico
export function clearChart() {
  if (purchaseChartInstance) {
    purchaseChartInstance.destroy();
    purchaseChartInstance = null;
  }
}

// Función principal para renderizar el gráfico
export function renderPurchaseChart(data, filterType = 'company') {
  const ctx = document.getElementById("purchaseChart")?.getContext("2d");
  if (!ctx) return;

  // Limpiar gráfico anterior
  clearChart();

  // Procesar datos
  const chartData = processChartData(data, filterType);

  // Definir colores para las barras
  const barColors = [
    'rgba(54, 162, 235, 0.8)',  // Azul
    'rgba(75, 192, 192, 0.8)',  // Verde
    'rgba(255, 206, 86, 0.8)',  // Amarillo
    'rgba(255, 159, 64, 0.8)',  // Naranja
    'rgba(255, 99, 132, 0.8)',  // Rojo
    'rgba(153, 102, 255, 0.8)', // Violeta
  ];

  // Asignar colores a las barras de manera cíclica
  const backgroundColors = chartData.labels.map((_, index) => {
    return barColors[index % barColors.length];
  });

  // Crear nuevo gráfico
  purchaseChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartData.labels,
      datasets: [{
        label: "Monto de compras",
        data: chartData.values,
        backgroundColor: backgroundColors, // Usar los colores definidos
        borderColor: backgroundColors.map(color => color.replace('0.8', '1')), // Bordes con opacidad completa
        borderWidth: 1,
        barPercentage: 0.9, // Ajusta este valor para controlar el ancho de las barras
        categoryPercentage: 0.9, // Ajusta este valor para controlar el espacio entre categorías
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Total de compras por empresa",
          font: { size: 18 },
          padding: { top: 10, bottom: 20 }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y || 0;
              return ` Monto: $${value.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Monto Total (USD)',
            font: { weight: 'bold' }
          },
          ticks: {
            callback: (value) => `$${value.toLocaleString('en-US', {minimumFractionDigits: 2})}`,
            padding: 10,
            font: { size: 12 }
          },
          grid: {
            color: "rgba(0,0,0,0.05)",
            drawBorder: false
          }
        },
        x: {
          title: {
            display: true,
            text: 'Empresas',
            font: { weight: 'bold' }
          },
          ticks: {
            autoSkip: false,
            maxRotation: 90,
            minRotation: 90,
            font: { size: 12 },
            padding: 5
          },
          grid: { display: false }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    }
  });
}

// Función para procesar datos
function processChartData(data, filterType) {
  if (filterType === 'week') {
    // Lógica existente para el filtro de semana
    const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const aggregatedData = new Array(7).fill(0);

    data.forEach(item => {
      const purchaseDate = new Date(item.fecha);
      const normalizedDate = new Date(purchaseDate.getTime() + purchaseDate.getTimezoneOffset() * 60000);
      const purchaseDay = normalizedDate.getDay();
      const adjustedIndex = purchaseDay === 0 ? 6 : purchaseDay - 1;

      const monto = parseFloat((item.factura.monto || '').replace(/[^0-9.-]/g, '') || 0);
      aggregatedData[adjustedIndex] += monto;
    });

    return {
      labels: daysOfWeek,
      values: aggregatedData
    };
  } else if (filterType === 'year') {
    // Lógica existente para el filtro de año
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const aggregatedData = new Array(12).fill(0);

    data.forEach(item => {
      const purchaseDate = new Date(item.fecha);
      const normalizedDate = new Date(purchaseDate.getTime() + purchaseDate.getTimezoneOffset() * 60000);
      const purchaseMonth = normalizedDate.getMonth(); // Obtener el mes (0-11)

      const monto = parseFloat((item.factura.monto || '').replace(/[^0-9.-]/g, '') || 0);
      aggregatedData[purchaseMonth] += monto;
    });

    return {
      labels: monthNames,
      values: aggregatedData
    };
  } else if (filterType === 'month') {
    // Lógica para el filtro de mes
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Último día del mes

    // Crear un array para almacenar los montos de cada día del mes
    const aggregatedData = new Array(lastDayOfMonth).fill(0);

    data.forEach(item => {
      const purchaseDate = new Date(item.fecha);
      const normalizedDate = new Date(purchaseDate.getTime() + purchaseDate.getTimezoneOffset() * 60000);
      const purchaseDay = normalizedDate.getDate(); // Obtener el día del mes (1-31)

      // Verificar si la compra pertenece al mes actual
      if (
        normalizedDate.getFullYear() === currentYear &&
        normalizedDate.getMonth() === currentMonth
      ) {
        const monto = parseFloat((item.factura.monto || '').replace(/[^0-9.-]/g, '') || 0);
        aggregatedData[purchaseDay - 1] += monto; // Restar 1 para ajustar al índice del array
      }
    });

    // Crear las etiquetas para los días del mes (1, 2, 3, ..., último día)
    const labels = Array.from({ length: lastDayOfMonth }, (_, i) => (i + 1).toString());

    return {
      labels: labels,
      values: aggregatedData
    };
  } else {
    // Lógica predeterminada para agrupar por empresa
    const aggregatedData = data.reduce((acc, item) => {
      const monto = parseFloat((item.factura.monto || '').replace(/[^0-9.-]/g, '') || 0);
      const empresa = item.factura.empresa?.trim() || 'Sin nombre';
      
      if (!acc[empresa]) acc[empresa] = 0;
      acc[empresa] += monto;
      
      return acc;
    }, {});

    const sortedEntries = Object.entries(aggregatedData).sort(([, a], [, b]) => b - a);
    
    return {
      labels: sortedEntries.map(([label]) => label),
      values: sortedEntries.map(([, value]) => value)
    };
  }
}