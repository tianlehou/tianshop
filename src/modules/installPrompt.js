// installPrompt.js
let deferredPrompt;

export function setupInstallPrompt(buttonId) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Muestra el botón de instalación personalizado
    const installButton = document.getElementById(buttonId);
    if (installButton) {
      installButton.style.display = 'block';

      installButton.addEventListener('click', () => {
        installButton.style.display = 'none';
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('El usuario aceptó la instalación');
          } else {
            console.log('El usuario rechazó la instalación');
          }
          deferredPrompt = null;
        });
      });
    }
  });
}
