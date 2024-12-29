// forgot-password-modal.js
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { auth } from '../environment/firebaseConfig.js';

document.addEventListener("DOMContentLoaded", () => {
    const forgotPasswordModalContainer = document.getElementById("forgot-password-modal-container");

    fetch("./auth/forgot-password-modal.html")
        .then((response) => response.text())
        .then((data) => {
            forgotPasswordModalContainer.innerHTML = data;

            // Inicializar eventos después de cargar el modal
            const forgotPasswordForm = document.getElementById("forgotPasswordForm");
            if (forgotPasswordForm) {
                forgotPasswordForm.addEventListener("submit", (e) => {
                    e.preventDefault();

                    const email = document.getElementById("forgotPasswordEmail").value;

                    sendPasswordResetEmail(auth, email)
                        .then(() => {
                            document.getElementById("forgotPasswordSuccess").textContent =
                                "Correo enviado correctamente. Verifica tu bandeja de entrada.";
                        })
                        .catch((error) => {
                            document.getElementById("forgotPasswordError").textContent =
                                "Error al enviar el correo. Inténtalo de nuevo.";
                        });
                });
            }

            // Opcional: Inicializar Bootstrap si es necesario
            const modalElement = document.getElementById("forgotPasswordModal");
            if (modalElement) {
                const modalInstance = new bootstrap.Modal(modalElement);
                document.querySelector("[data-bs-target='#forgotPasswordModal']").addEventListener("click", () => {
                    modalInstance.show();
                });
            }
        })
        .catch((error) => console.error("Error al cargar el modal:", error));
});
