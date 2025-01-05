export function initializeScanner() {
  const scannerContainer = document.getElementById("scanner-container");
  if (!scannerContainer) {
    console.error("No se encontró el contenedor del scanner.");
    return;
  }

  scannerContainer.innerHTML = `
    <div class="scanner display-center">
      <h3>Escáner de Código de Barras</h3>
      <div id="scanner-frame" style="display: none; position: relative; width: 100%; max-width: 400px; margin: auto; border: 2px solid #ddd; border-radius: 8px; overflow: hidden;">
        <video id="scanner-preview" autoplay playsinline style="width: 100%; height: 300px; object-fit: cover;"></video>
        <canvas id="interactive" class="viewport" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></canvas>
        <div id="scanning-line" style="
          position: absolute;
          width: 100%;
          height: 2px;
          background: red;
          top: 50%;
          animation: scan 3s linear infinite;
        "></div>
      </div>
      <div class="disply-flex-center">
        <button id="start-scan" class="mt-3 custom-button">
          <i class="bi bi-upc-scan"></i>
        </button>
        <button id="stop-scan" class="mt-3 hide">
          <i class="bi bi-upc-scan"></i>
        </button>
      </div>

      <p id="scan-status" class="mt-2" style="color: #666;">Estado: Listo para escanear</p>
      <p id="scan-result" class="mt-2">Resultado: <span id="barcode-result"></span></p>
    </div>
    <style>
      @keyframes scan {
        0% {
          top: 20%;
        }
        50% {
          top: 80%;
        }
        100% {
          top: 20%;
        }
      }
      .hide {
        display: none;
      }

      #stop-scan {
        color: var(--clr-error);
        border-color: var(--clr-error);
      }
    </style>
  `;

  const startScanButton = document.getElementById("start-scan");
  const stopScanButton = document.getElementById("stop-scan");
  const barcodeResultElement = document.getElementById("barcode-result");
  const videoElement = document.getElementById("scanner-preview");
  const statusElement = document.getElementById("scan-status");
  const scannerFrame = document.getElementById("scanner-frame");

  async function startScanning() {
    try {
      scannerFrame.style.display = 'block';
      statusElement.textContent = "Estado: Iniciando cámara...";

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
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
              facingMode: "environment"
            },
            area: { 
              top: "20%",    
              right: "10%",  
              left: "10%",   
              bottom: "20%"  
            }
          },
          decoder: {
            readers: [
              "code_128_reader",
              "ean_reader",
              "ean_8_reader"
            ],
            multiple: false,
            debug: {
              drawBoundingBox: true,
              showFrequency: false,
              drawScanline: true,
              showPattern: false
            }
          },
          locate: true,
          frequency: 10
        },
        function(err) {
          if (err) {
            console.error("Error al iniciar Quagga:", err);
            statusElement.textContent = "Estado: Error al iniciar el escáner";
            scannerFrame.style.display = 'none';
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
      scannerFrame.style.display = 'none';
    }
  }

  function stopScanning() {
    if (videoElement.srcObject) {
      const tracks = videoElement.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoElement.srcObject = null;
    }
    Quagga.stop();
    toggleButtonsVisibility(false);
    statusElement.textContent = "Estado: Escáner detenido";
    scannerFrame.style.display = 'none';
  }

  function toggleButtonsVisibility(isScanning) {
    if (isScanning) {
      startScanButton.classList.add('hide');
      stopScanButton.classList.remove('hide');
    } else {
      startScanButton.classList.remove('hide');
      stopScanButton.classList.add('hide');
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
          .filter(box => box !== result.box)
          .forEach(box => {
            Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingContext, {
              color: "rgba(0, 255, 0, 0.6)",
              lineWidth: 2
            });
          });
        drawingContext.closePath();
      }

      if (result && result.box) {
        drawingContext.beginPath();
        Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingContext, {
          color: "rgba(0, 0, 255, 0.6)",
          lineWidth: 2
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
