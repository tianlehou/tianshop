import "./auth/login_Form.js";
import "./auth/showHidePassword/showHidePassword.js";
import { setupInstallPrompt } from './src/modules/installPrompt.js';

// Textos que se mostrarán en el carrusel
const texts = [
    "",
    "Bienvenido a",
    "Minisuper Jimmy",
    "Inicia sesión",
  ];
  
  // Elemento h1 donde se mostrará el texto
  const carouselText = document.getElementById("carousel-text");
  
  let index = 0; // Índice para controlar los textos
  const timeInterval = 1250; // Intervalo de cambio de texto en milisegundos
  
  // Función que cambia el texto cada cierto tiempo
  function changeText() {
    carouselText.textContent = texts[index]; // Cambia el contenido del h1
    index = (index + 1) % texts.length; // Incrementa el índice y vuelve al primero si alcanza el final
  }
  
  // Inicia el carrusel
  setInterval(changeText, timeInterval);
  
  // Cambia el texto la primera vez al cargar la página
  changeText();
  setupInstallPrompt('installButton');