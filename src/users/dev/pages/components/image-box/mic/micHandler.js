// micHandler.js
import { get, ref } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database } from "../../../../../../../environment/firebaseConfig.js";
import { getUserEmail } from "../../../../../../modules/accessControl/getUserEmail.js";
import { mostrarDatos } from "../../../home.js";
import { setTableMode } from "../../../modules/tabla/createTableElements.js";

export function initializeMicHandler(loadHTMLCallback) {
    const dynamicContent = document.getElementById("dynamic-content");
    const tableHeadersElement = document.getElementById("table-headers");
    const tableContent = document.getElementById("tableContent");

    // Función para eliminar tildes y normalizar texto
    function removeAccents(text) {
        return text
            .normalize("NFD") // Descompone los caracteres en su base y signos diacríticos
            .replace(/[\u0300-\u036f]/g, ""); // Elimina los signos diacríticos
    }

    // Función para extraer el término de búsqueda de la consulta
    function extractSearchTerm(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        // Lista de frases comunes que podrían preceder al término de búsqueda
        const prefixes = ["muéstrame los productos de", "muéstrame los datos de", "buscar", "busca", "encuentra"];
        let searchTerm = lowerTranscript;

        console.log("Transcripción recibida:", lowerTranscript);

        // Eliminar prefijos comunes
        for (const prefix of prefixes) {
            if (lowerTranscript.startsWith(prefix)) {
                searchTerm = lowerTranscript.replace(prefix, "").trim();
                console.log("Prefijo encontrado:", prefix, "Término extraído:", searchTerm);
                break;
            }
        }

        // Si no se encuentra un prefijo, asumir que toda la transcripción es el término de búsqueda
        if (searchTerm === lowerTranscript) {
            console.warn("No se encontró un prefijo conocido, usando toda la transcripción como término de búsqueda:", searchTerm);
        }

        // Tomar todo el término después del prefijo (mejora anterior)
        console.log("Término final:", searchTerm);
        return searchTerm; // Cambio: devolver todo el searchTerm en lugar de solo words[0]
    }

    // Función para buscar en la base de datos
    async function searchInDatabase(query) {
        const email = await getUserEmail();
        if (!email) {
            console.error("No se pudo obtener el correo del usuario.");
            return [];
        }

        const userEmailKey = email.replaceAll(".", "_");
        const userProductsRef = ref(database, `users/${userEmailKey}/productData`);
        const snapshot = await get(userProductsRef);

        if (!snapshot.exists()) {
            console.log("No hay datos en la base de datos para este usuario.");
            return [];
        }

        // Normalizar el término de búsqueda eliminando tildes
        const normalizedQuery = removeAccents(query.toLowerCase());
        console.log("Query normalizado para búsqueda:", normalizedQuery);
        const results = [];
        snapshot.forEach((childSnapshot) => {
            const product = childSnapshot.val();
            const { empresa, marca, descripcion } = product.producto;

            // Normalizar los campos de búsqueda eliminando tildes
            const empresaLower = removeAccents(empresa.toLowerCase());
            const marcaLower = removeAccents(marca.toLowerCase());
            const descripcionLower = removeAccents(descripcion.toLowerCase());

            // Buscar el término normalizado en cualquiera de los campos normalizados
            if (empresaLower.includes(normalizedQuery) ||
                marcaLower.includes(normalizedQuery) ||
                descripcionLower.includes(normalizedQuery)) {
                results.push({ id: childSnapshot.key, ...product });
            }
        });

        console.log("Resultados encontrados:", results.length, results);
        return results;
    }

    // Función para mostrar los resultados con contador regresivo
    async function displayResults(transcript, results, carouselTimeoutId, noAudioDetected = false) {
        const resultText = document.getElementById("mic-result-text");
        if (resultText) {
            let secondsLeft = 30;
            if (noAudioDetected) {
                // Caso cuando no se detecta audio, con contador
                resultText.innerHTML = 
                    `No se detectó audio.<br>` +
                    `<span id="countdown">${secondsLeft.toString().padStart(2, "0")}</span>`;
            } else {
                // Caso con resultado o detención manual
                resultText.innerHTML =
                    `<strong>Pregunta:</strong> "${transcript}"<br>` +
                    `Resultados encontrados: <span style="color: var(--clr-button); font-weight: 700;">(${results.length})</span><br>` +
                    "--------------------------<br>" +
                    `<span id="countdown">${secondsLeft.toString().padStart(2, "0")}</span>`;

                await mostrarDatos(() => {
                    setTableMode("buy", tableHeadersElement, tableContent, results);
                }, results);
            }

            const countdownElement = document.getElementById("countdown");
            const intervalId = setInterval(() => {
                secondsLeft--;
                if (countdownElement) {
                    countdownElement.textContent = secondsLeft.toString().padStart(2, "0");
                    // Cambiar color a var(--clr-error) cuando faltan 10 segundos o menos
                    countdownElement.style.color = secondsLeft <= 10 ? "var(--clr-error)" : "";
                }
                if (secondsLeft <= 0) {
                    clearInterval(intervalId);
                }
            }, 1000);

            if (carouselTimeoutId) {
                setTimeout(() => {
                    clearInterval(intervalId);
                }, 30000);
            }
        }
    }

    // Función para detener la grabación y actualizar la UI
    function stopRecording(recognition, timeoutId, listenIntervalId, carouselTimeoutId, manual = false, transcript = null, results = []) {
        if (recognition) {
            recognition.stop();
        }
        clearTimeout(timeoutId); // Cancelar el temporizador de 7 segundos
        clearInterval(listenIntervalId); // Cancelar el intervalo del contador de escucha

        // Re-obtener los botones después de cualquier cambio en el DOM
        const startMicButton = document.getElementById("start-mic");
        const stopMicButton = document.getElementById("stop-mic");
        const heading = dynamicContent.querySelector("h3");

        if (heading) {
            heading.textContent = manual ? "Grabación detenida" : "Grabación detenida (tiempo agotado)";
        }

        if (startMicButton && stopMicButton) {
            stopMicButton.classList.add("hide");
            startMicButton.classList.remove("hide");
        } else {
            console.error("Botones de micrófono no encontrados al intentar detener la grabación.");
        }

        // Siempre establecer el temporizador de 30 segundos para el carrusel
        carouselTimeoutId = setTimeout(async () => {
            await loadHTMLCallback("./components/image-box/carrucel/carrucel.html", dynamicContent);
        }, 30000);

        if (manual || transcript) {
            displayResults(transcript || "Sin consulta", results, carouselTimeoutId, false);
        } else {
            displayResults(null, [], carouselTimeoutId, true); // Mostrar "No se detectó audio" con contador
        }

        return carouselTimeoutId;
    }

    // Configurar eventos de los botones de micrófono
    return function setupMicEvents() {
        let startMicButton = document.getElementById("start-mic");
        let stopMicButton = document.getElementById("stop-mic");

        if (!startMicButton || !stopMicButton) {
            console.error("Botones de micrófono no encontrados al inicializar.");
            return;
        }

        let recognition;
        let timeoutId; // Temporizador de 10 segundos (ajustado)
        let listenIntervalId; // Intervalo para el contador de escucha
        let carouselTimeoutId; // Temporizador de 30 segundos para el carrusel

        startMicButton.addEventListener("click", async () => {
            // Cancelar el temporizador del carrusel si existe
            if (carouselTimeoutId) {
                clearTimeout(carouselTimeoutId);
                carouselTimeoutId = null;
            }

            await loadHTMLCallback("./components/image-box/mic/mic.html", dynamicContent);

            // Re-obtener los botones después de cargar el HTML dinámico
            startMicButton = document.getElementById("start-mic");
            stopMicButton = document.getElementById("stop-mic");
            const heading = dynamicContent.querySelector("h3");

            if (heading) heading.textContent = "Grabación en curso...";

            try {
                // Solicitar permisos explícitamente antes de iniciar SpeechRecognition
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log("Micrófono activado con éxito, stream:", stream.active ? "activo" : "inactivo");

                // Usar SpeechRecognition con soporte para prefijo webkit (móviles)
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SpeechRecognition) {
                    console.error("SpeechRecognition no soportado en este navegador.");
                    const resultText = document.getElementById("mic-result-text");
                    if (resultText) resultText.textContent = "Reconocimiento de voz no soportado en este navegador.";
                    stream.getTracks().forEach(track => track.stop()); // Liberar el micrófono
                    return;
                }

                recognition = new SpeechRecognition();
                recognition.lang = "es-ES"; // Ajusta el idioma según necesites
                recognition.continuous = false; // Detiene después de una sola frase
                recognition.interimResults = true; // Capturar resultados parciales para mayor sensibilidad
                console.log("SpeechRecognition inicializado:", recognition);

                recognition.onstart = () => {
                    console.log("Grabación iniciada en el dispositivo.");
                    const resultText = document.getElementById("mic-result-text");
                    if (resultText) {
                        let dots = 0;
                        let secondsLeft = 10; // Contador inicial ajustado a 10 segundos
                        resultText.innerHTML = `Escuchando<span id="listeningDots"></span> (<span id="listenCountdown" style="color: var(--clr-error);">${secondsLeft}</span>)`;
                        const dotsElement = document.getElementById("listeningDots");
                        const countdownElement = document.getElementById("listenCountdown");

                        // Animación de puntos
                        const dotInterval = setInterval(() => {
                            dots = (dots + 1) % 4;
                            if (dotsElement) dotsElement.textContent = ".".repeat(dots);
                        }, 500);

                        // Contador regresivo de escucha
                        listenIntervalId = setInterval(() => {
                            secondsLeft--;
                            if (countdownElement) countdownElement.textContent = secondsLeft;
                            if (secondsLeft <= 0) clearInterval(listenIntervalId);
                        }, 1000);

                        // Limpiar intervalos al finalizar
                        recognition.onend = () => {
                            console.log("Grabación finalizada.");
                            clearInterval(dotInterval);
                            clearInterval(listenIntervalId);
                            stream.getTracks().forEach(track => track.stop());
                        };
                    }

                    timeoutId = setTimeout(() => {
                        console.log("Tiempo de grabación agotado (10 segundos).");
                        carouselTimeoutId = stopRecording(recognition, timeoutId, listenIntervalId, carouselTimeoutId, false); // Detención automática
                    }, 10000); // 10000 ms = 10 segundos
                };

                // Eventos adicionales para depurar detección de audio y voz
                recognition.onaudiostart = () => {
                    console.log("Audio detectado por SpeechRecognition.");
                };

                recognition.onspeechstart = () => {
                    console.log("Voz detectada por SpeechRecognition.");
                };

                recognition.onspeechend = () => {
                    console.log("Fin de la voz detectada.");
                };

                recognition.onresult = async (event) => {
                    console.log("Resultado recibido del micrófono:", event.results);
                    clearTimeout(timeoutId); // Cancelar el temporizador si hay resultado
                    clearInterval(listenIntervalId); // Cancelar el contador de escucha
                    const transcript = event.results[0][0].transcript; // Texto completo
                    const query = extractSearchTerm(transcript); // Extraer término de búsqueda
                    const results = await searchInDatabase(query);
                    carouselTimeoutId = stopRecording(recognition, timeoutId, listenIntervalId, carouselTimeoutId, true, transcript, results);
                };

                recognition.onerror = (event) => {
                    clearTimeout(timeoutId); // Cancelar el temporizador si hay error
                    clearInterval(listenIntervalId); // Cancelar el contador de escucha
                    console.error("Error en reconocimiento de voz:", event.error, "Mensaje:", event.message);
                    const resultText = document.getElementById("mic-result-text");
                    if (resultText) {
                        resultText.textContent = event.error === "no-speech" ? "No se detectó voz." :
                                                 event.error === "audio-capture" ? "Micrófono no disponible." :
                                                 event.error === "not-allowed" ? "Permiso denegado para usar el micrófono." :
                                                 event.error === "network" ? "Error de red, verifica tu conexión." :
                                                 "Error al reconocer el audio: " + event.error;
                    }
                    carouselTimeoutId = stopRecording(recognition, timeoutId, listenIntervalId, carouselTimeoutId, false); // Detención por error
                };

                console.log("Iniciando grabación...");
                recognition.start();
                if (startMicButton && stopMicButton) {
                    startMicButton.classList.add("hide");
                    stopMicButton.classList.remove("hide");
                }
            } catch (error) {
                console.error("Error al acceder al micrófono:", error.name, error.message);
                const resultText = document.getElementById("mic-result-text");
                if (resultText) {
                    resultText.textContent = error.name === "NotAllowedError" ? "Permiso denegado para usar el micrófono." :
                                             error.name === "NotFoundError" ? "No se encontró un micrófono disponible." :
                                             "Error al acceder al micrófono: " + error.message;
                }
            }
        });

        stopMicButton.addEventListener("click", () => {
            console.log("Detención manual solicitada.");
            carouselTimeoutId = stopRecording(recognition, timeoutId, listenIntervalId, carouselTimeoutId, true); // Detención manual
        });
    };
}