import { ref, get, update } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { database } from "../../../../../../environment/firebaseConfig.js";
import { showToast } from "../toast/toastLoader.js";
import { calcularCostoConItbmsYGanancia, formatInputAsDecimal } from "./utils/productCalculations.js";
import { getUserEmail } from "../../../../../modules/accessControl/getUserEmail.js";

export function initializeEditProduct() {
  // 1. Configuración inicial
  const editProductModal = document.getElementById("editProductModal");
  const editForm = document.getElementById("editForm");
  const debug = true; // Cambiar a false en producción

  // 2. Validación crítica de elementos principales
  if (!editProductModal || !editForm) {
    console.error("[EDIT-PRODUCT] Error: Elementos principales no encontrados");
    return;
  }

  // 3. Mapeo de elementos del formulario con selectores robustos
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

  // 4. Validación exhaustiva de elementos del formulario
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

  // 6. Variables de estado
  let currentProductId = null;
  let currentUserEmail = null;

  // 7. Configuración de event listeners
  const setupEventListeners = () => {
    // Listeners para cálculos en tiempo real
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

    // Listener para botones de limpieza
    editForm.querySelectorAll('[data-action="clear-input"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const targetId = e.target.dataset.target;
        const input = formElements[targetId];
        if (input) {
          input.value = '';
          handleCalculation();
        }
      });
    });

    // Listener principal para botones de edición
    document.addEventListener('click', handleEditButtonClick);

    // Listener para envío del formulario
    editForm.addEventListener('submit', handleFormSubmit);
  };

  // 8. Función principal de cálculo
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

  // 9. Manejo de clic en botones de edición
  const handleEditButtonClick = async (e) => {
    const editButton = e.target.closest('.edit-product-button');
    if (!editButton) return;

    try {
      currentProductId = editButton.dataset.id;
      currentUserEmail = await getUserEmail();

      if (!currentUserEmail) {
        showToast("Debes iniciar sesión para editar", "error");
        return;
      }

      const productRef = ref(database,
        `users/${currentUserEmail.replaceAll('.', '_')}/productData/${currentProductId}`
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

  // 10. Carga segura de datos en el formulario
  const loadProductData = (productData) => {
    try {
      // Asignación segura de valores
      const safeAssign = (element, value) => {
        if (element) element.value = value || '';
      };

      safeAssign(formElements.fecha, productData.fecha);
      safeAssign(formElements.empresa, productData.producto?.empresa);
      safeAssign(formElements.marca, productData.producto?.marca);
      safeAssign(formElements.descripcion, productData.producto?.descripcion);
      safeAssign(formElements.venta, productData.precio?.venta);
      safeAssign(formElements.costo, productData.precio?.costo);
      safeAssign(formElements.unidades, productData.precio?.unidades);
      safeAssign(formElements.itbms, productData.impuesto_descuento?.itbms);
      safeAssign(formElements.descuento, productData.impuesto_descuento?.descuento);

      handleCalculation();
    } catch (error) {
      console.error("[EDIT-PRODUCT] Error en carga de datos:", error);
      showToast("Error al cargar datos del producto", "error");
    }
  };

  // 11. Manejo de envío del formulario
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!currentProductId || !currentUserEmail) {
      showToast("Estado inválido para edición", "error");
      return;
    }

    if (!confirm("¿Confirmas la actualización de este producto?")) {
      showToast("Edición cancelada", "info");
      return;
    }

    try {
      const updatedData = buildUpdatedProductData();

      await updateProductInDatabase(updatedData);

      showToast("Producto actualizado exitosamente", "success");
      closeModalAndRefresh();
    } catch (error) {
      console.error("[EDIT-PRODUCT] Error al actualizar:", error);
      showToast("Error al actualizar el producto", "error");
    }
  };

  // 12. Construcción de datos actualizados
  const buildUpdatedProductData = () => ({
    fecha: formElements.fecha.value,
    producto: {
      empresa: formElements.empresa.value.trim(),
      marca: formElements.marca.value.trim(),
      descripcion: formElements.descripcion.value.trim()
    },
    precio: {
      venta: parseFloat(formElements.venta.value) || 0,
      costoUnitario: parseFloat(formElements.costoUnitario.value) || 0,
      costo: parseFloat(formElements.costo.value) || 0,
      ganancia: formElements.ganancia.value || "0",
      unidades: parseInt(formElements.unidades.value, 10) || 0,
      porcentaje: formElements.porcentaje.value || "0"
    },
    impuesto_descuento: {
      costoConItbmsDescuento: formElements.costoConItbmsDescuento.value || "0",
      itbms: parseInt(formElements.itbms.value, 10) || 0,
      descuento: parseFloat(formElements.descuento.value) || 0
    }
  });

  // 13. Actualización en base de datos
  const updateProductInDatabase = async (updatedData) => {
    const userRef = ref(database,
      `users/${currentUserEmail.replaceAll('.', '_')}/productData/${currentProductId}`
    );

    const globalRef = ref(database, `global/productData/${currentProductId}`);

    await Promise.all([
      update(userRef, updatedData),
      update(globalRef, {
        ...updatedData,
        actualizadoPor: currentUserEmail,
        ultimaActualizacion: new Date().toISOString()
      })
    ]);
  };

  // 14. Cierre del modal y actualización
  const closeModalAndRefresh = () => {
    try {
      const modalInstance = bootstrap.Modal.getInstance(editProductModal);
      if (modalInstance) modalInstance.hide();

      editForm.reset();

      window.dispatchEvent(new CustomEvent("refreshTable", {
        detail: {
          searchQuery: document.getElementById("searchInput")?.value || "",
          action: "edit"
        }
      }));
    } catch (error) {
      console.error("[EDIT-PRODUCT] Error al cerrar modal:", error);
    }
  };

  // 15. Inicialización final
  setupEventListeners();
};