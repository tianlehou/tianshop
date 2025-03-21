// register-product-modal.js
import { database } from "../../../../../../environment/firebaseConfig.js";
import { ref, push } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { showToast } from "../../../../../components/toast/toastLoader.js";
import { calcularCostoConItbmsYGanancia, formatInputAsDecimal } from "./utils/productCalculations.js";
import { getUserEmail } from "../../../../../modules/accessControl/getUserEmail.js";

export function initializeRegisterProduct() {
  const modalForm = document.getElementById("registerForm");
  if (!modalForm) {
    console.error("No se encontró el formulario del modal.");
    return;
  }

  // Obtener elementos del formulario
  const venta = document.getElementById("venta");
  const costo = document.getElementById("costo");
  const unidades = document.getElementById("unidades");
  const costoUnitario = document.getElementById("costoUnitario");
  const ganancia = document.getElementById("ganancia");
  const porcentaje = document.getElementById("porcentaje");
  const costoConItbmsDescuento = document.getElementById("costoConItbms-Descuento");
  const itbms = document.getElementById("itbms");
  const descuento = document.getElementById("descuento");
  const costoConItbmsDescuentoLabel = document.querySelector("label[for='costoConItbms-Descuento']");

  formatInputAsDecimal(costo);
  formatInputAsDecimal(venta);
  formatInputAsDecimal(descuento);

  // Cálculos en tiempo real
  function handleCalculation() {
    calcularCostoConItbmsYGanancia({
      ventaInput: venta,
      costoInput: costo,
      unidadesInput: unidades,
      itbmsInput: itbms,
      descuentoInput: descuento,
      costoConItbmsDescuentoInput: costoConItbmsDescuento,
      costoUnitarioInput: costoUnitario,
      gananciaInput: ganancia,
      porcentajeInput: porcentaje,
      costoConItbmsDescuentoLabel,
    });
  }

  costo.addEventListener("input", handleCalculation);
  unidades.addEventListener("input", handleCalculation);
  itbms.addEventListener("change", handleCalculation);
  venta.addEventListener("input", handleCalculation);
  descuento.addEventListener("input", handleCalculation);

  handleCalculation();

// Manejo del envío del formulario
modalForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fecha = document.getElementById("fecha").value;
  const empresa = document.getElementById("empresa").value.trim();
  const marca = document.getElementById("marca").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();

  if (!fecha || !empresa || !marca || !descripcion || isNaN(parseFloat(venta.value)) || isNaN(parseFloat(costo.value)) || isNaN(parseInt(unidades.value, 10))) {
    showToast("Por favor, completa todos los campos obligatorios.", "error");
    return;
  }

  const productData = {
    fecha,
    producto: { empresa, marca, descripcion },
    precio: {
      venta: parseFloat(venta.value).toFixed(2),
      costoUnitario: parseFloat(costoUnitario.value).toFixed(2),
      costo: parseFloat(costo.value).toFixed(2),
      ganancia: ganancia.value,
      unidades: parseInt(unidades.value, 10),
      porcentaje: porcentaje.value,
    },
    impuesto_descuento: {
      costoConItbmsDescuento: costoConItbmsDescuento.value,
      itbms: parseInt(itbms.value, 10) || 0,
      descuento: parseFloat(descuento.value) || 0,
    },
  };

  try {
    const email = await getUserEmail(); // Obtén el correo electrónico del usuario

    if (!email) {
      showToast("No se pudo obtener el correo del usuario.", "error");
      return;
    }

    // Guardar en la base de datos personal del usuario
    const userEmailKey = email.replaceAll(".", "_");
    const userProductsRef = ref(database, `users/${userEmailKey}/productData`); // Sustituye puntos en el email para evitar problemas en las claves
    await push(userProductsRef, productData);

    // Guardar en la base de datos global
    const globalProductsRef = ref(database, `global/productData`);
    await push(globalProductsRef, {
      ...productData,
      registradoPor: email, // Incluye el correo electrónico del usuario
    });

    showToast("Producto registrado con éxito.", "success");
    modalForm.reset();

    const modalElement = document.getElementById("registerProductModal");
    const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
    bootstrapModal.hide();
  } catch (error) {
    console.error("Error al guardar los datos:", error);
    showToast("Hubo un error al registrar el producto.", "error");
  }
});
}