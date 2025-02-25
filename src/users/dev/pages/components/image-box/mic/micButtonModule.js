// Variables globales
let isListening = false;
let recognition = null;

// Inicializar el reconocimiento de voz
export function initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.error("Tu navegador no soporta la API de reconocimiento de voz.");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES'; // Configura el idioma
    recognition.interimResults = false; // Solo resultados finales
    recognition.maxAlternatives = 1; // Solo una alternativa

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        showResult(transcript);
    };

    recognition.onend = function() {
        if (isListening) {
            recognition.start(); // Reinicia el reconocimiento si aún está escuchando
        }
    };

    recognition.onerror = function(event) {
        console.error("Error en el reconocimiento de voz: ", event.error);
        stopListening();
    };
}

// Iniciar el reconocimiento de voz
export function startListening() {
    if (recognition) {
        isListening = true;
        recognition.start();
        updateUI(true);
    }
}

// Detener el reconocimiento de voz
export function stopListening() {
    if (recognition) {
        isListening = false;
        recognition.stop();
        updateUI(false);
    }
}

// Actualizar la interfaz de usuario
export function updateUI(isListening) {
    const startMic = document.getElementById('start-mic');
    const stopMic = document.getElementById('stop-mic');
    const micStatus = document.getElementById('mic-status');

    if (isListening) {
        startMic.classList.add('hide');
        stopMic.classList.remove('hide');
        micStatus.textContent = "Escuchando...";
    } else {
        startMic.classList.remove('hide');
        stopMic.classList.add('hide');
        micStatus.textContent = "Micrófono desactivado";
    }
}

// Mostrar el resultado del reconocimiento de voz
export function showResult(text) {
    const micAnswer = document.getElementById('mic-answer');
    micAnswer.textContent = text;
}

// Inicializar el módulo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initRecognition();

    // Event listeners para los botones
    document.getElementById('start-mic').addEventListener('click', function() {
        startListening();
    });

    document.getElementById('stop-mic').addEventListener('click', function() {
        stopListening();
    });
});