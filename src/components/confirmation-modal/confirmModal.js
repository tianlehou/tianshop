// confirmModal.js
export function showConfirmModal(message, onConfirm, onCancel) {
    // Crear el modal
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.zIndex = "10000";
  
    // Crear el contenido del modal
    const modalContent = document.createElement("div");
    modalContent.style.backgroundColor = "white";
    modalContent.style.padding = "20px";
    modalContent.style.borderRadius = "8px";
    modalContent.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    modalContent.style.textAlign = "center";
  
    // Mensaje del modal
    const modalMessage = document.createElement("p");
    modalMessage.textContent = message;
    modalMessage.style.marginBottom = "20px";
    modalMessage.style.fontSize = "16px";
  
    // Botones de confirmación y cancelación
    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Confirmar";
    confirmButton.style.backgroundColor = "#ff4444";
    confirmButton.style.color = "white";
    confirmButton.style.border = "none";
    confirmButton.style.padding = "10px 20px";
    confirmButton.style.borderRadius = "4px";
    confirmButton.style.cursor = "pointer";
    confirmButton.style.marginRight = "10px";
  
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancelar";
    cancelButton.style.backgroundColor = "#cccccc";
    cancelButton.style.color = "black";
    cancelButton.style.border = "none";
    cancelButton.style.padding = "10px 20px";
    cancelButton.style.borderRadius = "4px";
    cancelButton.style.cursor = "pointer";
  
    // Añadir eventos a los botones
    confirmButton.addEventListener("click", () => {
      onConfirm();
      document.body.removeChild(modal);
    });
  
    cancelButton.addEventListener("click", () => {
      if (onCancel) onCancel();
      document.body.removeChild(modal);
    });
  
    // Añadir elementos al modal
    modalContent.appendChild(modalMessage);
    modalContent.appendChild(confirmButton);
    modalContent.appendChild(cancelButton);
    modal.appendChild(modalContent);
  
    // Añadir el modal al body
    document.body.appendChild(modal);
  }