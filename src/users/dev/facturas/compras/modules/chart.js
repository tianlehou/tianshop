// chart.js
export function renderPurchaseChart(data) {
  const ctx = document.getElementById("purchaseChart").getContext("2d");

  // Extraer fechas, montos y nombres de las empresas
  const fechas = data.map((item) => new Date(item.fecha).toLocaleDateString());
  const montos = data.map((item) => parseFloat(item.factura.monto || 0));
  const empresas = data.map((item) => item.factura.empresa);  // Extraer el nombre de la empresa

  // Configuración del gráfico
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: empresas,  // Usar los nombres de las empresas como etiquetas
      datasets: [
        {
          label: "Monto de Compras",
          data: montos,
          borderColor: " #009087",
          backgroundColor: " #a8d5ba",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true, position: "top" },
        tooltip: { callbacks: { label: (ctx) => `$${ctx.raw.toFixed(2)}` } },
      },
      scales: {
        x: { 
          title: { display: true, text: fechas },  // Título del eje X
        },
        y: { 
          title: { display: true, text: "Monto (USD)" }, 
          beginAtZero: true,
        },
      },
    },
  });
}
