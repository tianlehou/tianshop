export function initGraph(data) {
    const ctx = document.getElementById('priceComparisonChart').getContext('2d');
  
    // Procesar datos para la gráfica
    const products = [...new Set(data.map(item => item.descripcion))]; // Productos únicos
    const providers = [...new Set(data.map(item => item.empresa))]; // Proveedores únicos
  
    const datasets = providers.map(provider => {
      return {
        label: provider,
        data: products.map(product => {
          const match = data.find(item => item.descripcion === product && item.empresa === provider);
          return match ? match.costo : 0; // Costo del producto o 0 si no existe
        }),
        backgroundColor: getRandomColor(),
      };
    });
  
    // Crear la gráfica
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: products, // Nombres de productos
        datasets: datasets, // Datos de cada proveedor
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Comparación de Precios por Producto y Proveedor',
          },
          legend: {
            position: 'top',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Costo Final',
            },
          },
        },
      },
    });
  }
  
  // Función para generar colores aleatorios
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  