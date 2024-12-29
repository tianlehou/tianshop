import "../register_Form.js";

document.addEventListener("DOMContentLoaded", () => {
  fetch('./auth/registerModal/register-modal.html')
    .then(response => response.text())
    .then(data => {
      document.getElementById('register-modal-container').innerHTML = data;

      // Importa y ejecuta las funcionalidades del formulario
      import("../register_Form.js").then(module => {
        module.initRegisterForm();
      }).catch(error => console.error('Error al cargar register_Form.js:', error));

      // Vincular eventos después de cargar el modal
      const passwordInput = document.getElementById('registerPassword');
      const togglePasswordShow = document.getElementById('registerTogglePasswordShow');
      const togglePasswordHide = document.getElementById('registerTogglePasswordHide');

      if (passwordInput && togglePasswordShow && togglePasswordHide) {
        togglePasswordShow.addEventListener('click', () => {
          passwordInput.type = 'text';
          togglePasswordShow.classList.add('hide');
          togglePasswordHide.classList.remove('hide');
        });

        togglePasswordHide.addEventListener('click', () => {
          passwordInput.type = 'password';
          togglePasswordShow.classList.remove('hide');
          togglePasswordHide.classList.add('hide');
        });
      } else {
        console.error("Elementos del modal no encontrados.");
      }
    })
    .catch(error => console.error('Error al cargar el modal:', error));
});

