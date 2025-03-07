// chart.js
let purchaseChartInstance = null;

// Función para limpiar el gráfico existente
export function clearChart() {
  if (purchaseChartInstance) {
    purchaseChartInstance.destroy();
    purchaseChartInstance = null;
  }
}

// Función principal para renderizar el gráfico
export function renderPurchaseChart(data, filterType = 'company', baseDate = new Date(), isSearchFilter = false) {
  const ctx = document.getElementById("purchaseChart")?.getContext("2d");
  if (!ctx) return;

  clearChart();

  const chartData = processChartData(data, filterType, baseDate, isSearchFilter);

  // Colores predefinidos para las barras
  const barColors = [
    'rgba(54, 162, 235, 0.8)',
    'rgba(75, 192, 192, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(153, 102, 255, 0.8)',
  ];

  const backgroundColors = chartData.labels.map((_, index) => {
    return barColors[index % barColors.length];
  });

  purchaseChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartData.labels,
      datasets: [{
        label: "Monto de compras",
        data: chartData.values,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
        borderWidth: 1,
        barPercentage: 0.9,
        categoryPercentage: 0.9,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: isSearchFilter ? "Compras filtradas por búsqueda" : (filterType === 'month' ? `Total de compras por día - ${baseDate.toLocaleString('es', { month: 'long', year: 'numeric' })}` : "Total de compras por empresa"),
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
            text: isSearchFilter ? 'Fechas de compra' : (filterType === 'month' ? 'Días' : 'Empresas'),
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

// Función para procesar datos según el tipo de filtro
function processChartData(data, filterType, baseDate, isSearchFilter) {
  if (isSearchFilter) {
    // Mostrar una barra por cada compra individual con su fecha
    const labels = data.map(item => {
      const purchaseDate = new Date(item.fecha);
      return purchaseDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    });
    const values = data.map(item => parseFloat((item.factura?.monto || '0').replace(/[^0-9.-]/g, '')));
    return { labels, values };
  } else if (filterType === 'week') {
    const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const aggregatedData = new Array(7).fill(0);

    data.forEach(item => {
      const purchaseDate = new Date(item.fecha);
      const normalizedDate = new Date(purchaseDate.getTime() + purchaseDate.getTimezoneOffset() * 60000);
      const purchaseDay = normalizedDate.getDay();
      const adjustedIndex = purchaseDay === 0 ? 6 : purchaseDay - 1;

      const monto = parseFloat((item.factura?.monto || '0').replace(/[^0-9.-]/g, '') || 0);
      aggregatedData[adjustedIndex] += monto;
    });

    return {
      labels: daysOfWeek,
      values: aggregatedData
    };
  } else if (filterType === 'year') {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const aggregatedData = new Array(12).fill(0);

    data.forEach(item => {
      const purchaseDate = new Date(item.fecha);
      const normalizedDate = new Date(purchaseDate.getTime() + purchaseDate.getTimezoneOffset() * 60000);
      const purchaseMonth = normalizedDate.getMonth();

      const monto = parseFloat((item.factura?.monto || '0').replace(/[^0-9.-]/g, '') || 0);
      aggregatedData[purchaseMonth] += monto;
    });

    return {
      labels: monthNames,
      values: aggregatedData
    };
  } else if (filterType === 'month') {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    const aggregatedData = new Array(lastDayOfMonth).fill(0);

    data.forEach(item => {
      const purchaseDate = new Date(item.fecha);
      const normalizedDate = new Date(purchaseDate.getTime() + purchaseDate.getTimezoneOffset() * 60000);
      const purchaseDay = normalizedDate.getDate();

      if (
        normalizedDate.getFullYear() === year &&
        normalizedDate.getMonth() === month
      ) {
        const monto = parseFloat((item.factura?.monto || '0').replace(/[^0-9.-]/g, '') || 0);
        aggregatedData[purchaseDay - 1] += monto;
      }
    });

    const labels = Array.from({ length: lastDayOfMonth }, (_, i) => (i + 1).toString());

    return {
      labels: labels,
      values: aggregatedData
    };
  } else {
    const aggregatedData = data.reduce((acc, item) => {
      const monto = parseFloat((item.factura?.monto || '0').replace(/[^0-9.-]/g, '') || 0);
      const empresa = item.factura?.empresa?.trim() || 'Sin nombre';
      
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