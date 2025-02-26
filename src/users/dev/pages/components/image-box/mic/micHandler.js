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
        const prefixes = ["muéstrame los productos de", "muéstrame los datos de", "busca", "encuentra"];
        let searchTerm = lowerTranscript;

        // Eliminar prefijos comunes
        for (const prefix of prefixes) {
            if (lowerTranscript.startsWith(prefix)) {
                searchTerm = lowerTranscript.replace(prefix, "").trim();
                break;
            }
        }

        // Opcional: eliminar palabras adicionales después del término principal
        const words = searchTerm.split(" ");
        return words[0]; // Tomar la primera palabra como término principal
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
            return [];
        }

        // Normalizar el término de búsqueda eliminando tildes
        const normalizedQuery = removeAccents(query.toLowerCase());
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

        return results;
    }

    // Función para mostrar los resultados
    async function displayResults(transcript, results) {
        const resultText = document.getElementById("mic-result-text");
        if (resultText) {
            // Mostrar la pregunta completa y los resultados
            resultText.innerHTML =
                `<strong>Pregunta:</strong> "${transcript}"<br>` +
                `Resultados encontrados: <span style="color: var(--clr-button); font-weight: 700;">(${results.length})</span><br>` +
                "--------------------------";
            // Actualizar la tabla con los resultados
            await mostrarDatos(() => {
                setTableMode("buy", tableHeadersElement, tableContent, results);
            }, results);
        }
    }

    // Función para detener la grabación y actualizar la UI
    function stopRecording(recognition, timeoutId, manual = false) {
        if (recognition) {
            recognition.stop();
        }
        clearTimeout(timeoutId); // Cancelar el temporizador en cualquier caso

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

        if (manual) {
            // Esperar 30 segundos antes de volver al carrusel
            setTimeout(async () => {
                await loadHTMLCallback("./components/image-box/carrucel/carrucel.html", dynamicContent);
            }, 30000);
        }
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
        let timeoutId; // Para almacenar el ID del temporizador

        startMicButton.addEventListener("click", async () => {
            await loadHTMLCallback("./components/image-box/mic/mic.html", dynamicContent);

            // Re-obtener los botones después de cargar el HTML dinámico
            startMicButton = document.getElementById("start-mic");
            stopMicButton = document.getElementById("stop-mic");
            const heading = dynamicContent.querySelector("h3");

            if (heading) heading.textContent = "Grabación en curso...";

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                recognition.lang = "es-ES"; // Ajusta el idioma según necesites
                recognition.continuous = false; // Detiene después de una sola frase
                recognition.interimResults = false; // Solo resultados finales

                recognition.onstart = () => {
                    const resultText = document.getElementById("mic-result-text");
                    if (resultText) resultText.textContent = "Escuchando...";

                    timeoutId = setTimeout(() => {
                        stopRecording(recognition, timeoutId, false); // Detención automática
                    }, 5000); // 5000 ms = 5 segundos
                };

                recognition.onresult = async (event) => {
                    clearTimeout(timeoutId); // Cancelar el temporizador si hay resultado
                    const transcript = event.results[0][0].transcript; // Texto completo
                    const query = extractSearchTerm(transcript); // Extraer término de búsqueda
                    const results = await searchInDatabase(query);
                    displayResults(transcript, results); // Pasar el texto original para mostrarlo
                    stopRecording(recognition, timeoutId, true); // Detención tras resultado
                };

                recognition.onerror = (event) => {
                    clearTimeout(timeoutId); // Cancelar el temporizador si hay error
                    console.error("Error en reconocimiento de voz:", event.error);
                    const resultText = document.getElementById("mic-result-text");
                    if (resultText) resultText.textContent = "Error al reconocer el audio.";
                    stopRecording(recognition, timeoutId, false); // Detención por error
                };

                recognition.onend = () => {
                    stream.getTracks().forEach(track => track.stop()); // Detener el micrófono
                };

                recognition.start();
                if (startMicButton && stopMicButton) {
                    startMicButton.classList.add("hide");
                    stopMicButton.classList.remove("hide");
                }
            } catch (error) {
                console.error("Error al acceder al micrófono:", error);
                const resultText = document.getElementById("mic-result-text");
                if (resultText) resultText.textContent = "Error al acceder al micrófono.";
            }
        });

        stopMicButton.addEventListener("click", () => {
            stopRecording(recognition, timeoutId, true); // Detención manual
        });
    };
}