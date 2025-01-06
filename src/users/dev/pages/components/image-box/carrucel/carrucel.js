// image-box.js
document.addEventListener("DOMContentLoaded", function () {
    const imageBoxContainer = document.getElementById("image-box-container");

    fetch("./components/carrucel/image-box.html")
        .then(response => response.text())
        .then(data => {
            imageBoxContainer.innerHTML = data;

            // Inicializar el carrusel
            const carousel = new bootstrap.Carousel(document.querySelector('#carouselExampleIndicators'), {
                interval: 2500, // 5 segundos
                wrap: true,     // Permite que el carrusel vuelva al principio
                pause: 'hover'  // Pausa la rotación automática cuando el mouse está sobre el carrusel
            });

            // Si estás usando Bootstrap, inicializa los dropdowns después de cargar el contenido
            const dropdowns = document.querySelectorAll('.dropdown-toggle');
            dropdowns.forEach(dropdown => {
                new bootstrap.Dropdown(dropdown);
            });
        })
        .catch(error => console.error('Error al cargar el encabezado:', error));
});
