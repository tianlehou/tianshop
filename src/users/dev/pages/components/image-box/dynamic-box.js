// Dymanic-box.js - JavaScript Principal
import { get, ref } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database } from "../../../../../../environment/firebaseConfig.js";
import { getUserEmail } from "../../../../../modules/accessControl/getUserEmail.js"; // Ajusta la ruta
import { mostrarDatos } from "../../home.js"; // Importa la función de home.js
import { setTableMode } from "../../modules/tabla/createTableElements.js"; // Importa para actualizar la tabla

document.addEventListener("DOMContentLoaded", async () => {
    const dynamicContent = document.getElementById("dynamic-content");
    const buttonContainer = document.getElementById("scan-button-container");
    const tableHeadersElement = document.getElementById("table-headers");
    const tableContent = document.getElementById("tableContent");

    if (!dynamicContent || !buttonContainer) {
        console.error("Los contenedores dinámicos no se encontraron");
        return;
    }

    // Función para cargar contenido HTML dinámico
    async function loadHTML(filePath, container) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`Error al cargar ${filePath}`);
            container.innerHTML = await response.text();
        } catch (error) {
            console.error(`Error al cargar el archivo: ${filePath}`, error);
        }
    }

    // Inicialmente cargar los botones de micrófono y el carrusel
    await loadHTML("./components/image-box/mic/mic-button.html", buttonContainer);
    await loadHTML("./components/image-box/carrucel/carrucel.html", dynamicContent);

    // Variables para grabación de audio
    let mediaRecorder;
    let audioChunks = [];

    // Agregar eventos a los botones de micrófono
    function setupButtonEvents() {
        const startMicButton = document.getElementById("start-mic");
        const stopMicButton = document.getElementById("stop-mic");

        if (!startMicButton || !stopMicButton) {
            console.error("Botones de micrófono no encontrados.");
            return;
        }

        // Iniciar grabación y cargar el contenedor mic.html
        startMicButton.addEventListener("click", async () => {
            await loadHTML("./components/image-box/mic/mic.html", dynamicContent);

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                    const audioUrl = URL.createObjectURL(audioBlob);

                    // Guardar en localStorage como base64
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = () => {
                        localStorage.setItem("recordedAudio", reader.result);
                    };

                    // Convertir audio a texto
                    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                    recognition.lang = "es-ES"; // Ajusta el idioma según necesites
                    recognition.onresult = async (event) => {
                        const transcript = event.results[0][0].transcript.toLowerCase();
                        document.getElementById("mic-result-text").textContent = `Buscando: "${transcript}"`;

                        // Buscar en Firebase
                        const results = await searchInDatabase(transcript);
                        displayResults(results);
                    };
                    recognition.onerror = (event) => {
                        console.error("Error en reconocimiento de voz:", event.error);
                        document.getElementById("mic-result-text").textContent = "Error al reconocer el audio.";
                    };

                    const audio = new Audio(audioUrl);
                    audio.onloadeddata = () => {
                        recognition.start();
                    };
                    audio.play();
                };

                mediaRecorder.start();
                startMicButton.classList.add("hide");
                stopMicButton.classList.remove("hide");
            } catch (error) {
                console.error("Error al acceder al micrófono:", error);
            }
        });

        // Detener grabación y mantener el contenedor por 30 segundos
        stopMicButton.addEventListener("click", () => {
            if (mediaRecorder && mediaRecorder.state !== "inactive") {
                mediaRecorder.stop();
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }

            stopMicButton.classList.add("hide");
            startMicButton.classList.remove("hide");

            // Esperar 30 segundos antes de volver al carrusel
            setTimeout(async () => {
                await restoreToDefaultContent();
            }, 30000); // 30 segundos
        });
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

        const results = [];
        snapshot.forEach((childSnapshot) => {
            const product = childSnapshot.val();
            const { empresa, marca, descripcion } = product.producto;
            const searchString = `${empresa} ${marca} ${descripcion}`.toLowerCase();

            if (searchString.includes(query)) {
                results.push({ id: childSnapshot.key, ...product });
            }
        });

        return results;
    }

    // Función para mostrar los resultados
    async function displayResults(results) {
        const resultText = document.getElementById("mic-result-text");
        if (results.length > 0) {
            resultText.innerHTML = `Resultados encontrados (${results.length}):<br>` + 
                results.map(r => `${r.producto.empresa} ${r.producto.marca} - ${r.producto.descripcion}`).join("<br>");
            // Actualizar la tabla con los resultados
            await mostrarDatos(() => {
                setTableMode("full", tableHeadersElement, tableContent, results);
            }, results);
        } else {
            resultText.textContent = "No se encontraron resultados.";
            // Restaurar la tabla completa si no hay resultados
            await mostrarDatos();
        }
    }

    // Función para restaurar al contenido predeterminado
    async function restoreToDefaultContent() {
        await loadHTML("./components/image-box/carrucel/carrucel.html", dynamicContent);
        const startMicButton = document.getElementById("start-mic");
        const stopMicButton = document.getElementById("stop-mic");

        if (startMicButton) startMicButton.classList.remove("hide");
        if (stopMicButton) stopMicButton.classList.add("hide");
        // Restaurar la tabla completa
        await mostrarDatos();
    }

    // Configurar eventos después de cargar los botones
    setupButtonEvents();
});