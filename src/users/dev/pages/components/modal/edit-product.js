import { ref, get, update } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database } from "../../../../../../environment/firebaseConfig.js";
import { calcularCostoConItbmsYGanancia, formatInputAsDecimal } from "./utils/productCalculations.js";
import { getUserEmail } from "../../../../../modules/accessControl/getUserEmail.js";
import { showConfirmModal } from "../../../../../components/confirmation-modal/confirmModal.js"
import { showToast } from "../../../../../components/toast/toastLoader.js";

export function initializeEditProduct() {
  const editProductModal = document.getElementById("editProductModal");
  const editForm = document.getElementById("editForm");
  const debug = true;

  if (!editProductModal || !editForm) {
    console.error("[EDIT-PRODUCT] Error: Elementos principales no encontrados");
    return;
  }

  const formElements = {
    fecha: editForm.querySelector('[data-field="fecha"]'),
    empresa: editForm.querySelector('[data-field="empresa"]'),
    marca: editForm.querySelector('[data-field="marca"]'),
    descripcion: editForm.querySelector('[data-field="descripcion"]'),
    venta: editForm.querySelector('[data-field="venta"]'),
    costo: editForm.querySelector('[data-field="costo"]'),
    unidades: editForm.querySelector('[data-field="unidades"]'),
    costoUnitario: editForm.querySelector('[data-field="costoUnitario"]'),
    ganancia: editForm.querySelector('[data-field="ganancia"]'),
    porcentaje: editForm.querySelector('[data-field="porcentaje"]'),
    costoConItbmsDescuento: editForm.querySelector('[data-field="costoConItbmsDescuento"]'),
    itbms: editForm.querySelector('[data-field="itbms"]'),
    descuento: editForm.querySelector('[data-field="descuento"]'),
    costoConItbmsDescuentoLabel: editForm.querySelector('[data-label="costoConItbmsDescuento"]')
  };

  const missingElements = Object.entries(formElements)
    .filter(([_, el]) => !el)
    .map(([name]) => name);

  if (missingElements.length > 0) {
    console.error("[EDIT-PRODUCT] Elementos faltantes:", missingElements);
    showToast("Error de configuración del formulario", "error");
    return;
  }

  formatInputAsDecimal(formElements.costo);
  formatInputAsDecimal(formElements.venta);
  formatInputAsDecimal(formElements.descuento);

  let currentProductId = null;
  let email = null;

  const setupEventListeners = () => {
    const calculationInputs = [
      formElements.costo,
      formElements.unidades,
      formElements.itbms,
      formElements.venta,
      formElements.descuento
    ];

    calculationInputs.forEach(input => {
      input.addEventListener('input', handleCalculation);
    });

    editForm.querySelectorAll('[data-action="clear-input"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const targetId = e.currentTarget.dataset.target;
        const input = formElements[targetId];
        if (input) {
          input.value = '';
          input.dispatchEvent(new Event('input'));
          handleCalculation();
        }
      });
    });

    document.addEventListener('click', handleEditButtonClick);
    editForm.addEventListener('submit', handleFormSubmit);
  };

  const handleCalculation = () => {
    try {
      calcularCostoConItbmsYGanancia({
        ventaInput: formElements.venta,
        costoInput: formElements.costo,
        unidadesInput: formElements.unidades,
        itbmsInput: formElements.itbms,
        descuentoInput: formElements.descuento,
        costoConItbmsDescuentoInput: formElements.costoConItbmsDescuento,
        costoUnitarioInput: formElements.costoUnitario,
        gananciaInput: formElements.ganancia,
        porcentajeInput: formElements.porcentaje,
        costoConItbmsDescuentoLabel: formElements.costoConItbmsDescuentoLabel
      });
    } catch (error) {
      console.error("[EDIT-PRODUCT] Error en cálculo:", error);
      if (debug) showToast(`Error en cálculo: ${error.message}`, "error");
    }
  };

  const handleEditButtonClick = async (e) => {
    const editButton = e.target.closest('.edit-product-button');
    if (!editButton) return;

    try {
      currentProductId = editButton.dataset.id;
      email = await getUserEmail();

      if (!email) {
        showToast("Debes iniciar sesión para editar", "error");
        return;
      }

      const productRef = ref(database,
        `users/${email.replaceAll('.', '_')}/productData/${currentProductId}`
      );

      const snapshot = await get(productRef);

      if (snapshot.exists()) {
        loadProductData(snapshot.val());
        new bootstrap.Modal(editProductModal).show();
      } else {
        showToast("Producto no encontrado", "error");
      }
    } catch (error) {
      console.error("[EDIT-PRODUCT] Error al cargar producto:", error);
      showToast("Error al cargar el producto", "error");
    }
  };

  const loadProductData = (productData) => {
    try {
      const safeAssign = (element, value) => {
        if (element) {
          // Manejo especial para el select de ITBMS
          if (element === formElements.itbms) {
            element.value = String(value || 0);
            return;
          }

          const formattedValue = typeof value === 'number' ? value.toFixed(2) : value || '';
          element.value = formattedValue;
        }
      };

      safeAssign(formElements.fecha, productData.fecha);
      safeAssign(formElements.empresa, productData.producto?.empresa);
      safeAssign(formElements.marca, productData.producto?.marca);
      safeAssign(formElements.descripcion, productData.producto?.descripcion);
      safeAssign(formElements.venta, productData.precio?.venta);
      safeAssign(formElements.costo, productData.precio?.costo);
      safeAssign(formElements.unidades, productData.precio?.unidades);
      safeAssign(formElements.descuento, productData.impuesto_descuento?.descuento);
      safeAssign(formElements.costoUnitario, productData.precio?.costoUnitario);

      // Asignación especial para ITBMS
      const itbmsValue = productData.impuesto_descuento?.itbms || 0;
      formElements.itbms.value = String(itbmsValue);

      handleCalculation();
    } catch (error) {
      console.error("[EDIT-PRODUCT] Error en carga de datos:", error);
      showToast("Error al cargar datos del producto", "error");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!currentProductId || !email) {
      showToast("Estado inválido para edición", "error");
      return;
    }

    showConfirmModal(
      "¿Confirmas la actualización de este producto?",
      async () => {
        try {
          const updatedData = buildUpdatedProductData();
          await updateProductInDatabase(updatedData);
          showToast("Producto actualizado exitosamente", "success");
          closeModalAndRefresh();
        } catch (error) {
          console.error("[EDIT-PRODUCT] Error al actualizar:", error);
          showToast("Error al actualizar el producto", "error");
        }
      },
      () => {
        showToast("Edición cancelada", "info");
      }
    );
  };

  const buildUpdatedProductData = () => ({
    fecha: formElements.fecha.value,
    producto: {
      empresa: formElements.empresa.value.trim(),
      marca: formElements.marca.value.trim(),
      descripcion: formElements.descripcion.value.trim()
    },
    precio: {
      venta: parseFloat(formElements.venta.value).toFixed(2),
      costoUnitario: parseFloat(formElements.costoUnitario.value).toFixed(2),
      costo: parseFloat(formElements.costo.value).toFixed(2),
      ganancia: formElements.ganancia.value || "0",
      unidades: parseInt(formElements.unidades.value, 10) || 0,
      porcentaje: formElements.porcentaje.value || "0"
    },
    impuesto_descuento: {
      costoConItbmsDescuento: formElements.costoConItbmsDescuento.value || "0",
      itbms: parseInt(formElements.itbms.value, 10) || 0,
      descuento: parseFloat(formElements.descuento.value).toFixed(2)
    }
  });

  const updateProductInDatabase = async (updatedData) => {
    const userRef = ref(database,
      `users/${email.replaceAll('.', '_')}/productData/${currentProductId}`
    );

    const globalRef = ref(database, `global/productData/${currentProductId}`);

    await Promise.all([
      update(userRef, updatedData),
      update(globalRef, {
        ...updatedData,
        actualizadoPor: email,
        ultimaActualizacion: new Date().toISOString()
      })
    ]);
  };

  const closeModalAndRefresh = () => {
    try {
      const modalInstance = bootstrap.Modal.getInstance(editProductModal);
      if (modalInstance) modalInstance.hide();
      editForm.reset();
      window.dispatchEvent(new CustomEvent("refreshTable"));
    } catch (error) {
      console.error("[EDIT-PRODUCT] Error al cerrar modal:", error);
    }
  };

  setupEventListeners();
}