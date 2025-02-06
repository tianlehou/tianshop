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
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `$${value.toLocaleString('en-US', {minimumFractionDigits: 2})}`
          }
        },
        x: {
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y || 0;
              return `Monto: $${value.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
            }
          }
        }
      }
    }
  });
}

// Función para procesar datos
function processChartData(data) {
  const aggregatedData = data.reduce((acc, item) => {
    const monto = parseFloat(item.factura.monto?.replace(/[^0-9.-]+/g, "") || 0);
    const empresa = item.factura.empresa || 'Sin nombre';
    acc[empresa] = (acc[empresa] || 0) + monto;
    return acc;
  }, {});

  return {
    labels: Object.keys(aggregatedData),
    values: Object.values(aggregatedData)
  };
}