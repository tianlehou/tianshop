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
export function renderPurchaseChart(data) {
  const ctx = document.getElementById("purchaseChart")?.getContext("2d");
  if (!ctx) return;

  // Limpiar gráfico anterior
  clearChart();

  // Procesar datos
  const chartData = processChartData(data);

  // Crear nuevo gráfico
  purchaseChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartData.labels,
      datasets: [{
        label: "Monto de compras",
        data: chartData.values,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.9
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
function processChartData(data) {
  const aggregatedData = data.reduce((acc, item) => {
    const monto = parseFloat(item.factura.monto?.replace(/[^0-9.-]+/g, "") || 0);
    const empresa = item.factura.empresa?.trim() || 'Sin nombre';
    
    if (!acc[empresa]) {
      acc[empresa] = 0;
    }
    acc[empresa] += monto;
    
    return acc;
  }, {});

  // Ordenar empresas por monto descendente
  const sortedEntries = Object.entries(aggregatedData)
    .sort(([, a], [, b]) => b - a);

  return {
    labels: sortedEntries.map(([label]) => label),
    values: sortedEntries.map(([, value]) => value)
  };
}