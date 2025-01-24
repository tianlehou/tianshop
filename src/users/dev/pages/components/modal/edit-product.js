import { ref, get, update } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database, auth } from "../../../../../../environment/firebaseConfig.js";
import { showToast } from "../toast/toastLoader.js";
import { calcularCostoConItbmsYGanancia, formatInputAsDecimal } from "./utils/productCalculations.js";
import { getUserEmail } from "../../../../../modules/accessControl/getUserEmail.js";

export function initializeEditProduct() {
  const editProductModal = document.getElementById("editProductModal");
  const editForm = document.getElementById("editForm");

  if (!editProductModal || !editForm) {
    console.error("No se encontró el modal o el formulario para editar productos.");
    return;
  }

  let currentProductId = null;

  // Elementos del formulario
  const fecha = editForm.fecha;
  const empresa = editForm.empresa;
  const marca = editForm.marca;
  const descripcion = editForm.descripcion;
  const venta = editForm.venta;
  const costo = editForm.costo;
  const unidades = editForm.unidades;
  const costoUnitario = editForm.querySelector("#costoUnitario");
  const ganancia = editForm.querySelector("#ganancia");
  const porcentaje = editForm.querySelector("#porcentaje");
  const costoConItbmsDescuento = editForm.querySelector("#costoConItbms-Descuento");
  const itbms = editForm.querySelector("#itbms");
  const descuento = editForm.querySelector("#descuento");
  const costoConItbmsDescuentoLabel = editForm.querySelector("label[for='costoConItbms-Descuento']");

  formatInputAsDecimal(costo);
  formatInputAsDecimal(venta);
  formatInputAsDecimal(descuento);

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

  // Limpiar inputs al hacer clic en los botones correspondientes
  editForm.querySelectorAll(".clear-input").forEach((button) => {
    button.addEventListener("click", () => {
      const inputId = button.getAttribute("data-input");
      const inputElement = editForm.querySelector(`#${inputId}`);
      if (inputElement) {
        inputElement.value = "";
        handleCalculation(); // Recalcular valores relacionados
      }
    });
  });

  // Asignar valores iniciales al abrir el modal
  document.addEventListener("click", async (e) => {
    if (e.target.closest(".edit-product-button")) {
      const button = e.target.closest(".edit-product-button");
      currentProductId = button.dataset.id;

      try {
        const email = await getUserEmail(); // Obtener el correo del usuario
        if (!email) {
          showToast("No se pudo obtener el correo del usuario.", "error");
          return;
        }

        const productRef = ref(database, `users/${email.replaceAll(".", "_")}/productData/${currentProductId}`);
        const snapshot = await get(productRef);

        if (snapshot.exists()) {
          const productData = snapshot.val();

          // Asignar valores al formulario
          fecha.value = productData.fecha || "";
          empresa.value = productData.producto?.empresa || "";
          marca.value = productData.producto?.marca || "";
          descripcion.value = productData.producto?.descripcion || "";
          venta.value = productData.precio?.venta || "";
          costo.value = productData.precio?.costo || "";
          unidades.value = productData.precio?.unidades || "";
          itbms.value = productData.impuesto_descuento?.itbms || "";
          descuento.value = productData.impuesto_descuento?.descuento || "";

          handleCalculation(); // Calcular valores iniciales

          // Mostrar el modal
          const bootstrapModal = new bootstrap.Modal(editProductModal);
          bootstrapModal.show();
        } else {
          showToast("No se encontraron datos del producto seleccionado.", "error");
        }
      } catch (error) {
        console.error("Error al obtener datos del producto:", error);
        showToast("Hubo un error al cargar los datos del producto.", "error");
      }
    }
  });

  // Actualizar cálculos en tiempo real
  costo.addEventListener("input", handleCalculation);
  unidades.addEventListener("input", handleCalculation);
  itbms.addEventListener("change", handleCalculation);
  venta.addEventListener("input", handleCalculation);
  descuento.addEventListener("input", handleCalculation);

  // Guardar datos editados
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentProductId) {
      showToast("No se seleccionó ningún producto para editar.", "error");
      return;
    }

    const updatedProductData = {
      fecha: fecha.value,
      producto: {
        empresa: empresa.value.trim(),
        marca: marca.value.trim(),
        descripcion: descripcion.value.trim(),
      },
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

    // Confirmar antes de guardar
    const confirmar = confirm("¿Estás seguro de que deseas actualizar este producto?");
    if (!confirmar) {
      showToast("Actualización cancelada.", "info");
      return;
    }

    try {
      const email = await getUserEmail(); // Obtener el correo del usuario
      if (!email) {
        showToast("No se pudo obtener el correo del usuario.", "error");
        return;
      }

      // Referencias a nivel personal y global
      const userProductRef = ref(database, `users/${email.replaceAll(".", "_")}/productData/${currentProductId}`);
      const globalProductRef = ref(database, `global/productData/${currentProductId}`);

      // Actualizar en ambas ubicaciones
      await update(userProductRef, updatedProductData);
      await update(globalProductRef, { ...updatedProductData, actualizadoPor: email });

      showToast("Producto actualizado con éxito.", "success");

      // Cerrar el modal y resetear el formulario
      const bootstrapModal = bootstrap.Modal.getInstance(editProductModal);
      bootstrapModal.hide();
      editForm.reset();
    } catch (error) {
      console.error("Error al actualizar los datos del producto:", error);
      showToast("Hubo un error al actualizar el producto.", "error");
    }
  });
}
