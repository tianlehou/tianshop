export async function initializeScanner() {
  const scannerContainer = document.getElementById("scanner-container");
  if (!scannerContainer) {
    console.error("No se encontró el contenedor del scanner.");
    return;
  }

  // Cargar el HTML del escáner dinámicamente
  try {
    const response = await fetch("./modules/scanner.html");
    if (!response.ok) throw new Error("Error al cargar el archivo HTML del escáner.");
    const scannerHTML = await response.text();
    scannerContainer.innerHTML = scannerHTML;
  } catch (error) {
    console.error("Error al cargar el HTML del escáner:", error);
    return;
  }

  // Inicializar funcionalidad después de cargar el HTML
  const startScanButton = document.getElementById("start-scan");
  const stopScanButton = document.getElementById("stop-scan");
  const barcodeResultElement = document.getElementById("barcode-result");
  const videoElement = document.getElementById("scanner-preview");
  const statusElement = document.getElementById("scan-status");
  const scannerFrame = document.getElementById("scanner-frame");

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
            debug: {
              drawBoundingBox: true,
              showFrequency: false,
              drawScanline: true,
              showPattern: false,
            },
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
          toggleButtonsVisibility(true);
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
    toggleButtonsVisibility(false);
    statusElement.textContent = "Estado: Escáner detenido";
    scannerFrame.style.display = "none";
  }

  function toggleButtonsVisibility(isScanning) {
    if (isScanning) {
      startScanButton.classList.add("hide");
      stopScanButton.classList.remove("hide");
    } else {
      startScanButton.classList.remove("hide");
      stopScanButton.classList.add("hide");
    }
  }

  let lastResult = null;
  let lastTime = 0;

  Quagga.onProcessed((result) => {
    const drawingCanvas = document.getElementById("interactive");
    const drawingContext = drawingCanvas.getContext("2d");

    if (drawingCanvas && drawingContext) {
      drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

      if (result && result.boxes) {
        drawingContext.beginPath();
        result.boxes
          .filter((box) => box !== result.box)
          .forEach((box) => {
            Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingContext, {
              color: "rgba(0, 255, 0, 0.6)",
              lineWidth: 2,
            });
          });
        drawingContext.closePath();
      }

      if (result && result.box) {
        drawingContext.beginPath();
        Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingContext, {
          color: "rgba(0, 0, 255, 0.6)",
          lineWidth: 2,
        });
        drawingContext.closePath();
      }
    }
  });

  Quagga.onDetected((data) => {
    const currentTime = new Date().getTime();
    const code = data.codeResult.code;

    if (code && (code !== lastResult || currentTime - lastTime > 2000)) {
      lastResult = code;
      lastTime = currentTime;

      barcodeResultElement.textContent = code;
      statusElement.textContent = "Estado: ¡Código detectado!";
      console.log("Código detectado:", code);

      if (navigator.vibrate) {
        navigator.vibrate(100);
      }

      stopScanning();
    }
  });

  startScanButton.addEventListener("click", startScanning);
  stopScanButton.addEventListener("click", stopScanning);
}

document.addEventListener("DOMContentLoaded", initializeScanner);
