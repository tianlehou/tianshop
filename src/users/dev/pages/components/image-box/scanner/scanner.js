export function initializeScanner() {
    const scannerFrame = document.getElementById("scanner-frame");
    const videoElement = document.getElementById("scanner-preview");
    const statusElement = document.getElementById("scan-status");
    const barcodeResultElement = document.getElementById("barcode-result");

    // Verificar nuevamente que los elementos existan
    if (!scannerFrame || !videoElement || !statusElement) {
        console.error("Elementos del escáner no encontrados.");
        return;
    }

    async function startScanning() {
        try {
            scannerFrame.style.display = "block";
            statusElement.textContent = "Estado: Iniciando cámara...";

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            });

            videoElement.srcObject = stream;
            await videoElement.play();

            statusElement.textContent = "Estado: Escaneando...";

            Quagga.init(
                {
                    inputStream: {
                        name: "Live",
                        type: "LiveStream",
                        target: videoElement,
                        constraints: {
                            facingMode: "environment",
                        },
                        area: {
                            top: "20%",
                            right: "10%",
                            left: "10%",
                            bottom: "20%",
                        },
                    },
                    decoder: {
                        readers: ["code_128_reader", "ean_reader", "ean_8_reader"],
                        multiple: false,
                    },
                    locate: true,
                    frequency: 10,
                },
                function (err) {
                    if (err) {
                        console.error("Error al iniciar Quagga:", err);
                        statusElement.textContent = "Estado: Error al iniciar el escáner";
                        scannerFrame.style.display = "none";
                        return;
                    }

                    console.log("Quagga inicializado correctamente");
                    Quagga.start();
                }
            );
        } catch (err) {
            console.error("Error al acceder a la cámara:", err);
            statusElement.textContent = "Estado: Error al acceder a la cámara";
            scannerFrame.style.display = "none";
        }
    }

    function stopScanning() {
        if (videoElement.srcObject) {
            const tracks = videoElement.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
            videoElement.srcObject = null;
        }

        Quagga.stop();
        statusElement.textContent = "Estado: Escáner detenido";
        scannerFrame.style.display = "none";
    }

    Quagga.onDetected((data) => {
        const code = data.codeResult.code;
        if (code) {
            barcodeResultElement.textContent = `Código detectado: ${code}`;
            statusElement.textContent = "Estado: Código detectado!";
            console.log("Código detectado:", code);

            if (navigator.vibrate) {
                navigator.vibrate(100);
            }

            stopScanning();
        }
    });

    startScanning();
}
